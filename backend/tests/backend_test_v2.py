"""CrowdMind AI extended backend tests (M1-M12 upgrade)."""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://market-pulse-ai-183.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

UNIQ = uuid.uuid4().hex[:6]
FOUNDER = {"email": f"founder_{UNIQ}@crowdmind.io", "name": "Founder V2", "password": "Founder123!"}
REVIEWER = {"email": f"reviewer_{UNIQ}@crowdmind.io", "name": "Reviewer V2", "password": "Reviewer123!"}
ADMIN = {"email": f"admin_{UNIQ}@crowdmind.io", "name": "Admin V2", "password": "Admin12345!"}

S = {}


def _reg(p):
    return requests.post(f"{API}/auth/register", json=p, timeout=20)


def _h(tok):
    return {"Authorization": f"Bearer {tok}"}


def _create_project(tok, name):
    return requests.post(f"{API}/projects", json={
        "name": name, "category": "SaaS",
        "description": "AI tool for indie founders to validate startup ideas faster with crowd feedback and deep insights.",
        "target_audience": "Indie hackers and early-stage founders",
        "location": "Global",
    }, headers=_h(tok), timeout=20)


# ---------- Setup ----------
def test_00_setup_users():
    for u in (FOUNDER, REVIEWER, ADMIN):
        r = _reg(u)
        assert r.status_code == 200, r.text
        S[u["email"]] = r.json()["token"]
        S[u["email"] + ":user"] = r.json()["user"]


def test_01_create_two_projects_and_feedback():
    r1 = _create_project(S[FOUNDER["email"]], "AlphaIdea TEST")
    assert r1.status_code == 200, r1.text
    S["p1"] = r1.json()
    r2 = _create_project(S[FOUNDER["email"]], "BetaIdea TEST")
    assert r2.status_code == 200, r2.text
    S["p2"] = r2.json()
    # Reviewer feedback on p1
    fb = {"rating": 5, "feedback_text": "Great tool, would use daily.",
          "suggestion": "Add Slack integration.", "purchase_intent": "definitely"}
    rf = requests.post(f"{API}/projects/{S['p1']['project_id']}/feedback",
                       json=fb, headers=_h(S[REVIEWER["email"]]), timeout=20)
    assert rf.status_code == 200, rf.text


# ---------- M1-M8 Extended Analyze ----------
def test_02_analyze_extended_schema():
    pid = S["p1"]["project_id"]
    t0 = time.time()
    r = requests.post(f"{API}/projects/{pid}/analyze", headers=_h(S[FOUNDER["email"]]), timeout=240)
    if r.status_code in (502, 504):
        print(f"first analyze got {r.status_code} after {time.time()-t0:.1f}s; retry once")
        time.sleep(5)
        r = requests.post(f"{API}/projects/{pid}/analyze", headers=_h(S[FOUNDER["email"]]), timeout=240)
    print(f"analyze took {time.time()-t0:.1f}s status={r.status_code}")
    assert r.status_code == 200, r.text
    ins = r.json()
    S["insight1"] = ins
    # M1 PMF
    pmf = ins.get("pmf") or {}
    for k in ("pmf_score", "demand_score", "market_readiness_score",
              "differentiation_score", "scalability_score"):
        assert isinstance(pmf.get(k), int), f"pmf.{k} missing/not int: {pmf.get(k)}"
        assert 0 <= pmf[k] <= 100
    for k in ("what_users_love", "what_users_dislike", "missing_features", "evolution_advice"):
        assert k in pmf, f"pmf missing {k}"
    # M2 Personas
    personas = ins.get("personas") or []
    assert 3 <= len(personas) <= 6, f"personas count {len(personas)}"
    for p in personas:
        for k in ("name", "age_range", "occupation", "goals", "pain_points"):
            assert k in p, f"persona missing {k}"
    # M3 Competitor intel
    ci = ins.get("competitor_intel") or {}
    assert isinstance(ci.get("table"), list) and len(ci["table"]) >= 1
    for k in ("market_gaps", "competitive_advantages", "blue_ocean_opportunities"):
        assert k in ci, f"competitor_intel missing {k}"
    # M4 Investor
    inv = ins.get("investor") or {}
    for k in ("team_score", "market_score", "product_score", "traction_score", "financial_score"):
        assert isinstance(inv.get(k), int), f"investor.{k} missing"
    for k in ("why_invest", "why_reject", "how_to_improve"):
        assert k in inv
    # M5 SWOT
    sw = ins.get("swot") or {}
    for k in ("strengths", "weaknesses", "opportunities", "threats"):
        assert isinstance(sw.get(k), list) and len(sw[k]) >= 1, f"swot.{k}"
    # M6 BMC
    bmc = ins.get("bmc") or {}
    for k in ("customer_segments", "value_propositions", "channels", "customer_relationships",
              "revenue_streams", "key_resources", "key_activities", "key_partnerships", "cost_structure"):
        assert k in bmc, f"bmc missing {k}"
    # M7 Success prediction
    sp = ins.get("success_prediction") or {}
    for k in ("one_year_probability", "three_year_probability", "five_year_probability"):
        assert isinstance(sp.get(k), int), f"success_prediction.{k}"
    # M8 Pitch deck slides
    slides = ins.get("pitch_deck_slides") or []
    assert len(slides) == 10, f"expected 10 slides got {len(slides)}"
    for s in slides:
        assert "title" in s and "bullets" in s and isinstance(s["bullets"], list)


