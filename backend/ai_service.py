"""AI analysis pipeline powered by Claude Sonnet 4.5 via Emergent Universal LLM Key."""
from __future__ import annotations

import json
import os
import re
import uuid
from typing import Any, Dict, List

from emergentintegrations.llm.chat import LlmChat, UserMessage

EMERGENT_LLM_KEY = os.environ["EMERGENT_LLM_KEY"]
AI_MODEL_PROVIDER = "anthropic"
AI_MODEL_NAME = "claude-sonnet-4-5-20250929"

SYSTEM_PROMPT = """You are CrowdMind AI, an expert market research and product validation analyst.
You analyze raw customer feedback for early-stage product ideas and produce structured,
actionable business intelligence. You are honest, evidence-based, and concise.

You ALWAYS respond with a single valid JSON object matching the requested schema.
Do not include markdown fences, prose, or commentary outside the JSON.
"""

ANALYSIS_INSTRUCTIONS = """Analyze the project and feedback below and return a SINGLE JSON object
with EXACTLY this shape (no extra keys, no missing keys, no markdown fences):

{
  "validation_score": <int 0-100>,
  "demand_prediction": "Low" | "Medium" | "High",
  "investor_readiness_score": <int 0-100>,
  "sentiment_breakdown": {"positive": <int>, "neutral": <int>, "negative": <int>},
  "purchase_intent_breakdown": {"definitely": <int>, "likely": <int>, "maybe": <int>, "unlikely": <int>, "no": <int>},
  "per_feedback_sentiment": [{"feedback_id": "<id>", "sentiment": "positive"|"neutral"|"negative"}],
  "trends": [<3-6 short strings>],
  "pain_points": [<3-6 short strings>],
  "competitors": [{"name": "<string>", "strengths": "<string>", "weaknesses": "<string>"}],
  "business_models": [<3-5 short suggestions>],
  "revenue_models": [<3-5 short suggestions>],
  "customer_segments": [{"name": "<string>", "description": "<string>", "percent": <int 0-100>}],
  "report": {
    "executive_summary": "<2-4 sentence summary>",
    "market_risks": [<3-5 short strings>],
    "opportunities": [<3-5 short strings>],
    "improvements": [<3-5 short strings>],
    "gtm_strategy": "<3-5 sentence go-to-market strategy>",
    "pricing_strategy": "<2-4 sentence pricing strategy>",
    "pitch_deck": [<6-10 short bullet headlines for a pitch deck outline>]
  },

  "pmf": {
    "pmf_score": <int 0-100>,
    "demand_score": <int 0-100>,
    "market_readiness_score": <int 0-100>,
    "differentiation_score": <int 0-100>,
    "scalability_score": <int 0-100>,
    "what_users_love": [<3-5 short strings>],
    "what_users_dislike": [<3-5 short strings>],
    "missing_features": [<3-5 short strings>],
    "evolution_advice": [<3-5 short strings>]
  },

  "personas": [
    {
      "name": "<short persona name e.g. 'Indie Maker Mia'>",
      "age_range": "<e.g. 28-35>",
      "occupation": "<string>",
      "income_level": "<e.g. $60k-$90k>",
      "goals": [<2-4 short strings>],
      "pain_points": [<2-4 short strings>],
      "buying_motivation": "<1 sentence>",
      "technology_usage": "<1 sentence>",
      "preferred_channels": [<2-4 short strings>]
    }
  ],  // 3-5 personas

  "competitor_intel": {
    "table": [
      {
        "name": "<string>",
        "strengths": "<string>",
        "weaknesses": "<string>",
        "pricing": "<e.g. 'Freemium $0-$29/mo'>",
        "market_position": "<e.g. 'Established mid-market'>",
        "customer_sentiment": "Positive" | "Mixed" | "Negative"
      }
    ],  // 3-5 competitors
    "market_gaps": [<3-5 short strings>],
    "competitive_advantages": [<3-5 short strings>],
    "blue_ocean_opportunities": [<3-5 short strings>]
  },

  "investor": {
    "investor_readiness_score": <int 0-100>,
    "funding_potential_score": <int 0-100>,
    "market_opportunity_score": <int 0-100>,
    "growth_potential_score": <int 0-100>,
    "risk_score": <int 0-100>,
    "why_invest": [<3-5 short strings>],
    "why_reject": [<3-5 short strings>],
    "how_to_improve": [<3-5 short strings>]
  },

  "swot": {
    "strengths": [<3-5 short strings>],
    "weaknesses": [<3-5 short strings>],
    "opportunities": [<3-5 short strings>],
    "threats": [<3-5 short strings>]
  },

  "bmc": {
    "key_partners": [<2-4 short strings>],
    "key_activities": [<2-4 short strings>],
    "key_resources": [<2-4 short strings>],
    "value_proposition": [<2-4 short strings>],
    "customer_relationships": [<2-4 short strings>],
    "channels": [<2-4 short strings>],
    "customer_segments": [<2-4 short strings>],
    "cost_structure": [<2-4 short strings>],
    "revenue_streams": [<2-4 short strings>]
  },

  "success_prediction": {
    "one_year_probability": <int 0-100>,
    "three_year_probability": <int 0-100>,
    "five_year_probability": <int 0-100>,
    "growth_drivers": [<3-5 short strings>],
    "critical_risks": [<3-5 short strings>],
    "market_barriers": [<3-5 short strings>],
    "explanation": "<3-5 sentences explaining the trajectory>"
  },

  "pitch_deck_slides": [
    {"title": "Problem",            "bullets": [<2-4 short strings>]},
    {"title": "Solution",           "bullets": [<2-4 short strings>]},
    {"title": "Market Opportunity", "bullets": [<2-4 short strings>]},
    {"title": "Product",            "bullets": [<2-4 short strings>]},
    {"title": "Competition",        "bullets": [<2-4 short strings>]},
    {"title": "Business Model",     "bullets": [<2-4 short strings>]},
    {"title": "Financial Forecast", "bullets": [<2-4 short strings>]},
    {"title": "Go-To-Market",       "bullets": [<2-4 short strings>]},
    {"title": "Traction",           "bullets": [<2-4 short strings>]},
    {"title": "Vision",             "bullets": [<2-4 short strings>]}
  ]
}

Rules:
- sentiment_breakdown counts must sum to the total number of feedback items.
- purchase_intent_breakdown counts must sum to the total number of feedback items.
- per_feedback_sentiment must include every feedback_id provided exactly once.
- customer_segments percents should sum to ~100.
- All scores are integers in [0,100]. Probabilities decrease or stay similar over time (1y >= 3y >= 5y is allowed but not required).
- Be realistic. If feedback is sparse or negative, scores should be low.
- Respond with JSON ONLY. No prose, no fences.
"""


