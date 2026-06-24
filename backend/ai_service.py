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

ANALYSIS_INSTRUCTIONS = """Analyze the project and feedback below and return a JSON object
with EXACTLY this shape (no extra keys, no missing keys):

{
  "validation_score": <int 0-100>,
  "demand_prediction": "Low" | "Medium" | "High",
  "investor_readiness_score": <int 0-100>,
  "sentiment_breakdown": {"positive": <int>, "neutral": <int>, "negative": <int>},
  "purchase_intent_breakdown": {"definitely": <int>, "likely": <int>, "maybe": <int>, "unlikely": <int>, "no": <int>},
  "per_feedback_sentiment": [{"feedback_id": "<id>", "sentiment": "positive"|"neutral"|"negative"}],
  "trends": [<3-6 short strings of recurring customer needs/themes>],
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
  }
}

Rules:
- sentiment_breakdown counts must sum to the total number of feedback items.
- purchase_intent_breakdown counts must sum to the total number of feedback items.
- per_feedback_sentiment must include every feedback_id provided exactly once.
- competitors: include 2-4 likely competitors based on the category and description.
- customer_segments percents should sum to ~100.
- All scores are integers.
- Be realistic. If feedback is sparse or negative, scores should be low.
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