def test_03_innovation_score_set_from_pmf():
    pid = S["p1"]["project_id"]
    r = requests.get(f"{API}/projects/{pid}", headers=_h(S[FOUNDER["email"]]), timeout=20)
    assert r.status_code == 200
    proj = r.json()["project"]
    pmf_diff = S["insight1"]["pmf"]["differentiation_score"]
    assert proj.get("innovation_score") == pmf_diff, f"innovation_score {proj.get('innovation_score')} != pmf.diff {pmf_diff}"


# ---------- Publish toggle ----------
def test_04_publish_project():
    pid = S["p1"]["project_id"]
    r = requests.post(f"{API}/projects/{pid}/publish", json={"is_public": True},
                      headers=_h(S[FOUNDER["email"]]), timeout=15)
    assert r.status_code == 200, r.text
    # verify
    r2 = requests.get(f"{API}/projects/{pid}", headers=_h(S[FOUNDER["email"]]), timeout=15)
    assert r2.json()["project"].get("is_public") is True


def test_05_unpublish_then_republish():
    pid = S["p1"]["project_id"]
    r = requests.post(f"{API}/projects/{pid}/publish", json={"is_public": False},
                      headers=_h(S[FOUNDER["email"]]), timeout=15)
    assert r.status_code == 200
    r2 = requests.get(f"{API}/projects/{pid}", headers=_h(S[FOUNDER["email"]]), timeout=15)
    assert r2.json()["project"].get("is_public") is False
    # republish for leaderboard tests
    r3 = requests.post(f"{API}/projects/{pid}/publish", json={"is_public": True},
                      headers=_h(S[FOUNDER["email"]]), timeout=15)
    assert r3.status_code == 200


# ---------- PDF report ----------
def test_06_pdf_report_owner():
    pid = S["p1"]["project_id"]
    r = requests.get(f"{API}/projects/{pid}/report.pdf", headers=_h(S[FOUNDER["email"]]), timeout=30)
    assert r.status_code == 200, r.text[:200]
    assert "application/pdf" in r.headers.get("content-type", "").lower()
    assert len(r.content) > 1024
    assert r.content[:4] == b"%PDF"


def test_07_pdf_report_no_insight_400():
    pid = S["p2"]["project_id"]  # never analyzed
    r = requests.get(f"{API}/projects/{pid}/report.pdf", headers=_h(S[FOUNDER["email"]]), timeout=20)
    assert r.status_code == 400, f"got {r.status_code}: {r.text[:200]}"