def _build_user_prompt(project: Dict[str, Any], feedback: List[Dict[str, Any]]) -> str:
    feedback_lines = []
    for f in feedback:
        feedback_lines.append(
            f"- id={f['feedback_id']} | rating={f['rating']}/5 | intent={f['purchase_intent']} "
            f"| feedback=\"{f['feedback_text']}\" | suggestion=\"{f.get('suggestion','')}\""
        )
    feedback_block = "\n".join(feedback_lines) if feedback_lines else "(no feedback yet)"

    return f"""PROJECT
- Name: {project['name']}
- Category: {project['category']}
- Description: {project['description']}
- Target audience: {project['target_audience']}
- Location: {project['location']}

FEEDBACK ({len(feedback)} responses)
{feedback_block}

{ANALYSIS_INSTRUCTIONS}
"""


def _extract_json(text: str) -> Dict[str, Any]:
    """Extract a JSON object from the model output (handles stray fences)."""
    text = text.strip()
    # remove ``` fences if present
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?", "", text).strip()
        if text.endswith("```"):
            text = text[:-3].strip()
    # find first { ... last }
    first = text.find("{")
    last = text.rfind("}")
    if first == -1 or last == -1:
        raise ValueError("No JSON object found in model output")
    return json.loads(text[first : last + 1])


async def analyze_project(
    project: Dict[str, Any], feedback: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """Run Claude analysis and return parsed insights dict."""
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"analysis-{project['project_id']}-{uuid.uuid4().hex[:8]}",
        system_message=SYSTEM_PROMPT,
    ).with_model(AI_MODEL_PROVIDER, AI_MODEL_NAME)

    user_msg = UserMessage(text=_build_user_prompt(project, feedback))
    raw = await chat.send_message(user_msg)
    if not isinstance(raw, str):
        raw = str(raw)
    return _extract_json(raw)


# ---------------- Founder Twin (M9) ----------------
FOUNDER_SYSTEM = """You are an experienced startup advisor. Given a founder's profile
you produce a single JSON object scoring their fit and recommending paths.
Respond with JSON only, no markdown fences, no prose."""

