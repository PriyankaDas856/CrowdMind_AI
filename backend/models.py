"""MongoDB document models for CrowdMind AI."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any

from pydantic import BaseModel, Field, EmailStr, ConfigDict


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def gen_id(prefix: str = "") -> str:
    short = uuid.uuid4().hex[:16]
    return f"{prefix}{short}" if prefix else short


# ---------- USERS ----------
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")

    user_id: str = Field(default_factory=lambda: f"user_{uuid.uuid4().hex[:12]}")
    email: EmailStr
    name: str
    password_hash: Optional[str] = None  # null for Google-only users
    picture: Optional[str] = None
    auth_provider: str = "jwt"  # "jwt" | "google"
    role: str = "user"  # "user" | "admin"
    created_at: str = Field(default_factory=utc_now_iso)


class UserPublic(BaseModel):
    user_id: str
    email: EmailStr
    name: str
    picture: Optional[str] = None
    role: str = "user"
    auth_provider: str = "jwt"


# ---------- SESSIONS (Google) ----------
class UserSession(BaseModel):
    session_token: str
    user_id: str
    expires_at: str
    created_at: str = Field(default_factory=utc_now_iso)


# ---------- PROJECTS ----------
class Project(BaseModel):
    model_config = ConfigDict(extra="ignore")

    project_id: str = Field(default_factory=lambda: f"proj_{uuid.uuid4().hex[:12]}")
    owner_id: str
    name: str
    category: str
    description: str
    target_audience: str
    location: str
    public_link_id: str = Field(default_factory=lambda: uuid.uuid4().hex[:10])
    status: str = "collecting"  # "collecting" | "analyzed"
    created_at: str = Field(default_factory=utc_now_iso)
    updated_at: str = Field(default_factory=utc_now_iso)


class ProjectCreate(BaseModel):
    name: str
    category: str
    description: str
    target_audience: str
    location: str


# ---------- FEEDBACK ----------
class Feedback(BaseModel):
    model_config = ConfigDict(extra="ignore")

    feedback_id: str = Field(default_factory=lambda: f"fb_{uuid.uuid4().hex[:12]}")
    project_id: str
    user_id: str
    user_name: str
    rating: int  # 1-5
    feedback_text: str
    suggestion: Optional[str] = ""
    purchase_intent: str  # "definitely" | "likely" | "maybe" | "unlikely" | "no"
    sentiment_label: Optional[str] = None  # filled at analysis time
    created_at: str = Field(default_factory=utc_now_iso)


class FeedbackCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    feedback_text: str = Field(min_length=3, max_length=4000)
    suggestion: Optional[str] = ""
    purchase_intent: str


# ---------- AI INSIGHTS ----------
class AIInsight(BaseModel):
    model_config = ConfigDict(extra="ignore")

    insight_id: str = Field(default_factory=lambda: f"ins_{uuid.uuid4().hex[:12]}")
    project_id: str
    validation_score: int  # 0-100
    demand_prediction: str  # "Low" | "Medium" | "High"
    investor_readiness_score: int  # 0-100
    sentiment_breakdown: Dict[str, int]  # {positive, neutral, negative}
    purchase_intent_breakdown: Dict[str, int]
    trends: List[str]
    pain_points: List[str]
    competitors: List[Dict[str, str]]  # [{name, strengths, weaknesses}]
    business_models: List[str]
    revenue_models: List[str]
    customer_segments: List[Dict[str, str]]  # [{name, description, percent}]
    report: Dict[str, Any]  # executive_summary, risks, opportunities, improvements, gtm, pricing, pitch_deck
    total_responses: int
    model: str
    generated_at: str = Field(default_factory=utc_now_iso)


# ---------- AUTH PAYLOADS ----------
class RegisterPayload(BaseModel):
    email: EmailStr
    name: str = Field(min_length=2, max_length=80)
    password: str = Field(min_length=8, max_length=128)


class LoginPayload(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    token: str
    user: UserPublic
