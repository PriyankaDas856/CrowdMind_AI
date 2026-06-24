# CrowdMind AI — PRD

## Original Problem Statement
Build a production-ready SaaS web application called CrowdMind AI that helps entrepreneurs validate product ideas by collecting public feedback, analyzing it with Generative AI, identifying trends, predicting demand, and generating business recommendations.

## Tech Stack (chosen by user)
- Frontend: React 19 + Tailwind + Shadcn UI + react-router-dom v7 + recharts + sonner + framer-motion + lucide-react
- Backend: FastAPI (Python) + Motor (MongoDB async) + Pydantic v2
- Database: MongoDB (collections: `users`, `user_sessions`, `projects`, `feedback`, `ai_insights`)
- AI: Claude Sonnet 4.5 (`claude-sonnet-4-5-20250929`) via `emergentintegrations` + Emergent Universal LLM Key
- Auth: BOTH (a) JWT email/password and (b) Emergent-managed Google OAuth

## Personas
- **Founder / Operator** — creates projects, shares public link, reviews AI report.
- **Reviewer** — signed-in public user who submits structured feedback (rating + text + suggestion + purchase intent).

## What's Implemented (2026-02 — MVP)
- ✅ JWT auth: register / login / me / logout (`/app/backend/auth.py`)
- ✅ Emergent Google OAuth flow with httpOnly cookie session (`/app/backend/auth.py`, `/app/frontend/src/pages/AuthCallback.js`)
- ✅ Project CRUD scoped per owner with public shareable link (`public_link_id`)
- ✅ Feedback submission (signed-in only, deduped per user per project)
- ✅ AI analysis pipeline via Claude Sonnet 4.5 returning: validation_score, demand_prediction, investor_readiness_score, sentiment_breakdown, purchase_intent_breakdown, per_feedback_sentiment, trends, pain_points, competitors, business_models, revenue_models, customer_segments, and a full report (executive_summary, market_risks, opportunities, improvements, gtm_strategy, pricing_strategy, pitch_deck)
- ✅ Dashboard stats endpoint (`/api/dashboard/stats`)
- ✅ Landing page with luxury dark + glassmorphism + amber accent
- ✅ Login / Register pages (JWT + Google) with split brand panel
- ✅ Dashboard listing projects + stat cards
- ✅ Create project form
- ✅ Project detail with 5 tabs: Overview / AI Report / Trends / Competitors / Feedback (with recharts visualizations)
- ✅ Public feedback submission page (signup gated)
- ✅ Cabinet Grotesk + Manrope fonts loaded from Fontshare / Google Fonts
- ✅ All interactive elements carry unique `data-testid`
- ✅ 23/23 backend pytest tests passing (`/app/backend/tests/backend_test.py`)

## Backlog (next iterations)
### P1
- Admin dashboard (manage all users/projects)
- Email notifications on new feedback / analysis ready (Resend / SendGrid)
- Export AI report as PDF / shareable public URL
- Project edit (currently create + delete only)
- Better feedback dedupe (allow re-submit by reviewer)

### P2
- RAG-style competitor enrichment (web search grounded)
- Trend graph over time (currently a snapshot)
- Multi-language UI
- Stripe billing for paid tiers
- Slack/Discord integration to ping when score crosses threshold

## Test Credentials
See `/app/memory/test_credentials.md`.

## Key Env Vars
- `MONGO_URL`, `DB_NAME`, `CORS_ORIGINS`
- `EMERGENT_LLM_KEY` — universal LLM key
- `JWT_SECRET`, `JWT_ALGORITHM`, `JWT_EXPIRE_DAYS`
