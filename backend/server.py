"""CrowdMind AI - FastAPI backend."""
from __future__ import annotations

import asyncio
import logging
import os
import uuid
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import List

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, FastAPI, HTTPException, Request
from fastapi.responses import Response
from motor.motor_asyncio import AsyncIOMotorClient
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import JSONResponse

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

from ai_service import (  # noqa: E402
    AI_MODEL_NAME,
    analyze_bmc,
    analyze_competitor_intel,
    analyze_investor,
    analyze_overview,
    analyze_personas,
    analyze_pmf,
    analyze_success,
    analyze_swot,
)
from audit import log_action  # noqa: E402
from auth import auth_router, get_current_user, get_db  # noqa: E402
from extras import admin_router, battle_router, leaderboard_router  # noqa: E402
from founder import router as founder_router  # noqa: E402
from models import (  # noqa: E402
    AIInsight,
    Feedback,
    FeedbackCreate,
    Project,
    ProjectCreate,
    PublishPayload,
    User,
    utc_now_iso,
)
from pdf_service import build_project_pdf  # noqa: E402
from seed_demo import demo_already_seeded, seed_demo_environment  # noqa: E402

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("crowdmind")

# MongoDB
mongo_url = os.environ["MONGO_URL"]
db_name = os.environ["DB_NAME"]
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# Rate limiter
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="CrowdMind AI", version="0.2.0")
app.state.db = db
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)


@app.exception_handler(RateLimitExceeded)
async def _rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Too many requests. Please slow down."},
    )


api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root():
    return {"app": "CrowdMind AI", "status": "ok", "version": "0.2.0"}


# ----------------------------------------------------------------
# Projects
# ----------------------------------------------------------------
projects_router = APIRouter(prefix="/projects", tags=["projects"])


@projects_router.post("", response_model=Project)
async def create_project(
    payload: ProjectCreate, current_user: User = Depends(get_current_user)
):
    project = Project(
        owner_id=current_user.user_id,
        name=payload.name.strip(),
        category=payload.category.strip(),
        description=payload.description.strip(),
        target_audience=payload.target_audience.strip(),
        location=payload.location.strip(),
    )
    await db.projects.insert_one(project.model_dump())
    await log_action(
        db, "project.create",
        user_id=current_user.user_id, user_email=current_user.email,
        resource=project.project_id,
    )
    return project


@projects_router.get("", response_model=List[Project])
async def list_my_projects(current_user: User = Depends(get_current_user)):
    docs = (
        await db.projects.find({"owner_id": current_user.user_id}, {"_id": 0})
        .sort("created_at", -1)
        .to_list(500)
    )
    return [Project(**d) for d in docs]


