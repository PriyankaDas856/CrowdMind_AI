# CrowdMind AI — PRD

## Original Problem Statement (latest)
Build a production-grade AI-powered startup validation & business intelligence platform with 12 modules (PMF, personas, competitors, investor readiness, SWOT, BMC, success forecast, pitch-deck, founder twin, idea battle, leaderboard, advanced dashboard), premium SaaS UI, async modular analysis pipeline, and a fully-seeded demo environment for portfolio showcase.

## Tech Stack
- Frontend: React + Tailwind + Shadcn UI + react-router-dom + recharts + sonner + lucide-react. Typography: Inter Variable.
- Backend: FastAPI (Python) + Motor (MongoDB async) + Pydantic v2 + slowapi (rate limit) + reportlab (PDF)
- DB: MongoDB (`users`, `user_sessions`, `projects`, `feedback`, `ai_insights`, `analysis_jobs`, `audit_logs`, `founder_profiles`, `founder_insights`)
- AI: Claude Sonnet 4.5 (`claude-sonnet-4-5-20250929`) via `emergentintegrations` + Emergent Universal LLM Key
- Auth: JWT email/password + Emergent Google OAuth

## Personas
- **Founder / Operator** — creates projects, runs AI analysis, downloads PDF, publishes to leaderboard, battles ideas, profiles themselves via Founder Twin.
- **Reviewer** — signed-in public user submitting structured feedback.
- **Recruiter / Investor / Hackathon judge** — explores the seeded demo environment to evaluate platform capability.

## What's Implemented (2026-02 → ongoing)

### MVP (iter 1)
- JWT register/login/me/logout + Emergent Google OAuth + dual session (Bearer + cookie)
- Project CRUD scoped per owner, public shareable link
- Feedback submission (auth-gated, dedupe per user/project)
- Initial monolithic Claude analysis pipeline + 23/23 backend tests

### Module expansion (iter 2 — M1–M12)
- AI Product-Market Fit Engine (5 sub-scores + qualitative)
- Customer Personas (3–5)
- Competitor Intelligence (table + market gaps + advantages + blue ocean)
- Investor Readiness Analyzer (5 sub-scores + reasoning)
- SWOT matrix
- Business Model Canvas (9 cells)
- Startup Success Predictor (1y/3y/5y)
- Pitch Deck Generator (10 slides) + PDF export via reportlab
- Founder Twin AI (profile + AI analysis)
- Idea Battle Mode (compare 2 projects)
- Public Leaderboard (publish toggle, 5 sort modes, community likes)
- Advanced Dashboard with shortcuts
- Rate limiting + audit logging + admin RBAC endpoints

### Architecture fix + demo env (iter 3 — CURRENT)
- **Async modular analysis pipeline** — replaces the monolithic 60s-blocking call:
  - `POST /api/projects/{id}/analyze` returns **HTTP 202** + `{success, job_id, status:"queued", message}`
  - 8 modules run concurrently via `asyncio.gather` (PMF, Personas, Competitor, Investor, SWOT, BMC, Success Forecast, Market Validation)
  - Per-module progress tracking (`current_module`, `completed_modules`, `failed_modules`, `progress 0-100`)
  - Fault tolerance: a single failed module marks the job `partial`, not `failed`
  - Incremental persistence: ai_insights doc is upserted as each module completes
  - New endpoints: `GET /api/analyze/status/{job_id}`, `GET /api/analyze/result/{job_id}`
  - Idempotent: re-POST while a job is queued/processing returns the same job_id
  - Owner-only enforcement (403 for others)
- **Schema fixes:**
  - `FounderProfile.budget` is now `float` (numeric USD). String `"25k"` → 422.
  - `GET /api/founder/profile` returns the FLAT FounderProfile (or null).
  - `GET /api/founder/insight` (new) returns the FLAT FounderInsight (or null).
  - Battle returns `criteria` as an ARRAY: `[{name, a, b, note, winner, winner_name}, ...]`.
- **Frontend Analysis Progress Modal** — 3-second polling, animated progress bar, per-module status pills (queued / in-progress / done / failed), naive ETA, error display.
- **Premium UI design system** — Inter Variable typography, refined dark palette (near-black + amber accent), glassmorphism cards, skeleton shimmer, fade-up + stagger animations, web-kit autofill kept dark.
- **Demo environment** — 4 fully-analyzed sample projects (`MedPass`, `FitGenie AI`, `FleetBrain AI`, `SkillSwap`) auto-seeded on startup with 30 synthetic feedback each, all clearly tagged `is_demo:true` + `_demo_label:"Sample AI Analysis"` + "Demo" pill in UI. Demo user: `demo@crowdmind.io` / `DemoUser123!`. Seed endpoint `POST /api/demo/seed` (admin or first-call). Full doc: `/app/DEMO_README.md`.

## Backlog
### P1
- Premium Landing page redesign (Problem Statement, How It Works, FAQ, Testimonials, etc.) — partially in-progress in this iteration (Inter font + tokens shipped; section refresh still to come)
- KPI sparklines on Dashboard + Startup Health Score composite
- Admin panel UI (audit-log viewer, user/project tables) — backend RBAC ready
- Empty-state illustrations (no projects / no feedback / no reports)

### P2
- PPTX export (PDF shipped)
- Live SSE updates for analysis progress (currently 3s polling)
- Per-module cache to skip unchanged inputs
- Multi-language UI
- Stripe billing for paid tiers

## Test Credentials
See `/app/memory/test_credentials.md`. Demo user: `demo@crowdmind.io` / `DemoUser123!`.

## Key Env Vars
`MONGO_URL`, `DB_NAME`, `CORS_ORIGINS`, `EMERGENT_LLM_KEY`, `JWT_SECRET`, `JWT_ALGORITHM`, `JWT_EXPIRE_DAYS`.