def test_08_pdf_report_non_owner_404():
    pid = S["p1"]["project_id"]
    r = requests.get(f"{API}/projects/{pid}/report.pdf", headers=_h(S[REVIEWER["email"]]), timeout=20)
    assert r.status_code == 404


# ---------- M9 Founder profile & analyze ----------
def test_09_founder_analyze_no_profile_400():
    r = requests.post(f"{API}/founder/analyze", headers=_h(S[FOUNDER["email"]]), timeout=20)
    assert r.status_code == 400, r.text[:200]


def test_10_founder_profile_upsert_get():
    payload = {
        "budget": "50000 USD seed", "skills": ["python", "product", "design"],
        "experience_years": 6, "industry_interests": ["SaaS", "AI"],
        "risk_appetite": "medium", "time_availability": "full_time",
        "prior_startups": 1
    }
    r = requests.post(f"{API}/founder/profile", json=payload, headers=_h(S[FOUNDER["email"]]), timeout=20)
    assert r.status_code == 200, r.text
    g = requests.get(f"{API}/founder/profile", headers=_h(S[FOUNDER["email"]]), timeout=15)
    assert g.status_code == 200
    assert g.json().get("budget") == "50000 USD seed"
    assert g.json().get("experience_years") == 6


def test_11_founder_analyze():
    t0 = time.time()
    r = requests.post(f"{API}/founder/analyze", headers=_h(S[FOUNDER["email"]]), timeout=120)
    print(f"founder.analyze took {time.time()-t0:.1f}s")
    assert r.status_code == 200, r.text
    d = r.json()
    assert isinstance(d.get("founder_score"), int) and 0 <= d["founder_score"] <= 100
    for k in ("strengths", "weaknesses", "recommended_industries",
              "recommended_startup_types", "advice"):
        assert k in d, f"missing {k}"


# ---------- M10 Battle ----------
def test_12_battle_same_id_400():
    pid = S["p1"]["project_id"]
    r = requests.post(f"{API}/battle", json={"project_a_id": pid, "project_b_id": pid},
                      headers=_h(S[FOUNDER["email"]]), timeout=20)
    assert r.status_code == 400, r.text[:200]


def test_13_battle_not_owner_404():
    # Reviewer tries to battle founder's projects
    r = requests.post(f"{API}/battle",
                      json={"project_a_id": S["p1"]["project_id"], "project_b_id": S["p2"]["project_id"]},
                      headers=_h(S[REVIEWER["email"]]), timeout=20)
    assert r.status_code == 404, r.text[:200]


def test_14_battle_compare():
    t0 = time.time()
    r = requests.post(f"{API}/battle",
                      json={"project_a_id": S["p1"]["project_id"], "project_b_id": S["p2"]["project_id"]},
                      headers=_h(S[FOUNDER["email"]]), timeout=120)
    print(f"battle took {time.time()-t0:.1f}s")
    assert r.status_code == 200, r.text
    d = r.json()
    crit = d.get("criteria")
    # criteria may be list of {name,a,b,note} OR dict {name: {a,b,note}}
    if isinstance(crit, dict):
        assert len(crit) == 7, f"expected 7 criteria got {len(crit)}"
        for name, val in crit.items():
            assert isinstance(val, dict) and "a" in val and "b" in val and "note" in val, f"crit {name}: {val}"
    else:
        assert isinstance(crit, list) and len(crit) == 7, f"expected 7 criteria got {len(crit) if crit else 0}"
        for c in crit:
            assert "a" in c and "b" in c and "note" in c
    assert d.get("winner") in ("A", "B", "TIE")
    assert "winner_name" in d and "reasoning" in d
    assert "improvements_for_loser" in d and "improvements_for_winner" in d
    assert d.get("project_a", {}).get("id") == S["p1"]["project_id"]
    assert d.get("project_b", {}).get("id") == S["p2"]["project_id"]


