"""Iteration 3 - async modular analyze pipeline + schema fixes."""
import os
import time
import uuid
import requests
import pytest

BASE = os.environ.get("REACT_APP_BACKEND_URL", "https://market-pulse-ai-183.preview.emergentagent.com").rstrip("/")
API = f"{BASE}/api"


def _register(suffix="founder"):
    email = f"{suffix}_{uuid.uuid4().hex[:8]}@crowdmind.io"
    pwd = "TestPass123!"
    r = requests.post(f"{API}/auth/register", json={"email": email, "password": pwd, "name": suffix.title()}, timeout=30)
    assert r.status_code in (200, 201), r.text
    tok = r.json()["token"]
    return email, pwd, tok


@pytest.fixture(scope="module")
def ctx():
    email, pwd, tok = _register("founder")
    h = {"Authorization": f"Bearer {tok}"}
    # project
    pr = requests.post(f"{API}/projects", headers=h, json={
        "name": "AsyncTest TEST", "category": "SaaS",
        "description": "An async pipeline test project for CrowdMind.",
        "target_audience": "SMB owners", "location": "US",
    }, timeout=30)
    assert pr.status_code == 200, pr.text
    pid = pr.json()["project_id"]
    # second reviewer for feedback
    _, _, rtok = _register("reviewer")
    rh = {"Authorization": f"Bearer {rtok}"}
    fb = requests.post(f"{API}/projects/{pid}/feedback", headers=rh, json={
        "rating": 5, "feedback_text": "Love it, would buy.",
        "suggestion": "Add mobile app", "purchase_intent": "definitely",
    }, timeout=30)
    assert fb.status_code == 200, fb.text
    return {"email": email, "tok": tok, "h": h, "pid": pid, "rtok": rtok, "rh": rh}


# ---------- ASYNC ANALYZE ----------
def test_01_analyze_returns_202_fast(ctx):
    t0 = time.time()
    r = requests.post(f"{API}/projects/{ctx['pid']}/analyze", headers=ctx["h"], timeout=10)
    elapsed = time.time() - t0
    assert r.status_code == 202, f"{r.status_code} {r.text}"
    assert elapsed < 5, f"too slow: {elapsed}s"
    body = r.json()
    assert body["success"] is True
    assert body["status"] in ("queued", "processing")
    assert body["job_id"].startswith("job_")
    ctx["job_id"] = body["job_id"]


def test_02_idempotent_same_job_id(ctx):
    r = requests.post(f"{API}/projects/{ctx['pid']}/analyze", headers=ctx["h"], timeout=10)
    assert r.status_code == 202
    assert r.json()["job_id"] == ctx["job_id"]


def test_03_status_owner_only(ctx):
    # other user gets 403
    _, _, otok = _register("other")
    r = requests.get(f"{API}/analyze/status/{ctx['job_id']}", headers={"Authorization": f"Bearer {otok}"}, timeout=15)
    assert r.status_code == 403, r.text


def test_04_poll_until_done(ctx):
    deadline = time.time() + 180
    last = None
    while time.time() < deadline:
        r = requests.get(f"{API}/analyze/status/{ctx['job_id']}", headers=ctx["h"], timeout=15)
        assert r.status_code == 200, r.text
        last = r.json()
        for k in ["job_id", "project_id", "status", "progress", "current_module",
                  "completed_modules", "failed_modules", "started_at"]:
            assert k in last, f"missing {k}"
        if last["status"] in ("done", "partial", "failed"):
            break
        time.sleep(3)
    assert last and last["status"] in ("done", "partial"), f"final: {last}"
    if last["status"] == "done":
        assert last["progress"] == 100
        expected = {"Product-Market Fit", "Customer Personas", "Competitor Intelligence",
                    "Investor Readiness", "SWOT Analysis", "Business Model Canvas",
                    "Success Forecast", "Market Validation Report"}
        assert expected.issubset(set(last["completed_modules"])), \
            f"missing modules. got: {last['completed_modules']}"
    ctx["final_status"] = last["status"]


def test_05_result_full_schema(ctx):
    r = requests.get(f"{API}/analyze/result/{ctx['job_id']}", headers=ctx["h"], timeout=15)
    assert r.status_code == 200
    body = r.json()
    assert "insight" in body
    ins = body["insight"]
    assert ins is not None
    if ctx.get("final_status") == "done":
        pmf = ins.get("pmf") or {}
        for k in ("problem_severity_score", "solution_fit_score", "differentiation_score",
                  "willingness_to_pay_score", "retention_score"):
            assert k in pmf, f"pmf missing {k}"
        assert isinstance(ins.get("personas"), list)
        ci = ins.get("competitor_intel") or {}
        for k in ("table", "market_gaps", "competitive_advantages", "blue_ocean_opportunities"):
            assert k in ci, f"competitor_intel missing {k}"
        inv = ins.get("investor") or {}
        assert "investor_readiness_score" in inv
        swot = ins.get("swot") or {}
        for q in ("strengths", "weaknesses", "opportunities", "threats"):
            assert q in swot
        bmc = ins.get("bmc") or {}
        assert len(bmc) >= 9 or len(bmc.keys()) >= 9
        sp = ins.get("success_prediction") or {}
        # 1y/3y/5y keys
        keys_str = " ".join(sp.keys()).lower()
        assert any("1" in k for k in sp.keys()) and any("3" in k for k in sp.keys()) and any("5" in k for k in sp.keys()), f"sp keys: {list(sp.keys())}"
        slides = ins.get("pitch_deck_slides") or []
        assert len(slides) >= 8, f"slides={len(slides)}"


