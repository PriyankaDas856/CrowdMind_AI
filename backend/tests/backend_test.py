"""CrowdMind AI backend tests."""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://market-pulse-ai-183.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

UNIQ = uuid.uuid4().hex[:6]
FOUNDER = {"email": f"founder_{UNIQ}@crowdmind.io", "name": "Founder Test", "password": "Founder123!"}
REVIEWER = {"email": f"reviewer_{UNIQ}@crowdmind.io", "name": "Reviewer Test", "password": "Reviewer123!"}

state = {}


def _register(payload):
    r = requests.post(f"{API}/auth/register", json=payload, timeout=20)
    return r


def test_01_health():
    r = requests.get(f"{API}/", timeout=15)
    assert r.status_code == 200
    assert r.json().get("status") == "ok"


def test_02_register_founder():
    r = _register(FOUNDER)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "token" in data and "user" in data
    assert data["user"]["email"] == FOUNDER["email"]
    state["founder_token"] = data["token"]
    state["founder_user"] = data["user"]


def test_03_register_reviewer():
    r = _register(REVIEWER)
    assert r.status_code == 200, r.text
    state["reviewer_token"] = r.json()["token"]
    state["reviewer_user"] = r.json()["user"]


def test_04_register_duplicate():
    r = _register(FOUNDER)
    assert r.status_code == 409


def test_05_login():
    r = requests.post(f"{API}/auth/login", json={"email": FOUNDER["email"], "password": FOUNDER["password"]}, timeout=15)
    assert r.status_code == 200
    assert "token" in r.json()


def test_06_login_invalid():
    r = requests.post(f"{API}/auth/login", json={"email": FOUNDER["email"], "password": "wrong"}, timeout=15)
    assert r.status_code == 401


def test_07_me():
    h = {"Authorization": f"Bearer {state['founder_token']}"}
    r = requests.get(f"{API}/auth/me", headers=h, timeout=15)
    assert r.status_code == 200
    assert r.json()["email"] == FOUNDER["email"]


def test_08_me_unauthorized():
    r = requests.get(f"{API}/auth/me", timeout=15)
    assert r.status_code == 401


def test_09_create_project():
    h = {"Authorization": f"Bearer {state['founder_token']}"}
    payload = {
        "name": "EcoBottle TEST",
        "category": "Sustainability",
        "description": "Reusable smart water bottle that tracks hydration.",
        "target_audience": "Health-conscious millennials",
        "location": "USA",
    }
    r = requests.post(f"{API}/projects", json=payload, headers=h, timeout=20)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["name"] == "EcoBottle TEST"
    assert data["owner_id"] == state["founder_user"]["user_id"]
    assert data["public_link_id"]
    state["project"] = data


def test_10_list_projects():
    h = {"Authorization": f"Bearer {state['founder_token']}"}
    r = requests.get(f"{API}/projects", headers=h, timeout=15)
    assert r.status_code == 200
    assert any(p["project_id"] == state["project"]["project_id"] for p in r.json())


def test_11_get_project_detail():
    h = {"Authorization": f"Bearer {state['founder_token']}"}
    r = requests.get(f"{API}/projects/{state['project']['project_id']}", headers=h, timeout=15)
    assert r.status_code == 200
    body = r.json()
    assert "project" in body and "feedback" in body and "feedback_count" in body
    assert body["insight"] is None


def test_12_public_project():
    r = requests.get(f"{API}/public/projects/{state['project']['public_link_id']}", timeout=15)
    assert r.status_code == 200
    assert r.json()["project_id"] == state["project"]["project_id"]


def test_13_public_project_404():
    r = requests.get(f"{API}/public/projects/nonexistent_link", timeout=15)
    assert r.status_code == 404


def test_14_submit_feedback_reviewer():
    h = {"Authorization": f"Bearer {state['reviewer_token']}"}
    payload = {
        "rating": 5,
        "feedback_text": "Love this idea, super useful for my daily routine.",
        "suggestion": "Add a temperature display.",
        "purchase_intent": "definitely",
    }
    r = requests.post(f"{API}/projects/{state['project']['project_id']}/feedback", json=payload, headers=h, timeout=20)
    assert r.status_code == 200, r.text
    assert r.json()["user_id"] == state["reviewer_user"]["user_id"]


