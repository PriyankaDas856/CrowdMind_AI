"""CrowdMind AI - FastAPI backend."""
from __future__ import annotations

import logging
import os
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

from ai_service import AI_MODEL_NAME, analyze_project  # noqa: E402
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
# AI Analysis
# ----------------------------------------------------------------
@api_router.post("/projects/{project_id}/analyze")
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

    feedback_docs = await db.feedback.find(
        {"project_id": project_id}, {"_id": 0}
    ).to_list(2000)

    if len(feedback_docs) < 1:
        raise HTTPException(
            status_code=400,
            detail="Collect at least 1 feedback response before running analysis.",
        )

    try:
        result = await analyze_project(proj_doc, feedback_docs)
    except Exception as e:
        logger.exception("AI analysis failed")
        raise HTTPException(status_code=502, detail=f"AI analysis failed: {e}")

    # Persist per-feedback sentiment labels
    for item in result.get("per_feedback_sentiment", []):
        fid = item.get("feedback_id")
        sentiment = item.get("sentiment")
        if fid and sentiment:
            await db.feedback.update_one(
                {"feedback_id": fid}, {"$set": {"sentiment_label": sentiment}}
            )

    try:
        insight = AIInsight(
            project_id=project_id,
            validation_score=int(result["validation_score"]),
            demand_prediction=result["demand_prediction"],
            investor_readiness_score=int(result["investor_readiness_score"]),
            sentiment_breakdown=result["sentiment_breakdown"],
            purchase_intent_breakdown=result["purchase_intent_breakdown"],
            trends=result["trends"],
            pain_points=result["pain_points"],
            competitors=result["competitors"],
            business_models=result["business_models"],
            revenue_models=result["revenue_models"],
            customer_segments=result["customer_segments"],
            report=result["report"],
            pmf=result.get("pmf", {}),
            personas=result.get("personas", []),
            competitor_intel=result.get("competitor_intel", {}),
            investor=result.get("investor", {}),
            swot=result.get("swot", {}),
            bmc=result.get("bmc", {}),
            success_prediction=result.get("success_prediction", {}),
            pitch_deck_slides=result.get("pitch_deck_slides", []),
            total_responses=len(feedback_docs),
            model=AI_MODEL_NAME,
        )
    except Exception as e:
        logger.exception("AI output did not match schema")
        raise HTTPException(
            status_code=502, detail=f"AI returned malformed output: {e}"
        )

    await db.ai_insights.insert_one(insight.model_dump())
    innovation = (result.get("pmf") or {}).get("differentiation_score", 0) or 0
    await db.projects.update_one(
        {"project_id": project_id},
        {
            "$set": {
                "status": "analyzed",
                "updated_at": utc_now_iso(),
                "innovation_score": int(innovation),
            }
        },
    )
    await log_action(
        db, "project.analyze",
        user_id=current_user.user_id, user_email=current_user.email,
        resource=project_id,
        metadata={"validation_score": insight.validation_score},
    )
    return insight.model_dump()


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
    scores = []

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
            scores.append(ins["validation_score"])
            analyzed_count += 1
        if scores:
            avg_score = round(sum(scores) / len(scores))

    return {
        "total_projects": total_projects,
        "total_responses": total_responses,
        "avg_validation_score": avg_score,
        "analyzed_projects": analyzed_count,
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


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


_ = (Counter, datetime, timezone)