def test_06_project_reflects_insight(ctx):
    if ctx.get("final_status") != "done":
        pytest.skip("job not done")
    r = requests.get(f"{API}/projects/{ctx['pid']}", headers=ctx["h"], timeout=15)
    assert r.status_code == 200
    body = r.json()
    assert body["project"]["status"] == "analyzed"
    pmf_diff = (body["insight"].get("pmf") or {}).get("differentiation_score", 0)
    assert body["project"]["innovation_score"] == int(pmf_diff or 0)


# ---------- SCHEMA: FOUNDER ----------
def test_07_founder_budget_numeric(ctx):
    payload = {"budget": 25000.50, "skills": ["Engineering"], "experience_years": 5,
               "industry_interests": ["SaaS"], "risk_appetite": "medium",
               "time_availability": "part-time", "prior_startups": 1}
    r = requests.post(f"{API}/founder/profile", headers=ctx["h"], json=payload, timeout=30)
    assert r.status_code == 200, r.text
    body = r.json()
    # flat shape - budget numeric
    budget = body.get("budget") if "budget" in body else (body.get("profile") or {}).get("budget")
    assert isinstance(budget, (int, float)), f"budget type: {type(budget)} val={budget}"
    assert abs(float(budget) - 25000.50) < 0.01


def test_08_founder_budget_string_rejected(ctx):
    payload = {"budget": "25k", "skills": ["Engineering"], "experience_years": 5,
               "industry_interests": ["SaaS"], "risk_appetite": "medium",
               "time_availability": "part-time", "prior_startups": 1}
    r = requests.post(f"{API}/founder/profile", headers=ctx["h"], json=payload, timeout=15)
    assert r.status_code == 422, f"expected 422 got {r.status_code}: {r.text}"


def test_09_founder_profile_flat(ctx):
    r = requests.get(f"{API}/founder/profile", headers=ctx["h"], timeout=15)
    assert r.status_code == 200
    body = r.json()
    # flat object, not wrapped
    assert "profile" not in body or "budget" in body, f"wrapper detected: {list(body.keys())}"
    assert "budget" in body
    assert isinstance(body["budget"], (int, float))


def test_10_founder_insight_endpoint(ctx):
    r = requests.get(f"{API}/founder/insight", headers=ctx["h"], timeout=15)
    assert r.status_code == 200
    # flat or null
    body = r.json()
    assert body is None or isinstance(body, dict)
    if isinstance(body, dict):
        assert "profile" not in body, "should be flat"


# ---------- BATTLE ARRAY ----------
def test_11_battle_criteria_array(ctx):
    r = requests.post(f"{API}/battle", headers=ctx["h"], json={
        "idea_a": "AI-powered code review SaaS for enterprise dev teams",
        "idea_b": "Drone-based crop monitoring for smallholder farmers",
    }, timeout=120)
    assert r.status_code == 200, r.text
    body = r.json()
    crit = body.get("criteria")
    assert isinstance(crit, list), f"criteria type: {type(crit)}"
    assert len(crit) == 7, f"len={len(crit)}"
    names = {c["name"] for c in crit}
    expected = {"Market Size", "Competition", "Risk", "Revenue Potential",
                "Scalability", "Investor Appeal", "PMF"}
    assert expected.issubset(names), f"missing: {expected - names}"
    for c in crit:
        for k in ("name", "a", "b", "note", "winner", "winner_name"):
            assert k in c, f"criterion missing {k}: {c}"
        assert c["winner"] in ("A", "B", "TIE")
    for k in ("winner", "winner_name", "reasoning"):
        assert k in body, f"top-level missing {k}"


# ---------- REGRESSION ----------
def test_12_auth_login(ctx):
    r = requests.post(f"{API}/auth/login", json={"email": ctx["email"], "password": "TestPass123!"}, timeout=15)
    assert r.status_code == 200
    assert "token" in r.json()


def test_13_leaderboard(ctx):
    # publish first
    requests.post(f"{API}/projects/{ctx['pid']}/publish", headers=ctx["h"], json={"is_public": True}, timeout=15)
    r = requests.get(f"{API}/leaderboard", timeout=15)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_14_pdf_report(ctx):
    if ctx.get("final_status") != "done":
        pytest.skip("no insight")
    r = requests.get(f"{API}/projects/{ctx['pid']}/report.pdf", headers=ctx["h"], timeout=30)
    assert r.status_code == 200
    assert r.headers.get("content-type", "").startswith("application/pdf")
    assert r.content[:4] == b"%PDF"