FOUNDER_INSTRUCTIONS = """Return EXACTLY this JSON shape:
{
  "founder_score": <int 0-100>,
  "strengths": [<3-5 short strings>],
  "weaknesses": [<3-5 short strings>],
  "recommended_industries": [<3-5 short strings>],
  "recommended_startup_types": [<3-5 short strings, e.g. 'B2B SaaS', 'Niche marketplace'>],
  "advice": [<4-6 short, specific, actionable strings>]
}"""


async def analyze_founder(profile: Dict[str, Any]) -> Dict[str, Any]:
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"founder-{profile['user_id']}-{uuid.uuid4().hex[:8]}",
        system_message=FOUNDER_SYSTEM,
    ).with_model(AI_MODEL_PROVIDER, AI_MODEL_NAME)

    prompt = f"""FOUNDER PROFILE
- Budget: {profile['budget']}
- Skills: {", ".join(profile['skills'])}
- Years of experience: {profile['experience_years']}
- Industry interests: {", ".join(profile['industry_interests'])}
- Risk appetite: {profile['risk_appetite']}
- Time availability: {profile['time_availability']}
- Prior startups: {profile['prior_startups']}

{FOUNDER_INSTRUCTIONS}
"""
    raw = await chat.send_message(UserMessage(text=prompt))
    if not isinstance(raw, str):
        raw = str(raw)
    return _extract_json(raw)


# ---------------- Idea Battle (M10) ----------------
BATTLE_SYSTEM = """You are a venture capital partner comparing two startup ideas
head-to-head. You are concise and decisive. Respond with JSON only."""

BATTLE_INSTRUCTIONS = """Return EXACTLY:
{
  "criteria": {
    "market_size":      {"a": <int 0-100>, "b": <int 0-100>, "note": "<1 sentence>"},
    "competition":      {"a": <int 0-100>, "b": <int 0-100>, "note": "<1 sentence>"},
    "risk":             {"a": <int 0-100>, "b": <int 0-100>, "note": "<1 sentence>"},
    "revenue_potential":{"a": <int 0-100>, "b": <int 0-100>, "note": "<1 sentence>"},
    "scalability":      {"a": <int 0-100>, "b": <int 0-100>, "note": "<1 sentence>"},
    "investor_appeal":  {"a": <int 0-100>, "b": <int 0-100>, "note": "<1 sentence>"},
    "pmf":              {"a": <int 0-100>, "b": <int 0-100>, "note": "<1 sentence>"}
  },
  "winner": "A" | "B" | "TIE",
  "winner_name": "<the winning project's name, or 'Tie'>",
  "reasoning": "<2-4 sentence justification>",
  "improvements_for_loser": [<3-5 short strings>],
  "improvements_for_winner": [<2-3 short strings>]
}
Note: For 'risk' and 'competition' a LOWER raw score is better, but normalize so
that the higher number in the JSON still means 'better' (i.e. score = 100 - badness).
"""


def _summarize_project_for_battle(p: Dict[str, Any], insight: Dict[str, Any] | None) -> str:
    lines = [
        f"Name: {p['name']}",
        f"Category: {p['category']}",
        f"Description: {p['description']}",
        f"Target audience: {p['target_audience']}",
        f"Location: {p['location']}",
    ]
    if insight:
        lines.append(f"Validation score: {insight.get('validation_score')}")
        lines.append(f"Demand: {insight.get('demand_prediction')}")
        if insight.get("pmf"):
            lines.append(f"PMF score: {insight['pmf'].get('pmf_score')}")
        if insight.get("investor"):
            lines.append(
                f"Investor readiness: {insight['investor'].get('investor_readiness_score')}"
            )
    return "\n".join(lines)


async def battle_ideas(
    project_a: Dict[str, Any],
    project_b: Dict[str, Any],
    insight_a: Dict[str, Any] | None,
    insight_b: Dict[str, Any] | None,
) -> Dict[str, Any]:
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"battle-{uuid.uuid4().hex[:10]}",
        system_message=BATTLE_SYSTEM,
    ).with_model(AI_MODEL_PROVIDER, AI_MODEL_NAME)

    prompt = f"""IDEA A
{_summarize_project_for_battle(project_a, insight_a)}

IDEA B
{_summarize_project_for_battle(project_b, insight_b)}

{BATTLE_INSTRUCTIONS}
"""
    raw = await chat.send_message(UserMessage(text=prompt))
    if not isinstance(raw, str):
        raw = str(raw)
    return _extract_json(raw)