@projects_router.get("/{project_id}")
async def get_project(project_id: str, current_user: User = Depends(get_current_user)):
    doc = await db.projects.find_one(
        {"project_id": project_id, "owner_id": current_user.user_id}, {"_id": 0}
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Project not found")
    project = Project(**doc)

    feedback_docs = (
        await db.feedback.find({"project_id": project_id}, {"_id": 0})
        .sort("created_at", -1)
        .to_list(2000)
    )
    feedback = [Feedback(**f) for f in feedback_docs]

    insight_doc = await db.ai_insights.find_one(
        {"project_id": project_id}, {"_id": 0}, sort=[("generated_at", -1)]
    )
    insight = AIInsight(**insight_doc) if insight_doc else None

    return {
        "project": project.model_dump(),
        "feedback": [f.model_dump() for f in feedback],
        "insight": insight.model_dump() if insight else None,
        "feedback_count": len(feedback),
    }


@projects_router.delete("/{project_id}")
async def delete_project(
    project_id: str, current_user: User = Depends(get_current_user)
):
    res = await db.projects.delete_one(
        {"project_id": project_id, "owner_id": current_user.user_id}
    )
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    await db.feedback.delete_many({"project_id": project_id})
    await db.ai_insights.delete_many({"project_id": project_id})
    await log_action(
        db, "project.delete",
        user_id=current_user.user_id, user_email=current_user.email,
        resource=project_id,
    )
    return {"ok": True}


@projects_router.post("/{project_id}/publish")
async def toggle_publish(
    project_id: str,
    payload: PublishPayload,
    current_user: User = Depends(get_current_user),
):
    res = await db.projects.update_one(
        {"project_id": project_id, "owner_id": current_user.user_id},
        {"$set": {"is_public": bool(payload.is_public), "updated_at": utc_now_iso()}},
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    await log_action(
        db, "project.publish" if payload.is_public else "project.unpublish",
        user_id=current_user.user_id, user_email=current_user.email,
        resource=project_id,
    )
    return {"is_public": payload.is_public}


@projects_router.get("/{project_id}/report.pdf")
async def download_report_pdf(
    project_id: str, current_user: User = Depends(get_current_user)
):
    proj = await db.projects.find_one(
        {"project_id": project_id, "owner_id": current_user.user_id}, {"_id": 0}
    )
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    insight = await db.ai_insights.find_one(
        {"project_id": project_id}, {"_id": 0}, sort=[("generated_at", -1)]
    )
    if not insight:
        raise HTTPException(
            status_code=400, detail="Run AI analysis before exporting the report."
        )
    pdf_bytes = build_project_pdf(proj, insight)
    await log_action(
        db, "project.report.pdf",
        user_id=current_user.user_id, user_email=current_user.email,
        resource=project_id,
    )
    safe_name = "".join(c if c.isalnum() else "_" for c in proj["name"])[:40] or "report"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="CrowdMind_{safe_name}.pdf"'
        },
    )


