"""Idempotent demo seeder.

Populates the database with 4 fully-analyzed sample projects + 30 synthetic
feedback responses each so dashboards, charts, reports, and the leaderboard
render immediately after deployment.

ALL data is marked Synthetic / Demo Data via `is_demo=True` on each project
and via the `_demo_label` field embedded in each insight document.
"""
from __future__ import annotations

import logging
from typing import Dict, List

from motor.motor_asyncio import AsyncIOMotorDatabase

from auth import hash_password
from demo_feedback import FEEDBACK_DATA
from demo_insights import INSIGHTS
from models import AIInsight, Feedback, Project, User, utc_now_iso

logger = logging.getLogger(__name__)

DEMO_USER = {
    "email": "demo@crowdmind.io",
    "name": "CrowdMind Demo Founder",
    "password": "DemoUser123!",
}

PROJECT_CONFIGS = [
    {
        "key": "medpass",
        "name": "MedPass",
        "category": "HealthTech",
        "description": "AI-powered digital healthcare passport with centralized medical records, emergency QR access, and AI-assisted medical document interpretation.",
        "target_audience": "Caregivers, nomads, chronic-care patients",
        "location": "Global (US-first)",
    },
    {
        "key": "fitgenie",
        "name": "FitGenie AI",
        "category": "FitnessTech",
        "description": "AI-powered fitness and nutrition platform designed for college students — budget-aware meal planning, dorm-equipment workouts, and academic-calendar adaptation.",
        "target_audience": "College students (18–28)",
        "location": "US universities",
    },
    {
        "key": "fleetbrain",
        "name": "FleetBrain AI",
        "category": "Transportation Technology",
        "description": "AI-powered route optimization, demand forecasting, and fleet intelligence platform for public transportation systems.",
        "target_audience": "Mid-size transit agencies & demand-response operators",
        "location": "North America",
    },
    {
        "key": "skillswap",
        "name": "SkillSwap",
        "category": "EdTech",
        "description": "Peer-to-peer skill exchange platform where users teach skills in exchange for learning other skills — AI matches by skill, vibe, and goals.",
        "target_audience": "Career-pivoters, creators, language learners",
        "location": "Global",
    },
]


async def _ensure_demo_user(db: AsyncIOMotorDatabase) -> User:
    existing = await db.users.find_one({"email": DEMO_USER["email"]}, {"_id": 0})
    if existing:
        return User(**existing)
    user = User(
        email=DEMO_USER["email"],
        name=DEMO_USER["name"],
        password_hash=hash_password(DEMO_USER["password"]),
        auth_provider="jwt",
        role="user",
    )
    await db.users.insert_one(user.model_dump())
    return user


async def _seed_project(
    db: AsyncIOMotorDatabase,
    owner: User,
    cfg: Dict[str, str],
) -> Dict[str, str]:
    key = cfg["key"]

    existing = await db.projects.find_one(
        {"owner_id": owner.user_id, "name": cfg["name"], "is_demo": True}, {"_id": 0}
    )
    if existing:
        return {"project_id": existing["project_id"], "skipped": "already exists"}

    fb_list = FEEDBACK_DATA[key]
    insight_data = INSIGHTS[key]

    # Mirror innovation_score from differentiation_score
    innovation = (insight_data.get("pmf") or {}).get("differentiation_score", 0) or 0

    project = Project(
        owner_id=owner.user_id,
        name=cfg["name"],
        category=cfg["category"],
        description=cfg["description"],
        target_audience=cfg["target_audience"],
        location=cfg["location"],
        is_public=True,
        is_demo=True,
        status="analyzed",
        innovation_score=int(innovation),
        community_likes=12 + int(innovation) // 6,  # pleasant pre-seeded count
    )
    await db.projects.insert_one(project.model_dump())

    # Synthetic feedback (deterministic ids per project)
    feedback_docs: List[dict] = []
    for idx, (rating, intent, sentiment, name, text, sugg) in enumerate(fb_list):
        fb = Feedback(
            feedback_id=f"fb_demo_{key}_{idx:02d}",
            project_id=project.project_id,
            user_id="demo_reviewer",
            user_name=f"{name} (Demo)",
            rating=rating,
            feedback_text=text,
            suggestion=sugg,
            purchase_intent=intent,
            sentiment_label=sentiment,
        )
        feedback_docs.append(fb.model_dump())
    if feedback_docs:
        await db.feedback.insert_many(feedback_docs)

    # Insight (pre-computed Sample AI Analysis)
    insight = AIInsight(
        project_id=project.project_id,
        validation_score=insight_data["validation_score"],
        demand_prediction=insight_data["demand_prediction"],
        investor_readiness_score=insight_data["investor_readiness_score"],
        sentiment_breakdown=insight_data["sentiment_breakdown"],
        purchase_intent_breakdown=insight_data["purchase_intent_breakdown"],
        trends=insight_data["trends"],
        pain_points=insight_data["pain_points"],
        competitors=insight_data["competitors"],
        business_models=insight_data["business_models"],
        revenue_models=insight_data["revenue_models"],
        customer_segments=insight_data["customer_segments"],
        report=insight_data["report"],
        pmf=insight_data["pmf"],
        personas=insight_data["personas"],
        competitor_intel=insight_data["competitor_intel"],
        investor=insight_data["investor"],
        swot=insight_data["swot"],
        bmc=insight_data["bmc"],
        success_prediction=insight_data["success_prediction"],
        pitch_deck_slides=insight_data["pitch_deck_slides"],
        total_responses=len(feedback_docs),
        model="demo-sample-analysis-v1",
    )
    insight_doc = insight.model_dump()
    insight_doc["_demo_label"] = insight_data.get("_demo_label", "Sample AI Analysis")
    await db.ai_insights.insert_one(insight_doc)

    logger.info("Seeded demo project '%s' with %d feedback", cfg["name"], len(feedback_docs))
    return {
        "project_id": project.project_id,
        "name": cfg["name"],
        "feedback": len(feedback_docs),
    }


async def seed_demo_environment(db: AsyncIOMotorDatabase) -> dict:
    """Idempotent. Returns a manifest of what was seeded."""
    user = await _ensure_demo_user(db)
    results = []
    for cfg in PROJECT_CONFIGS:
        info = await _seed_project(db, user, cfg)
        results.append(info)
    return {
        "demo_user": {"email": DEMO_USER["email"], "user_id": user.user_id},
        "projects": results,
        "note": "All data is synthetic and labeled Demo Data / Sample AI Analysis.",
        "seeded_at": utc_now_iso(),
    }


async def demo_already_seeded(db: AsyncIOMotorDatabase) -> bool:
    return (await db.projects.count_documents({"is_demo": True})) >= len(PROJECT_CONFIGS)