# ---------- M11 Leaderboard ----------
def test_15_leaderboard_default():
    r = requests.get(f"{API}/leaderboard", timeout=20)
    assert r.status_code == 200, r.text
    d = r.json()
    assert "items" in d and "sort" in d
    assert d["sort"] == "validation"
    ids = [it.get("project_id") for it in d["items"]]
    assert S["p1"]["project_id"] in ids, "published+analyzed project should appear"


def test_16_leaderboard_sorts():
    for s in ("investor", "pmf", "innovation", "trending", "community"):
        r = requests.get(f"{API}/leaderboard?sort={s}", timeout=20)
        assert r.status_code == 200, f"{s}: {r.text[:200]}"
        assert r.json().get("sort") == s


def test_17_leaderboard_like():
    plink = S["p1"]["public_link_id"]
    r = requests.post(f"{API}/leaderboard/like/{plink}", timeout=15)
    assert r.status_code == 200, r.text
    body = r.json()
    assert "community_likes" in body and body["community_likes"] >= 1


def test_18_leaderboard_like_404():
    r = requests.post(f"{API}/leaderboard/like/nonexistent_xyz", timeout=15)
    assert r.status_code == 404


# ---------- Admin RBAC ----------
def test_19_admin_endpoints_forbidden_for_normal_user():
    for path in ("/admin/audit-logs", "/admin/users", "/admin/stats"):
        r = requests.get(f"{API}{path}", headers=_h(S[FOUNDER["email"]]), timeout=15)
        assert r.status_code == 403, f"{path} got {r.status_code}"


def test_20_admin_endpoints_ok_for_admin():
    # Promote ADMIN user to admin role in mongo
    try:
        from pymongo import MongoClient
    except Exception:
        pytest.skip("pymongo not installed")
    mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
    db_name = os.environ.get("DB_NAME", "test_database")
    cli = MongoClient(mongo_url, serverSelectionTimeoutMS=4000)
    db = cli[db_name]
    res = db.users.update_one({"email": ADMIN["email"]}, {"$set": {"role": "admin"}})
    assert res.matched_count == 1, "admin user not found in db"
    for path in ("/admin/audit-logs", "/admin/users", "/admin/stats"):
        r = requests.get(f"{API}{path}", headers=_h(S[ADMIN["email"]]), timeout=15)
        assert r.status_code == 200, f"{path} got {r.status_code}: {r.text[:200]}"


# ---------- Audit logs ----------
def test_21_audit_logs_recorded():
    try:
        from pymongo import MongoClient
    except Exception:
        pytest.skip("pymongo not installed")
    mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
    db_name = os.environ.get("DB_NAME", "test_database")
    db = MongoClient(mongo_url, serverSelectionTimeoutMS=4000)[db_name]
    expected = {"project.create", "project.publish", "project.unpublish",
                "project.analyze", "project.report.pdf", "founder.profile.upsert",
                "founder.analyze", "battle.compare"}
    actions = set(db.audit_logs.distinct("action"))
    missing = expected - actions
    assert not missing, f"audit_log missing actions: {missing}. found: {actions}"


# ---------- Rate limit decorator existence ----------
def test_22_rate_limit_decorator_present():
    with open("/app/backend/server.py", "r") as f:
        src = f.read()
    assert "slowapi" in src.lower() or "limiter" in src.lower(), "no slowapi import"
    assert ("10/minute" in src) or ("10/min" in src), "no 10/min rate limit declared"


# ---------- Regression: existing endpoints ----------
def test_23_regression_dashboard_stats():
    r = requests.get(f"{API}/dashboard/stats", headers=_h(S[FOUNDER["email"]]), timeout=15)
    assert r.status_code == 200
    s = r.json()
    assert s["total_projects"] >= 2 and s["analyzed_projects"] >= 1


def test_24_cleanup_delete_projects():
    for k in ("p1", "p2"):
        pid = S[k]["project_id"]
        r = requests.delete(f"{API}/projects/{pid}", headers=_h(S[FOUNDER["email"]]), timeout=15)
        assert r.status_code == 200
