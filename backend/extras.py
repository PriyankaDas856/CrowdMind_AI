"""Idea Battle Mode (Module 10) + Leaderboard (Module 11) + Admin (RBAC)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from ai_service import battle_ideas
from audit import log_action
from auth import get_current_user, get_db
from models import BattleRequest, PublishPayload, User


# ---------------- Battle ----------------
battle_router = APIRouter(prefix="/battle", tags=["battle"])


@battle_router.post("")
async def battle(
    payload: BattleRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    if payload.project_a_id == payload.project_b_id:
        raise HTTPException(status_code=400, detail="Pick two different projects.")

    pa = await db.projects.find_one(
        {"project_id": payload.project_a_id, "owner_id": current_user.user_id},
        {"_id": 0},
    )
    pb = await db.projects.find_one(
        {"project_id": payload.project_b_id, "owner_id": current_user.user_id},
        {"_id": 0},
    )
    if not pa or not pb:
        raise HTTPException(status_code=404, detail="Project not found.")

    ia = await db.ai_insights.find_one(
        {"project_id": pa["project_id"]}, {"_id": 0}, sort=[("generated_at", -1)]
    )
    ib = await db.ai_insights.find_one(
        {"project_id": pb["project_id"]}, {"_id": 0}, sort=[("generated_at", -1)]
    )

    try:
        result = await battle_ideas(pa, pb, ia, ib)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI battle failed: {e}")

    # Map winner letter → project name
    winner = result.get("winner", "TIE")
    if winner == "A":
        result["winner_name"] = pa["name"]
    elif winner == "B":
        result["winner_name"] = pb["name"]
    else:
        result["winner_name"] = "Tie"

    result["project_a"] = {"id": pa["project_id"], "name": pa["name"]}
    result["project_b"] = {"id": pb["project_id"], "name": pb["name"]}

    await log_action(
        db, "battle.compare",
        user_id=current_user.user_id, user_email=current_user.email,
        metadata={"a": pa["project_id"], "b": pb["project_id"], "winner": winner},
    )
    return result


# ---------------- Leaderboard ----------------
leaderboard_router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])


@leaderboard_router.get("")
async def leaderboard(
    sort: str = "validation",
    limit: int = 20,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Public leaderboard. sort: validation | investor | pmf | innovation."""
    limit = max(1, min(50, limit))

    public_projects = await db.projects.find(
        {"is_public": True, "status": "analyzed"}, {"_id": 0}
    ).to_list(500)
    if not public_projects:
        return {"items": [], "sort": sort}

    proj_ids = [p["project_id"] for p in public_projects]
    insights = await db.ai_insights.find(
        {"project_id": {"$in": proj_ids}}, {"_id": 0}
    ).to_list(2000)

    # Latest insight per project
    latest = {}
    for ins in insights:
        cur = latest.get(ins["project_id"])
        if not cur or ins["generated_at"] > cur["generated_at"]:
            latest[ins["project_id"]] = ins

    items = []
    for p in public_projects:
        ins = latest.get(p["project_id"])
        if not ins:
            continue
        pmf = ins.get("pmf", {}) or {}
        investor = ins.get("investor", {}) or {}
        items.append(
            {
                "project_id": p["project_id"],
                "public_link_id": p["public_link_id"],
                "name": p["name"],
                "category": p["category"],
                "description": p["description"],
                "validation_score": ins.get("validation_score", 0),
                "investor_score": investor.get(
                    "investor_readiness_score",
                    ins.get("investor_readiness_score", 0),
                ),
                "pmf_score": pmf.get("pmf_score", 0),
                "innovation_score": pmf.get("differentiation_score", 0),
                "community_likes": p.get("community_likes", 0),
                "total_responses": ins.get("total_responses", 0),
                "demand_prediction": ins.get("demand_prediction", "Low"),
            }
        )

    sort_keys = {
        "validation": "validation_score",
        "investor": "investor_score",
        "pmf": "pmf_score",
        "innovation": "innovation_score",
        "community": "community_likes",
        "trending": "total_responses",
    }
    key = sort_keys.get(sort, "validation_score")
    items.sort(key=lambda x: x.get(key, 0), reverse=True)
    return {"items": items[:limit], "sort": sort}


@leaderboard_router.post("/like/{public_link_id}")
async def like(public_link_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Anyone can like a public project (no rate limiting beyond global)."""
    res = await db.projects.update_one(
        {"public_link_id": public_link_id, "is_public": True},
        {"$inc": {"community_likes": 1}},
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    doc = await db.projects.find_one(
        {"public_link_id": public_link_id}, {"_id": 0, "community_likes": 1}
    )
    return {"community_likes": doc["community_likes"] if doc else 0}


# ---------------- Admin (RBAC) ----------------
admin_router = APIRouter(prefix="/admin", tags=["admin"])


async def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin role required")
    return user


@admin_router.get("/audit-logs")
async def audit_logs(
    limit: int = 100,
    _: User = Depends(require_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    limit = max(1, min(500, limit))
    docs = (
        await db.audit_logs.find({}, {"_id": 0})
        .sort("created_at", -1)
        .to_list(limit)
    )
    return {"items": docs}


@admin_router.get("/users")
async def list_users(
    _: User = Depends(require_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    docs = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(500)
    return {"items": docs}


@admin_router.get("/stats")
async def admin_stats(
    _: User = Depends(require_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    return {
        "users": await db.users.count_documents({}),
        "projects": await db.projects.count_documents({}),
        "feedback": await db.feedback.count_documents({}),
        "insights": await db.ai_insights.count_documents({}),
        "audit_logs": await db.audit_logs.count_documents({}),
    }


# helper for publish toggle (re-used from server.py)
__all__ = [
    "battle_router",
    "leaderboard_router",
    "admin_router",
    "PublishPayload",
]
