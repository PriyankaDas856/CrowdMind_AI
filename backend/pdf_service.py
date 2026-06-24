"""PDF report generation using ReportLab."""
from __future__ import annotations

from io import BytesIO
from typing import Any, Dict, List

from reportlab.lib import colors
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
)

AMBER = colors.HexColor("#F59E0B")
DARK_BG = colors.HexColor("#0B0F19")
LIGHT_GRAY = colors.HexColor("#9CA3AF")
WHITE = colors.HexColor("#F9FAFB")


def _styles():
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "title", parent=base["Title"], fontName="Helvetica-Bold",
            fontSize=28, textColor=WHITE, leading=32, spaceAfter=8,
        ),
        "subtitle": ParagraphStyle(
            "subtitle", parent=base["Normal"], fontName="Helvetica",
            fontSize=12, textColor=LIGHT_GRAY, leading=16, spaceAfter=20,
        ),
        "h1": ParagraphStyle(
            "h1", parent=base["Heading1"], fontName="Helvetica-Bold",
            fontSize=18, textColor=AMBER, leading=22, spaceBefore=18, spaceAfter=8,
        ),
        "h2": ParagraphStyle(
            "h2", parent=base["Heading2"], fontName="Helvetica-Bold",
            fontSize=14, textColor=WHITE, leading=18, spaceBefore=10, spaceAfter=6,
        ),
        "body": ParagraphStyle(
            "body", parent=base["Normal"], fontName="Helvetica",
            fontSize=10.5, textColor=WHITE, leading=15, spaceAfter=4,
        ),
        "bullet": ParagraphStyle(
            "bullet", parent=base["Normal"], fontName="Helvetica",
            fontSize=10.5, textColor=WHITE, leading=15, leftIndent=14,
            bulletIndent=2, spaceAfter=2,
        ),
        "label": ParagraphStyle(
            "label", parent=base["Normal"], fontName="Helvetica-Bold",
            fontSize=8, textColor=LIGHT_GRAY, leading=10, spaceAfter=2,
        ),
    }


def _on_page(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(DARK_BG)
    canvas.rect(0, 0, LETTER[0], LETTER[1], stroke=0, fill=1)
    canvas.setFillColor(AMBER)
    canvas.setFont("Helvetica-Bold", 9)
    canvas.drawString(0.6 * inch, 0.55 * inch, "CrowdMind.AI")
    canvas.setFillColor(LIGHT_GRAY)
    canvas.setFont("Helvetica", 8)
    canvas.drawRightString(
        LETTER[0] - 0.6 * inch, 0.55 * inch, f"Page {canvas.getPageNumber()}"
    )
    canvas.restoreState()


def _bullets(items: List[str], s) -> List:
    return [Paragraph(f"• {i}", s["bullet"]) for i in items]


def _bmc_table(bmc: Dict[str, Any], s) -> Table:
    cells = [
        ("Key Partners",            bmc.get("key_partners", [])),
        ("Key Activities",          bmc.get("key_activities", [])),
        ("Value Proposition",       bmc.get("value_proposition", [])),
        ("Customer Relationships",  bmc.get("customer_relationships", [])),
        ("Customer Segments",       bmc.get("customer_segments", [])),
        ("Key Resources",           bmc.get("key_resources", [])),
        ("Channels",                bmc.get("channels", [])),
        ("Cost Structure",          bmc.get("cost_structure", [])),
        ("Revenue Streams",         bmc.get("revenue_streams", [])),
    ]
    rows = []
    row = []
    for i, (k, v) in enumerate(cells):
        body = "<br/>".join(f"• {x}" for x in v) or "—"
        cell = [
            Paragraph(k.upper(), s["label"]),
            Spacer(1, 4),
            Paragraph(body, s["body"]),
        ]
        row.append(cell)
        if (i + 1) % 3 == 0:
            rows.append(row)
            row = []
    if row:
        rows.append(row)
    t = Table(rows, colWidths=[2.4 * inch] * 3)
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#111827")),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#1F2937")),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#1F2937")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    return t


def _swot_table(swot: Dict[str, Any], s) -> Table:
    quadrants = [
        ("STRENGTHS", swot.get("strengths", []), colors.HexColor("#10B981")),
        ("WEAKNESSES", swot.get("weaknesses", []), colors.HexColor("#F43F5E")),
        ("OPPORTUNITIES", swot.get("opportunities", []), colors.HexColor("#3B82F6")),
        ("THREATS", swot.get("threats", []), colors.HexColor("#FBBF24")),
    ]
    rows = []
    for i in range(0, 4, 2):
        row = []
        for j in range(2):
            label, items, c = quadrants[i + j]
            body = "<br/>".join(f"• {x}" for x in items) or "—"
            label_para = Paragraph(f"<font color='{c.hexval()}'>{label}</font>", s["label"])
            row.append([label_para, Spacer(1, 4), Paragraph(body, s["body"])])
        rows.append(row)
    t = Table(rows, colWidths=[3.6 * inch, 3.6 * inch])
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#111827")),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#1F2937")),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#1F2937")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ]
        )
    )
    return t