# ----------------------------------------------------------------
# Public project lookup (for feedback page)
# ----------------------------------------------------------------
@api_router.get("/public/projects/{public_link_id}")
async def get_public_project(public_link_id: str):
    doc = await db.projects.find_one({"public_link_id": public_link_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Project not found")
    project = Project(**doc)
    return {
        "project_id": project.project_id,
        "name": project.name,
        "category": project.category,
        "description": project.description,
        "target_audience": project.target_audience,
        "location": project.location,
        "public_link_id": project.public_link_id,
    }


# ----------------------------------------------------------------
# Feedback
# ----------------------------------------------------------------
feedback_router = APIRouter(prefix="/projects/{project_id}/feedback", tags=["feedback"])


@feedback_router.post("", response_model=Feedback)
async def submit_feedback(
    project_id: str,
    payload: FeedbackCreate,
    current_user: User = Depends(get_current_user),
):
    proj = await db.projects.find_one({"project_id": project_id}, {"_id": 0})
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    # Dedupe by user_id
    existing = await db.feedback.find_one(
        {"project_id": project_id, "user_id": current_user.user_id}, {"_id": 0}
    )
    if existing:
        raise HTTPException(
            status_code=409, detail="You have already submitted feedback for this project"
        )

    fb = Feedback(
        project_id=project_id,
        user_id=current_user.user_id,
        user_name=current_user.name,
        rating=payload.rating,
        feedback_text=payload.feedback_text.strip(),
        suggestion=(payload.suggestion or "").strip(),
        purchase_intent=payload.purchase_intent,
    )
    await db.feedback.insert_one(fb.model_dump())
    await db.projects.update_one(
        {"project_id": project_id}, {"$set": {"updated_at": utc_now_iso()}}
    )
    return fb


@feedback_router.get("", response_model=List[Feedback])
async def list_feedback(
    project_id: str, current_user: User = Depends(get_current_user)
):
    proj = await db.projects.find_one(
        {"project_id": project_id, "owner_id": current_user.user_id}, {"_id": 0}
    )
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    docs = (
        await db.feedback.find({"project_id": project_id}, {"_id": 0})
        .sort("created_at", -1)
        .to_list(2000)
    )
    return [Feedback(**d) for d in docs]


# ----------------------------------------------------------------
# AI Analysis (async modular job pattern — avoids proxy timeouts)
# ----------------------------------------------------------------
ANALYSIS_MODULES = [
    # (module_key_in_insight, display_label, runner_factory)
    ("pmf",                "Product-Market Fit",       analyze_pmf),
    ("personas",           "Customer Personas",        analyze_personas),
    ("competitor_intel",   "Competitor Intelligence",  analyze_competitor_intel),
    ("investor",           "Investor Readiness",       analyze_investor),
    ("swot",               "SWOT Analysis",            analyze_swot),
    ("bmc",                "Business Model Canvas",    analyze_bmc),
    ("success_prediction", "Success Forecast",         analyze_success),
    ("_overview",          "Market Validation Report", analyze_overview),
]

# Top-level fields written by the "_overview" module (everything else lives under module_key)
OVERVIEW_TOP_FIELDS = {
    "validation_score", "demand_prediction", "sentiment_breakdown",
    "purchase_intent_breakdown", "trends", "pain_points", "competitors",
    "business_models", "revenue_models", "customer_segments", "report",
    "pitch_deck_slides",
}


async def _run_analysis_job(
    job_id: str,
    project_id: str,
    user_id: str,
    user_email: str,
) -> None:
    """Background worker: run all 8 modules in parallel with per-module progress.

    - Each module is independent and fault-tolerant: a failure in one module is
      logged but does not block others. The final job status becomes "partial".
    - Results are persisted incrementally so the frontend can render anything
      that has finished, even mid-flight.
    - The insight document is keyed by (project_id, job_id) and finalized at the
      end. The most recent finalized insight per project is what the UI reads.
    """
    try:
        proj_doc = await db.projects.find_one(
            {"project_id": project_id, "owner_id": user_id}, {"_id": 0}
        )
        if not proj_doc:
            await db.analysis_jobs.update_one(
                {"job_id": job_id},
                {"$set": {"status": "failed",
                          "error_message": "Project not found",
                          "completed_at": utc_now_iso(),
                          "updated_at": utc_now_iso()}},
            )
            return

        feedback_docs = await db.feedback.find(
            {"project_id": project_id}, {"_id": 0}
        ).to_list(2000)

        await db.analysis_jobs.update_one(
            {"job_id": job_id},
            {"$set": {"status": "processing",
                      "progress": 5,
                      "current_module": "Initializing AI pipeline",
                      "updated_at": utc_now_iso()}},
        )

        # Seed a draft insight document we will incrementally fill in
        insight_id = f"ins_{uuid.uuid4().hex[:12]}"
        skeleton = {
            "insight_id": insight_id,
            "project_id": project_id,
            "job_id": job_id,
            "total_responses": len(feedback_docs),
            "model": AI_MODEL_NAME,
            "generated_at": utc_now_iso(),
            "validation_score": 0,
            "demand_prediction": "Low",
            "investor_readiness_score": 0,
            "sentiment_breakdown": {"positive": 0, "neutral": 0, "negative": 0},
            "purchase_intent_breakdown": {},
            "trends": [], "pain_points": [], "competitors": [],
            "business_models": [], "revenue_models": [], "customer_segments": [],
            "report": {},
            "pmf": {}, "personas": [], "competitor_intel": {},
            "investor": {}, "swot": {}, "bmc": {},
            "success_prediction": {}, "pitch_deck_slides": [],
        }
        await db.ai_insights.update_one(
            {"project_id": project_id, "job_id": job_id},
            {"$setOnInsert": skeleton},
            upsert=True,
        )

        total = len(ANALYSIS_MODULES)
        completed_count = 0

        async def _run_one(module_key: str, label: str, runner) -> tuple[str, str, str | None]:
            nonlocal completed_count
            # Announce start
            await db.analysis_jobs.update_one(
                {"job_id": job_id},
                {"$set": {"current_module": label, "updated_at": utc_now_iso()}},
            )
            try:
                result = await runner(proj_doc, feedback_docs)

                # Persist results
                if module_key == "_overview":
                    # Merge top-level fields directly into the insight
                    overview_set = {}
                    for k in OVERVIEW_TOP_FIELDS:
                        if k in result:
                            overview_set[k] = result[k]
                    overview_set["updated_at"] = utc_now_iso()
                    if overview_set:
                        await db.ai_insights.update_one(
                            {"project_id": project_id, "job_id": job_id},
                            {"$set": overview_set},
                        )
                    # Per-feedback sentiment labels
                    for item in result.get("per_feedback_sentiment", []) or []:
                        fid = item.get("feedback_id")
                        sentiment = item.get("sentiment")
                        if fid and sentiment:
                            await db.feedback.update_one(
                                {"feedback_id": fid},
                                {"$set": {"sentiment_label": sentiment}},
                            )
                elif module_key == "personas":
                    await db.ai_insights.update_one(
                        {"project_id": project_id, "job_id": job_id},
                        {"$set": {"personas": result.get("personas", []),
                                  "updated_at": utc_now_iso()}},
                    )
                elif module_key == "investor":
                    # Also mirror legacy `investor_readiness_score`
                    await db.ai_insights.update_one(
                        {"project_id": project_id, "job_id": job_id},
                        {"$set": {
                            "investor": result,
                            "investor_readiness_score": int(
                                result.get("investor_readiness_score", 0)
                            ),
                            "updated_at": utc_now_iso(),
                        }},
                    )
                elif module_key == "competitor_intel":
                    # Mirror simplified competitors list for legacy field
                    simple = [
                        {"name": c["name"],
                         "strengths": c.get("strengths", ""),
                         "weaknesses": c.get("weaknesses", "")}
                        for c in result.get("table", []) or []
                    ]
                    set_payload = {"competitor_intel": result,
                                   "updated_at": utc_now_iso()}
                    if simple:
                        set_payload["competitors"] = simple
                    await db.ai_insights.update_one(
                        {"project_id": project_id, "job_id": job_id},
                        {"$set": set_payload},
                    )
                else:
                    await db.ai_insights.update_one(
                        {"project_id": project_id, "job_id": job_id},
                        {"$set": {module_key: result, "updated_at": utc_now_iso()}},
                    )

                completed_count += 1
                progress = int(round(5 + (completed_count / total) * 90))
                await db.analysis_jobs.update_one(
                    {"job_id": job_id},
                    {"$set": {"progress": progress, "updated_at": utc_now_iso()},
                     "$push": {"completed_modules": label}},
                )
                return (module_key, "ok", None)
            except Exception as e:
                completed_count += 1
                progress = int(round(5 + (completed_count / total) * 90))
                err = str(e)[:300]
                logger.exception("Module %s failed", label)
                await db.analysis_jobs.update_one(
                    {"job_id": job_id},
                    {"$set": {"progress": progress, "updated_at": utc_now_iso()},
                     "$push": {"failed_modules": {"module": label, "error": err}}},
                )
                return (module_key, "failed", err)

        # Launch all modules concurrently. Even if one throws unexpectedly,
        # gather(...) collects results because we catch inside _run_one.
        tasks = [_run_one(k, lbl, r) for (k, lbl, r) in ANALYSIS_MODULES]
        results = await asyncio.gather(*tasks)

        ok = [r for r in results if r[1] == "ok"]
        failed = [r for r in results if r[1] == "failed"]

        if not ok:
            final_status = "failed"
        elif failed:
            final_status = "partial"
        else:
            final_status = "done"

        # Finalize: read full insight, mirror innovation_score onto project
        insight = await db.ai_insights.find_one(
            {"project_id": project_id, "job_id": job_id}, {"_id": 0}
        ) or {}
        innovation = (insight.get("pmf") or {}).get("differentiation_score", 0) or 0
        await db.projects.update_one(
            {"project_id": project_id},
            {"$set": {
                "status": "analyzed" if final_status != "failed" else "collecting",
                "updated_at": utc_now_iso(),
                "innovation_score": int(innovation),
            }},
        )
        await db.analysis_jobs.update_one(
            {"job_id": job_id},
            {"$set": {
                "status": final_status,
                "progress": 100,
                "current_module": "Complete" if final_status != "failed" else "Failed",
                "completed_at": utc_now_iso(),
                "updated_at": utc_now_iso(),
                "result_reference": insight_id,
            }},
        )
        await log_action(
            db, "project.analyze",
            user_id=user_id, user_email=user_email,
            resource=project_id,
            metadata={
                "job_id": job_id,
                "status": final_status,
                "modules_ok": [r[0] for r in ok],
                "modules_failed": [r[0] for r in failed],
            },
        )

    except Exception as e:
        logger.exception("Analysis job %s crashed", job_id)
        await db.analysis_jobs.update_one(
            {"job_id": job_id},
            {"$set": {"status": "failed",
                      "error_message": str(e)[:500],
                      "completed_at": utc_now_iso(),
                      "updated_at": utc_now_iso()}},
        )


@api_router.post("/projects/{project_id}/analyze", status_code=202)
@limiter.limit("10/minute")
async def run_analysis(
    request: Request,
    project_id: str,
    current_user: User = Depends(get_current_user),
):
    proj_doc = await db.projects.find_one(
        {"project_id": project_id, "owner_id": current_user.user_id}, {"_id": 0}
    )
    if not proj_doc:
        raise HTTPException(status_code=404, detail="Project not found")

    fb_count = await db.feedback.count_documents({"project_id": project_id})
    if fb_count < 1:
        raise HTTPException(
            status_code=400,
            detail="Collect at least 1 feedback response before running analysis.",
        )

    # Reuse an already-running job if present
    in_flight = await db.analysis_jobs.find_one(
        {"project_id": project_id, "status": {"$in": ["queued", "processing"]}},
        {"_id": 0},
    )
    if in_flight:
        return {
            "success": True,
            "job_id": in_flight["job_id"],
            "status": in_flight["status"],
            "message": "Analysis already in progress",
        }

    job_id = f"job_{uuid.uuid4().hex[:14]}"
    now = utc_now_iso()
    await db.analysis_jobs.insert_one(
        {
            "job_id": job_id,
            "project_id": project_id,
            "owner_id": current_user.user_id,
            "status": "queued",
            "progress": 0,
            "current_module": "Queued",
            "completed_modules": [],
            "failed_modules": [],
            "started_at": now,
            "completed_at": None,
            "error_message": None,
            "result_reference": None,
            "created_at": now,
            "updated_at": now,
        }
    )
    asyncio.create_task(
        _run_analysis_job(job_id, project_id, current_user.user_id, current_user.email)
    )
    await log_action(
        db, "project.analyze.queued",
        user_id=current_user.user_id, user_email=current_user.email,
        resource=project_id, metadata={"job_id": job_id},
    )
    return {
        "success": True,
        "job_id": job_id,
        "status": "queued",
        "message": "Analysis started",
    }


@api_router.get("/analyze/status/{job_id}")
async def analyze_status(
    job_id: str, current_user: User = Depends(get_current_user)
):
    job = await db.analysis_jobs.find_one({"job_id": job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.get("owner_id") and job["owner_id"] != current_user.user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return {
        "job_id": job["job_id"],
        "project_id": job["project_id"],
        "status": job["status"],
        "progress": job.get("progress", 0),
        "current_module": job.get("current_module"),
        "completed_modules": job.get("completed_modules", []),
        "failed_modules": job.get("failed_modules", []),
        "started_at": job.get("started_at"),
        "completed_at": job.get("completed_at"),
        "error_message": job.get("error_message"),
    }


@api_router.get("/analyze/result/{job_id}")
async def analyze_result(
    job_id: str, current_user: User = Depends(get_current_user)
):
    job = await db.analysis_jobs.find_one({"job_id": job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.get("owner_id") and job["owner_id"] != current_user.user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    insight = await db.ai_insights.find_one(
        {"project_id": job["project_id"], "job_id": job_id}, {"_id": 0}
    )
    return {
        "job_id": job["job_id"],
        "status": job["status"],
        "progress": job.get("progress", 0),
        "current_module": job.get("current_module"),
        "completed_modules": job.get("completed_modules", []),
        "failed_modules": job.get("failed_modules", []),
        "insight": insight,
    }


# Legacy endpoint kept for backward compatibility
@api_router.get("/projects/{project_id}/analyze/jobs/{job_id}")
async def analysis_job_status_legacy(
    project_id: str,
    job_id: str,
    current_user: User = Depends(get_current_user),
):
    return await analyze_result(job_id, current_user)


# ----------------------------------------------------------------
# Dashboard stats
# ----------------------------------------------------------------
@api_router.get("/dashboard/stats")
async def dashboard_stats(current_user: User = Depends(get_current_user)):
    projects = await db.projects.find(
        {"owner_id": current_user.user_id}, {"_id": 0}
    ).to_list(500)
    project_ids = [p["project_id"] for p in projects]

    total_projects = len(projects)
    total_responses = 0
    avg_score = 0
    analyzed_count = 0
    scores: List[int] = []
    pmf_scores: List[int] = []
    investor_scores: List[int] = []
    success_scores: List[int] = []

    if project_ids:
        total_responses = await db.feedback.count_documents(
            {"project_id": {"$in": project_ids}}
        )
        insights = await db.ai_insights.find(
            {"project_id": {"$in": project_ids}}, {"_id": 0}
        ).to_list(500)
        latest_by_project = {}
        for ins in insights:
            cur = latest_by_project.get(ins["project_id"])
            if not cur or ins["generated_at"] > cur["generated_at"]:
                latest_by_project[ins["project_id"]] = ins
        for ins in latest_by_project.values():
            scores.append(int(ins.get("validation_score", 0) or 0))
            pmf_scores.append(int((ins.get("pmf") or {}).get("pmf_score", 0) or 0))
            investor_scores.append(
                int((ins.get("investor") or {}).get(
                    "investor_readiness_score",
                    ins.get("investor_readiness_score", 0),
                ) or 0)
            )
            success_scores.append(
                int((ins.get("success_prediction") or {}).get(
                    "one_year_probability", 0) or 0)
            )
            analyzed_count += 1
        if scores:
            avg_score = round(sum(scores) / len(scores))

    def _avg(xs):
        return round(sum(xs) / len(xs)) if xs else 0

    avg_pmf = _avg(pmf_scores)
    avg_investor = _avg(investor_scores)
    avg_success = _avg(success_scores)

    # Composite Startup Health Score — equal weighting of the four signals
    components = [avg_score, avg_pmf, avg_investor, avg_success]
    non_zero = [c for c in components if c > 0]
    startup_health_score = round(sum(non_zero) / len(non_zero)) if non_zero else 0

    return {
        "total_projects": total_projects,
        "total_responses": total_responses,
        "avg_validation_score": avg_score,
        "avg_pmf_score": avg_pmf,
        "avg_investor_score": avg_investor,
        "avg_success_probability": avg_success,
        "analyzed_projects": analyzed_count,
        "startup_health_score": startup_health_score,
        "health_breakdown": {
            "validation": avg_score,
            "pmf": avg_pmf,
            "investor": avg_investor,
            "success_1y": avg_success,
        },
    }


# ----------------------------------------------------------------
# Register routers
# ----------------------------------------------------------------
api_router.include_router(auth_router)
api_router.include_router(projects_router)
api_router.include_router(feedback_router)
api_router.include_router(founder_router)
api_router.include_router(battle_router)
api_router.include_router(leaderboard_router)
api_router.include_router(admin_router)
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def _startup_seed():
    try:
        if not await demo_already_seeded(db):
            manifest = await seed_demo_environment(db)
            logger.info("Demo environment seeded: %s", manifest)
        else:
            logger.info("Demo environment already seeded — skipping.")
    except Exception:
        logger.exception("Demo seed failed (non-fatal).")


@api_router.post("/demo/seed")
async def demo_seed(current_user: User = Depends(get_current_user)):
    """Idempotent demo seed (admin or first-call). All data is clearly labeled demo."""
    if current_user.role != "admin":
        # Allow if no demo data exists yet (first-time setup convenience)
        if await demo_already_seeded(db):
            raise HTTPException(status_code=403, detail="Admin role required")
    return await seed_demo_environment(db)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


_ = (Counter, datetime, timezone)
