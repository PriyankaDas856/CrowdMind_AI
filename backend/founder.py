"""Founder Twin AI routes (Module 9)."""
from __future__ import annotations

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from ai_service import analyze_founder
from audit import log_action
from auth import get_current_user, get_db
from models import (
    FounderInsight,
    FounderProfile,
    FounderProfilePayload,
    User,
    utc_now_iso,
)

router = APIRouter(prefix="/founder", tags=["founder"])


@router.get("/profile")
async def get_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Returns the founder profile FLAT (or null if none)."""
    doc = await db.founder_profiles.find_one(
        {"user_id": current_user.user_id}, {"_id": 0}
    )
    return doc  # null if not yet created


@router.get("/insight")
async def get_insight(
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Returns the latest founder insight FLAT (or null if none)."""
    doc = await db.founder_insights.find_one(
        {"user_id": current_user.user_id}, {"_id": 0}, sort=[("generated_at", -1)]
    )
    return doc


@router.post("/profile")
async def upsert_profile(
    payload: FounderProfilePayload,
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    profile = FounderProfile(
        user_id=current_user.user_id,
        budget=payload.budget,
        skills=payload.skills,
        experience_years=payload.experience_years,
        industry_interests=payload.industry_interests,
        risk_appetite=payload.risk_appetite,
        time_availability=payload.time_availability,
        prior_startups=payload.prior_startups,
    )
    await db.founder_profiles.update_one(
        {"user_id": current_user.user_id},
        {"$set": {**profile.model_dump(), "updated_at": utc_now_iso()}},
        upsert=True,
    )
    await log_action(
        db, "founder.profile.upsert",
        user_id=current_user.user_id, user_email=current_user.email,
    )
    return profile


@router.post("/analyze")
async def analyze(
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    doc = await db.founder_profiles.find_one(
        {"user_id": current_user.user_id}, {"_id": 0}
    )
    if not doc:
        raise HTTPException(
            status_code=400, detail="Create your founder profile first."
        )
    try:
        result = await analyze_founder(doc)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI analysis failed: {e}")

    insight = FounderInsight(
        user_id=current_user.user_id,
        founder_score=int(result["founder_score"]),
        strengths=result["strengths"],
        weaknesses=result["weaknesses"],
        recommended_industries=result["recommended_industries"],
        recommended_startup_types=result["recommended_startup_types"],
        advice=result["advice"],
    )
    await db.founder_insights.insert_one(insight.model_dump())
    await log_action(
        db, "founder.analyze",
        user_id=current_user.user_id, user_email=current_user.email,
    )
    return insight.model_dump()


_ = (datetime, timezone)