def build_project_pdf(project: Dict[str, Any], insight: Dict[str, Any]) -> bytes:
    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=LETTER,
        leftMargin=0.6 * inch,
        rightMargin=0.6 * inch,
        topMargin=0.7 * inch,
        bottomMargin=0.7 * inch,
        title=f"{project['name']} — CrowdMind AI Report",
    )
    s = _styles()
    story = []

    # COVER
    story.append(Paragraph("CrowdMind AI · Validation Report", s["label"]))
    story.append(Paragraph(project["name"], s["title"]))
    story.append(Paragraph(project["description"], s["subtitle"]))
    story.append(
        Paragraph(
            f"<b>Category:</b> {project['category']} &nbsp;&nbsp; "
            f"<b>Audience:</b> {project['target_audience']} &nbsp;&nbsp; "
            f"<b>Location:</b> {project['location']}",
            s["body"],
        )
    )
    story.append(Spacer(1, 18))

    # Scores grid
    pmf = insight.get("pmf", {})
    investor = insight.get("investor", {})
    success = insight.get("success_prediction", {})
    grid = [
        ["VALIDATION", str(insight.get("validation_score", "—")),
         "PMF", str(pmf.get("pmf_score", "—"))],
        ["INVESTOR", str(investor.get("investor_readiness_score",
                                       insight.get("investor_readiness_score", "—"))),
         "1Y SUCCESS", f"{success.get('one_year_probability', '—')}%"],
    ]
    t = Table(grid, colWidths=[1.7 * inch] * 4)
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#111827")),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#1F2937")),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#1F2937")),
                ("TEXTCOLOR", (0, 0), (-1, -1), WHITE),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
                ("FONTSIZE", (1, 0), (1, -1), 22),
                ("FONTSIZE", (3, 0), (3, -1), 22),
                ("TEXTCOLOR", (1, 0), (1, -1), AMBER),
                ("TEXTCOLOR", (3, 0), (3, -1), AMBER),
                ("ALIGN", (1, 0), (1, -1), "CENTER"),
                ("ALIGN", (3, 0), (3, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 14),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 14),
            ]
        )
    )
    story.append(t)

    # EXEC SUMMARY
    story.append(Paragraph("Executive summary", s["h1"]))
    story.append(
        Paragraph(insight.get("report", {}).get("executive_summary", ""), s["body"])
    )

    # PMF
    if pmf:
        story.append(Paragraph("Product-Market Fit", s["h1"]))
        story.append(Paragraph(
            f"PMF {pmf.get('pmf_score','—')} · Demand {pmf.get('demand_score','—')} · "
            f"Readiness {pmf.get('market_readiness_score','—')} · "
            f"Differentiation {pmf.get('differentiation_score','—')} · "
            f"Scalability {pmf.get('scalability_score','—')}",
            s["body"],
        ))
        story.append(Paragraph("What users love", s["h2"]))
        story.extend(_bullets(pmf.get("what_users_love", []), s))
        story.append(Paragraph("What users dislike", s["h2"]))
        story.extend(_bullets(pmf.get("what_users_dislike", []), s))
        story.append(Paragraph("Missing features", s["h2"]))
        story.extend(_bullets(pmf.get("missing_features", []), s))
        story.append(Paragraph("How the idea should evolve", s["h2"]))
        story.extend(_bullets(pmf.get("evolution_advice", []), s))

    # PERSONAS
    personas = insight.get("personas", []) or []
    if personas:
        story.append(PageBreak())
        story.append(Paragraph("Customer personas", s["h1"]))
        for p in personas:
            story.append(Paragraph(
                f"{p.get('name','—')} · {p.get('age_range','—')} · {p.get('occupation','—')}",
                s["h2"],
            ))
            story.append(Paragraph(
                f"Income: {p.get('income_level','—')} · "
                f"Channels: {', '.join(p.get('preferred_channels', []))}",
                s["body"],
            ))
            story.append(Paragraph("Goals", s["label"]))
            story.extend(_bullets(p.get("goals", []), s))
            story.append(Paragraph("Pain points", s["label"]))
            story.extend(_bullets(p.get("pain_points", []), s))
            story.append(Paragraph(
                f"<b>Motivation:</b> {p.get('buying_motivation','—')}", s["body"]
            ))
            story.append(Spacer(1, 6))

    # SWOT
    swot = insight.get("swot")
    if swot:
        story.append(PageBreak())
        story.append(Paragraph("SWOT analysis", s["h1"]))
        story.append(_swot_table(swot, s))

    # BMC
    bmc = insight.get("bmc")
    if bmc:
        story.append(PageBreak())
        story.append(Paragraph("Business Model Canvas", s["h1"]))
        story.append(_bmc_table(bmc, s))

    # INVESTOR
    if investor:
        story.append(PageBreak())
        story.append(Paragraph("Investor readiness", s["h1"]))
        story.append(Paragraph(
            f"Readiness {investor.get('investor_readiness_score','—')} · "
            f"Funding potential {investor.get('funding_potential_score','—')} · "
            f"Opportunity {investor.get('market_opportunity_score','—')} · "
            f"Growth {investor.get('growth_potential_score','—')} · "
            f"Risk {investor.get('risk_score','—')}",
            s["body"],
        ))
        story.append(Paragraph("Why investors may invest", s["h2"]))
        story.extend(_bullets(investor.get("why_invest", []), s))
        story.append(Paragraph("Why investors may reject", s["h2"]))
        story.extend(_bullets(investor.get("why_reject", []), s))
        story.append(Paragraph("How to improve attractiveness", s["h2"]))
        story.extend(_bullets(investor.get("how_to_improve", []), s))

    # SUCCESS PREDICTION
    if success:
        story.append(PageBreak())
        story.append(Paragraph("Success prediction", s["h1"]))
        story.append(Paragraph(
            f"1Y {success.get('one_year_probability','—')}% · "
            f"3Y {success.get('three_year_probability','—')}% · "
            f"5Y {success.get('five_year_probability','—')}%",
            s["body"],
        ))
        story.append(Paragraph(success.get("explanation", ""), s["body"]))
        story.append(Paragraph("Growth drivers", s["h2"]))
        story.extend(_bullets(success.get("growth_drivers", []), s))
        story.append(Paragraph("Critical risks", s["h2"]))
        story.extend(_bullets(success.get("critical_risks", []), s))
        story.append(Paragraph("Market barriers", s["h2"]))
        story.extend(_bullets(success.get("market_barriers", []), s))

    # PITCH DECK
    slides = insight.get("pitch_deck_slides", []) or []
    if slides:
        story.append(PageBreak())
        story.append(Paragraph("Pitch deck outline", s["h1"]))
        for i, sl in enumerate(slides, 1):
            story.append(Paragraph(f"{i:02d}. {sl.get('title','—')}", s["h2"]))
            story.extend(_bullets(sl.get("bullets", []), s))

    doc.build(story, onFirstPage=_on_page, onLaterPages=_on_page)
    return buf.getvalue()
