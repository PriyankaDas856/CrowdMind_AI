"""Authentication module: JWT email/password + Emergent Google Auth.

REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
"""
from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
import httpx
import jwt
from fastapi import APIRouter, Cookie, Depends, Header, HTTPException, Request, Response
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

from models import (
    LoginPayload,
    RegisterPayload,
    TokenResponse,
    User,
    UserPublic,
    UserSession,
    utc_now_iso,
)

JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALG = os.environ.get("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_DAYS = int(os.environ.get("JWT_EXPIRE_DAYS", "7"))

EMERGENT_SESSION_URL = (
    "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"
)


# ---------- Password helpers ----------
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


# ---------- JWT helpers ----------
def create_jwt(user_id: str) -> str:
    exp = datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRE_DAYS)
    payload = {"sub": user_id, "exp": exp, "iat": datetime.now(timezone.utc)}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def decode_jwt(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        return payload.get("sub")
    except jwt.PyJWTError:
        return None


# ---------- DI helpers ----------
async def get_db(request: Request) -> AsyncIOMotorDatabase:
    return request.app.state.db


async def get_current_user(
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None),
) -> User:
    """Try cookie session first (Google), then Authorization Bearer (JWT)."""

    # 1) Try Google session_token cookie
    if session_token:
        session_doc = await db.user_sessions.find_one(
            {"session_token": session_token}, {"_id": 0}
        )
        if session_doc:
            expires_at = session_doc["expires_at"]
            if isinstance(expires_at, str):
                expires_at = datetime.fromisoformat(expires_at)
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if expires_at >= datetime.now(timezone.utc):
                user_doc = await db.users.find_one(
                    {"user_id": session_doc["user_id"]}, {"_id": 0}
                )
                if user_doc:
                    return User(**user_doc)

    # 2) Try JWT in Authorization header
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1]
        user_id = decode_jwt(token)
        if user_id:
            user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
            if user_doc:
                return User(**user_doc)

    raise HTTPException(status_code=401, detail="Not authenticated")


def public_user(user: User) -> UserPublic:
    return UserPublic(
        user_id=user.user_id,
        email=user.email,
        name=user.name,
        picture=user.picture,
        role=user.role,
        auth_provider=user.auth_provider,
    )


# ---------- Router ----------
auth_router = APIRouter(prefix="/auth", tags=["auth"])


class GoogleSessionPayload(BaseModel):
    session_id: str


@auth_router.post("/register", response_model=TokenResponse)
async def register(payload: RegisterPayload, db: AsyncIOMotorDatabase = Depends(get_db)):
    existing = await db.users.find_one({"email": payload.email.lower()}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(
        email=payload.email.lower(),
        name=payload.name.strip(),
        password_hash=hash_password(payload.password),
        auth_provider="jwt",
    )
    await db.users.insert_one(user.model_dump())
    token = create_jwt(user.user_id)
    return TokenResponse(token=token, user=public_user(user))


@auth_router.post("/login", response_model=TokenResponse)
async def login(payload: LoginPayload, db: AsyncIOMotorDatabase = Depends(get_db)):
    user_doc = await db.users.find_one({"email": payload.email.lower()}, {"_id": 0})
    if not user_doc or not user_doc.get("password_hash"):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not verify_password(payload.password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user = User(**user_doc)
    token = create_jwt(user.user_id)
    return TokenResponse(token=token, user=public_user(user))


@auth_router.post("/google/session")
async def google_session(
    payload: GoogleSessionPayload,
    response: Response,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Exchange Emergent OAuth session_id for our session_token cookie."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.get(
            EMERGENT_SESSION_URL, headers={"X-Session-ID": payload.session_id}
        )
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid Google session")
    data = r.json()
    email = data["email"].lower()
    name = data.get("name") or email.split("@")[0]
    picture = data.get("picture")
    session_token = data["session_token"]

    # Upsert user
    user_doc = await db.users.find_one({"email": email}, {"_id": 0})
    if user_doc:
        await db.users.update_one(
            {"email": email},
            {"$set": {"name": name, "picture": picture}},
        )
        user = User(**{**user_doc, "name": name, "picture": picture})
    else:
        user = User(
            email=email,
            name=name,
            picture=picture,
            auth_provider="google",
        )
        await db.users.insert_one(user.model_dump())

    # Store session
    expires_at = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
    await db.user_sessions.update_one(
        {"session_token": session_token},
        {
            "$set": UserSession(
                session_token=session_token,
                user_id=user.user_id,
                expires_at=expires_at,
            ).model_dump()
        },
        upsert=True,
    )

    response.set_cookie(
        key="session_token",
        value=session_token,
        max_age=7 * 24 * 60 * 60,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
    )
    return {"user": public_user(user).model_dump()}


@auth_router.get("/me", response_model=UserPublic)
async def me(current_user: User = Depends(get_current_user)):
    return public_user(current_user)


@auth_router.post("/logout")
async def logout(
    response: Response,
    db: AsyncIOMotorDatabase = Depends(get_db),
    session_token: Optional[str] = Cookie(None),
):
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    response.delete_cookie("session_token", path="/", samesite="none", secure=True)
    return {"ok": True}