def test_15_feedback_dedupe():
    h = {"Authorization": f"Bearer {state['reviewer_token']}"}
    payload = {"rating": 4, "feedback_text": "Trying again", "purchase_intent": "likely"}
    r = requests.post(f"{API}/projects/{state['project']['project_id']}/feedback", json=payload, headers=h, timeout=15)
    assert r.status_code == 409


def test_16_submit_feedback_founder():
    h = {"Authorization": f"Bearer {state['founder_token']}"}
    payload = {
        "rating": 4,
        "feedback_text": "As founder testing, looks promising.",
        "purchase_intent": "likely",
    }
    r = requests.post(f"{API}/projects/{state['project']['project_id']}/feedback", json=payload, headers=h, timeout=15)
    assert r.status_code == 200


def test_17_list_feedback_owner():
    h = {"Authorization": f"Bearer {state['founder_token']}"}
    r = requests.get(f"{API}/projects/{state['project']['project_id']}/feedback", headers=h, timeout=15)
    assert r.status_code == 200
    assert len(r.json()) >= 2


def test_18_list_feedback_non_owner_forbidden():
    h = {"Authorization": f"Bearer {state['reviewer_token']}"}
    r = requests.get(f"{API}/projects/{state['project']['project_id']}/feedback", headers=h, timeout=15)
    # Non-owner should get 404 (project query filters by owner_id)
    assert r.status_code == 404


def test_19_analyze_project():
    h = {"Authorization": f"Bearer {state['founder_token']}"}
    t0 = time.time()
    r = requests.post(f"{API}/projects/{state['project']['project_id']}/analyze", headers=h, timeout=120)
    elapsed = time.time() - t0
    print(f"AI analysis took {elapsed:.1f}s")
    assert r.status_code == 200, r.text
    ins = r.json()
    # Validate required fields
    assert isinstance(ins["validation_score"], int) and 0 <= ins["validation_score"] <= 100
    assert ins["demand_prediction"] in ["Low", "Medium", "High"]
    assert isinstance(ins["investor_readiness_score"], int)
    for k in ("positive", "neutral", "negative"):
        assert k in ins["sentiment_breakdown"]
    for k in ("definitely", "likely", "maybe", "unlikely", "no"):
        assert k in ins["purchase_intent_breakdown"]
    assert len(ins["trends"]) >= 1
    assert len(ins["competitors"]) >= 1
    report = ins["report"]
    for k in ("executive_summary", "market_risks", "opportunities", "improvements", "gtm_strategy", "pricing_strategy", "pitch_deck"):
        assert k in report, f"missing {k}"
    assert ins["model"]
    state["insight"] = ins


def test_20_project_detail_has_insight():
    h = {"Authorization": f"Bearer {state['founder_token']}"}
    r = requests.get(f"{API}/projects/{state['project']['project_id']}", headers=h, timeout=15)
    assert r.status_code == 200
    assert r.json()["insight"] is not None


def test_21_dashboard_stats():
    h = {"Authorization": f"Bearer {state['founder_token']}"}
    r = requests.get(f"{API}/dashboard/stats", headers=h, timeout=15)
    assert r.status_code == 200
    s = r.json()
    assert s["total_projects"] >= 1
    assert s["total_responses"] >= 2
    assert s["analyzed_projects"] >= 1
    assert s["avg_validation_score"] >= 0


def test_22_logout():
    h = {"Authorization": f"Bearer {state['founder_token']}"}
    r = requests.post(f"{API}/auth/logout", headers=h, timeout=15)
    assert r.status_code == 200


def test_23_delete_project_cascades():
    h = {"Authorization": f"Bearer {state['founder_token']}"}
    pid = state["project"]["project_id"]
    r = requests.delete(f"{API}/projects/{pid}", headers=h, timeout=15)
    assert r.status_code == 200
    # verify gone
    r2 = requests.get(f"{API}/projects/{pid}", headers=h, timeout=15)
    assert r2.status_code == 404
