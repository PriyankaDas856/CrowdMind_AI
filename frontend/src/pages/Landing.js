import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Sparkles,
    ArrowRight,
    BarChart3,
    Brain,
    Compass,
    LineChart,
    Quote,
    Rocket,
    Users,
    Shield,
    Target,
    TrendingUp,
    AlertTriangle,
    Lightbulb,
    DollarSign,
    Plus,
    Star,
    Trophy,
    Swords,
    UserCircle2,
    Check,
    ChevronDown,
    Zap,
} from "lucide-react";
import { useAuth } from "../lib/auth-context";

// ---------------------------------------------------------
// Problem Statement — why most ideas fail
// ---------------------------------------------------------
const PROBLEMS = [
    {
        stat: "42%",
        title: "Build something nobody wants",
        body: "The #1 reason startups die — no market need. CrowdMind catches it before you commit.",
    },
    {
        stat: "29%",
        title: "Burn cash before validation",
        body: "Founders waste an average of 9 months and $40k before they realise the wedge is wrong.",
    },
    {
        stat: "$0",
        title: "Customer interviews go unread",
        body: "Even when feedback is collected, it sits in spreadsheets. Patterns get missed by humans.",
    },
];

// ---------------------------------------------------------
// How It Works — 4 steps
// ---------------------------------------------------------
const STEPS = [
    {
        n: "01",
        title: "Describe the idea",
        body: "Name, category, audience, location. 60 seconds.",
        icon: Sparkles,
    },
    {
        n: "02",
        title: "Collect signed-in feedback",
        body: "Share a public link. Reviewers rate, comment, and signal intent.",
        icon: Users,
    },
    {
        n: "03",
        title: "Run the AI pipeline",
        body: "8 modules run in parallel — PMF, personas, competitors, investor, SWOT, BMC, forecast, report.",
        icon: Brain,
    },
    {
        n: "04",
        title: "Decide with conviction",
        body: "Get a score, a pitch deck outline, and a strategic plan. Pivot, polish, or build.",
        icon: Rocket,
    },
];

// ---------------------------------------------------------
// AI Features — top-level value props
// ---------------------------------------------------------
const FEATURES = [
    {
        icon: Brain,
        title: "Sentiment-aware analysis",
        body: "Every response labelled positive, neutral or negative — and the AI tells you why.",
    },
    {
        icon: BarChart3,
        title: "0–100 validation score",
        body: "A single, defensible number you can put in a pitch deck. Backed by the data.",
    },
    {
        icon: Compass,
        title: "Trend & pain-point mining",
        body: "Recurring themes and blockers pulled out of unstructured feedback automatically.",
    },
    {
        icon: Users,
        title: "Auto customer segments",
        body: "Persona clusters with sized opportunity and channel recommendations.",
    },
    {
        icon: LineChart,
        title: "1y / 3y / 5y success forecast",
        body: "Probability-weighted predictions backed by drivers, risks and market barriers.",
    },
    {
        icon: Rocket,
        title: "GTM, pricing & pitch outline",
        body: "Actionable strategy and a 10-slide pitch deck — generated, exportable as PDF.",
    },
];

// ---------------------------------------------------------
// Startup Validation Process — the 8 modules timeline
// ---------------------------------------------------------
const MODULES = [
    { n: "1", title: "Product-Market Fit", body: "5 sub-scores: demand, readiness, differentiation, scalability, fit.", icon: Target },
    { n: "2", title: "Customer Personas", body: "3–5 personas with goals, pain points and channels.", icon: Users },
    { n: "3", title: "Competitor Intelligence", body: "Table + pricing + market gaps + blue-ocean opportunities.", icon: Compass },
    { n: "4", title: "Investor Readiness", body: "5 sub-scores + why-invest / why-reject / how-to-improve.", icon: DollarSign },
    { n: "5", title: "SWOT Matrix", body: "Strengths, weaknesses, opportunities, threats.", icon: Shield },
    { n: "6", title: "Business Model Canvas", body: "All 9 cells — partners, activities, value prop, channels.", icon: BarChart3 },
    { n: "7", title: "Success Forecast", body: "1y / 3y / 5y probabilities + drivers and barriers.", icon: TrendingUp },
    { n: "8", title: "Strategic Report", body: "Exec summary, GTM, pricing, 10-slide pitch deck.", icon: Lightbulb },
];

// ---------------------------------------------------------
// FAQ
// ---------------------------------------------------------
const FAQS = [
    {
        q: "What model is powering the analysis?",
        a: "Anthropic Claude Sonnet 4.5 via the Emergent Universal LLM Key. We use 8 focused per-module prompts run concurrently — not one monolithic call — so the pipeline finishes in ~30 seconds and is fault-tolerant if one module fails.",
    },
    {
        q: "Is my data private?",
        a: "Your projects and feedback are isolated to your account. We never train models on your data, and analyses run on your dedicated key.",
    },
    {
        q: "How many feedback responses do I need?",
        a: "You can run an analysis with as little as 1 response, but quality compounds quickly. We recommend 15–30 for a defensible report and 50+ for an investor-ready story.",
    },
    {
        q: "Can I export the report?",
        a: "Yes. Every analyzed project has a one-click PDF download with full sections — executive summary, PMF, personas, competitor intel, SWOT, Business Model Canvas, investor block, success forecast, and a 10-slide pitch deck outline.",
    },
    {
        q: "What's the difference between CrowdMind and surveys / spreadsheets?",
        a: "Surveys collect; spreadsheets store. CrowdMind reads between the lines — extracting themes, sentiments, customer segments, investor objections, and competitive gaps from unstructured feedback. It's the analyst you can't afford to hire full-time.",
    },
    {
        q: "Do you offer a public leaderboard?",
        a: "Yes — opt-in per project. Published projects rank by validation, PMF, investor readiness, innovation, or community likes. Great for hackathons and accelerators.",
    },
    {
        q: "How is the demo data marked?",
        a: "Every demo project carries an `is_demo: true` flag, a 'DEMO' badge in the UI, and the insight model name is `demo-sample-analysis-v1` so it can never be confused with a real analysis.",
    },
    {
        q: "Is there a free tier?",
        a: "CrowdMind is free during beta — no credit card required. Pricing for production accounts will be founder-friendly.",
    },
];

// ---------------------------------------------------------
// Testimonials
// ---------------------------------------------------------
const TESTIMONIALS = [
    {
        quote:
            "We killed two ideas and doubled down on a third in a single afternoon. CrowdMind told us what 40 hours of user calls would have.",
        name: "Maya Okafor",
        role: "Founder, Threadwise",
        initials: "MO",
    },
    {
        quote:
            "The competitor intel table is the first thing I show every investor now. It saved my deck.",
        name: "Diego Hernández",
        role: "CEO, NomadOps",
        initials: "DH",
    },
    {
        quote:
            "I ran my idea, got an honest 41/100, and rebuilt the wedge in a week. Now we're at 78. Worth it.",
        name: "Priya Rao",
        role: "Solo founder, MealMap",
        initials: "PR",
    },
];

// =================================================================
function FAQItem({ q, a, idx }) {
    const [open, setOpen] = useState(idx === 0);
    return (
        <div
            className={`rounded-2xl border transition-all ${
                open
                    ? "border-amber-500/30 bg-amber-500/[0.04]"
                    : "border-white/8 bg-white/[0.02] hover:border-white/15"
            }`}
            data-testid={`faq-item-${idx}`}
        >
            <button
                onClick={() => setOpen(!open)}
                className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left"
                aria-expanded={open}
            >
                <span className="font-display font-semibold text-base sm:text-lg tracking-tight">
                    {q}
                </span>
                <ChevronDown
                    className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform ${
                        open ? "rotate-180 text-amber-400" : ""
                    }`}
                />
            </button>
            <div
                className={`grid transition-all duration-300 ease-out ${
                    open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
            >
                <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-sm text-zinc-400 leading-relaxed">{a}</p>
                </div>
            </div>
        </div>
    );
}

function FeatureHighlightLeft({ label, title, body, bullets, mock }) {
    return (
        <section className="py-20 border-t border-white/5">
            <div className="max-w-7xl mx-auto px-5 lg:px-8 grid lg:grid-cols-12 gap-10 items-center cm-fade-up">
                <div className="lg:col-span-5">
                    <div className="cm-label mb-3">{label}</div>
                    <h2 className="font-display font-bold text-3xl sm:text-4xl tracking-tighter">
                        {title}
                    </h2>
                    <p className="mt-4 text-zinc-400 leading-relaxed">{body}</p>
                    <ul className="mt-6 space-y-2.5 text-sm">
                        {bullets.map((b, i) => (
                            <li key={i} className="flex items-start gap-2.5">
                                <span className="mt-1.5 w-4 h-4 rounded-md bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                                    <Check className="w-2.5 h-2.5 text-amber-300" />
                                </span>
                                <span className="text-zinc-300">{b}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="lg:col-span-7">{mock}</div>
            </div>
        </section>
    );
}

function FeatureHighlightRight({ label, title, body, bullets, mock }) {
    return (
        <section className="py-20 border-t border-white/5">
            <div className="max-w-7xl mx-auto px-5 lg:px-8 grid lg:grid-cols-12 gap-10 items-center cm-fade-up">
                <div className="lg:col-span-7 order-2 lg:order-1">{mock}</div>
                <div className="lg:col-span-5 order-1 lg:order-2">
                    <div className="cm-label mb-3">{label}</div>
                    <h2 className="font-display font-bold text-3xl sm:text-4xl tracking-tighter">
                        {title}
                    </h2>
                    <p className="mt-4 text-zinc-400 leading-relaxed">{body}</p>
                    <ul className="mt-6 space-y-2.5 text-sm">
                        {bullets.map((b, i) => (
                            <li key={i} className="flex items-start gap-2.5">
                                <span className="mt-1.5 w-4 h-4 rounded-md bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                                    <Check className="w-2.5 h-2.5 text-amber-300" />
                                </span>
                                <span className="text-zinc-300">{b}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
}

// ----- mock UI tiles for the feature highlights -----
function PMFMock() {
    const scores = [
        { l: "PMF", v: 78, hl: true },
        { l: "Demand", v: 82 },
        { l: "Readiness", v: 68 },
        { l: "Differentiation", v: 74 },
        { l: "Scalability", v: 80 },
    ];
    return (
        <div className="cm-glass rounded-3xl p-6 lg:p-7">
            <div className="cm-label">Sample · PMF Engine</div>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-3">
                {scores.map((s) => (
                    <div
                        key={s.l}
                        className={`rounded-xl p-3 border ${
                            s.hl
                                ? "border-amber-500/40 bg-amber-500/8"
                                : "border-white/8 bg-white/2"
                        }`}
                    >
                        <div className="cm-label text-[9px]">{s.l}</div>
                        <div className="font-display font-bold text-2xl text-amber-300 mt-1">
                            {s.v}
                        </div>
                        <div className="mt-2 h-1 rounded-full bg-white/5 overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-amber-500 to-amber-300"
                                style={{ width: `${s.v}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-5 grid sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/5 bg-white/2 p-3">
                    <div className="cm-label text-emerald-300">What users love</div>
                    <div className="mt-1 text-xs text-zinc-300">AI summary of medical jargon</div>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/2 p-3">
                    <div className="cm-label text-rose-300">What users dislike</div>
                    <div className="mt-1 text-xs text-zinc-300">Permissions friction at signup</div>
                </div>
            </div>
        </div>
    );
}

function CompetitorMock() {
    const rows = [
        { n: "Apple Health", p: "Free (iOS)", s: "Positive" },
        { n: "MyChart", p: "Free", s: "Mixed" },
        { n: "Doctolib", p: "Free", s: "Positive" },
        { n: "Practo", p: "$0–$8/mo", s: "Mixed" },
    ];
    return (
        <div className="cm-glass rounded-3xl p-0 overflow-hidden">
            <div className="px-6 py-5 border-b border-white/5">
                <div className="cm-label">Sample · Competitor Intelligence</div>
                <div className="mt-1 font-display font-bold tracking-tight">
                    4 plausible competitors detected
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-white/3">
                        <tr className="text-left text-xs uppercase tracking-widest text-zinc-500">
                            <th className="px-5 py-3">Competitor</th>
                            <th className="px-5 py-3">Pricing</th>
                            <th className="px-5 py-3">Sentiment</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r, i) => (
                            <tr key={i} className="border-t border-white/5">
                                <td className="px-5 py-3 font-display font-bold">{r.n}</td>
                                <td className="px-5 py-3 text-zinc-300 font-mono text-xs">
                                    {r.p}
                                </td>
                                <td className="px-5 py-3">
                                    <span
                                        className={`text-xs px-2 py-0.5 rounded-full border ${
                                            r.s === "Positive"
                                                ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/20"
                                                : "text-zinc-300 bg-white/5 border-white/10"
                                        }`}
                                    >
                                        {r.s}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="px-6 py-4 border-t border-white/5 grid grid-cols-3 gap-3 text-xs">
                <div className="rounded-md bg-white/2 border border-white/5 p-2.5">
                    <div className="cm-label text-amber-300">Market gap</div>
                    <div className="mt-1 text-zinc-300">AI explanation layer</div>
                </div>
                <div className="rounded-md bg-white/2 border border-white/5 p-2.5">
                    <div className="cm-label text-emerald-300">Your edge</div>
                    <div className="mt-1 text-zinc-300">Smart redaction sharing</div>
                </div>
                <div className="rounded-md bg-white/2 border border-white/5 p-2.5">
                    <div className="cm-label text-blue-300">Blue ocean</div>
                    <div className="mt-1 text-zinc-300">Caregiver family vaults</div>
                </div>
            </div>
        </div>
    );
}

function PersonasMock() {
    const personas = [
        { n: "Caregiver Anya", a: "34–42", o: "Marketing manager + caregiver" },
        { n: "Nomad Diego", a: "27–35", o: "Remote engineer" },
        { n: "Senior Margaret", a: "62–74", o: "Retired teacher" },
    ];
    return (
        <div className="grid sm:grid-cols-3 gap-3">
            {personas.map((p, i) => (
                <div
                    key={p.n}
                    className="cm-glass rounded-2xl p-4"
                    style={{
                        transform: `translateY(${i === 1 ? "-12px" : "0"})`,
                    }}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center font-display font-black text-amber-300 text-sm">
                            {p.n.split(" ")[1][0]}
                        </div>
                        <div className="min-w-0">
                            <div className="font-display font-bold text-sm truncate">{p.n}</div>
                            <div className="text-[10px] font-mono text-zinc-500">{p.a}</div>
                        </div>
                    </div>
                    <div className="mt-3 text-xs text-zinc-400 line-clamp-2">{p.o}</div>
                    <div className="mt-3 cm-label text-[9px]">Top goal</div>
                    <div className="mt-1 text-xs text-zinc-300">Consolidate records</div>
                </div>
            ))}
        </div>
    );
}

function InvestorMock() {
    const scores = [
        { l: "Readiness", v: 72, hl: true },
        { l: "Funding", v: 70 },
        { l: "Opportunity", v: 82 },
        { l: "Growth", v: 74 },
        { l: "Risk", v: 38, inv: true },
    ];
    return (
        <div className="cm-glass rounded-3xl p-6 lg:p-7">
            <div className="cm-label">Sample · Investor Readiness</div>
            <div className="mt-4 grid grid-cols-5 gap-2">
                {scores.map((s) => (
                    <div
                        key={s.l}
                        className={`rounded-xl border p-2.5 ${
                            s.hl
                                ? "border-amber-500/40 bg-amber-500/8"
                                : "border-white/8 bg-white/2"
                        }`}
                    >
                        <div className="cm-label text-[9px]">{s.l}</div>
                        <div
                            className={`font-display font-bold text-xl mt-1 ${
                                s.inv ? "text-rose-300" : "text-amber-300"
                            }`}
                        >
                            {s.v}
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-5 space-y-2">
                <div className="flex items-start gap-2.5 p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-300 mt-0.5 shrink-0" />
                    <div className="text-xs text-zinc-300">
                        <span className="text-emerald-300 font-semibold">Why invest:</span>{" "}
                        Strong qualitative validation, differentiated AI layer
                    </div>
                </div>
                <div className="flex items-start gap-2.5 p-3 rounded-lg border border-rose-500/20 bg-rose-500/5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-300 mt-0.5 shrink-0" />
                    <div className="text-xs text-zinc-300">
                        <span className="text-rose-300 font-semibold">Why reject:</span>{" "}
                        Apple / Google can fast-follow on consumer
                    </div>
                </div>
            </div>
        </div>
    );
}

// =================================================================
export default function Landing() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const goCta = () => navigate(user ? "/dashboard" : "/register");

    return (
        <div className="cm-bg min-h-screen">
            {/* Top nav */}
            <header className="sticky top-0 z-50 border-b border-white/5 cm-glass-strong">
                <div className="max-w-7xl mx-auto px-5 lg:px-8 h-16 flex items-center justify-between">
                    <Link
                        to="/"
                        className="flex items-center gap-2.5"
                        data-testid="landing-logo"
                    >
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center cm-amber-glow">
                            <Sparkles
                                className="w-4 h-4 text-zinc-950"
                                strokeWidth={2.5}
                            />
                        </div>
                        <div className="font-display font-extrabold text-lg">
                            CrowdMind<span className="text-amber-400">.</span>AI
                        </div>
                    </Link>
                    <nav className="hidden md:flex items-center gap-6 text-sm text-zinc-400">
                        <a href="#how" className="hover:text-white transition">
                            How it works
                        </a>
                        <a href="#features" className="hover:text-white transition">
                            Features
                        </a>
                        <a href="#process" className="hover:text-white transition">
                            Process
                        </a>
                        <a href="#faq" className="hover:text-white transition">
                            FAQ
                        </a>
                        <Link to="/leaderboard" className="hover:text-white transition">
                            Leaderboard
                        </Link>
                    </nav>
                    <div className="flex items-center gap-2">
                        <Link
                            to="/login"
                            data-testid="nav-login-btn"
                            className="px-4 py-2 rounded-full text-sm text-zinc-300 hover:text-white hover:bg-white/5 transition"
                        >
                            Sign in
                        </Link>
                        <button
                            onClick={goCta}
                            data-testid="nav-cta-btn"
                            className="px-4 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-sm transition cm-amber-glow"
                        >
                            {user ? "Open dashboard" : "Start free"}
                        </button>
                    </div>
                </div>
            </header>

            {/* HERO */}
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 cm-grid-lines opacity-30 [mask-image:radial-gradient(800px_500px_at_50%_0%,black,transparent)]" />
                <div className="max-w-7xl mx-auto px-5 lg:px-8 pt-20 pb-24 lg:pt-28 lg:pb-32 grid lg:grid-cols-12 gap-10 items-center">
                    <div className="lg:col-span-7 cm-fade-up">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full cm-glass text-xs text-amber-300 font-medium mb-6">
                            <span className="w-2 h-2 rounded-full bg-amber-400 cm-pulse" />
                            Powered by Claude Sonnet 4.5 · 8-module pipeline
                        </div>
                        <h1 className="font-display font-black text-5xl sm:text-6xl lg:text-7xl tracking-tighter leading-[0.95]">
                            Validate your idea
                            <br />
                            <span className="cm-text-gradient">
                                before you build it.
                            </span>
                        </h1>
                        <p className="mt-6 text-lg text-zinc-400 max-w-xl leading-relaxed">
                            CrowdMind turns raw customer feedback into a market validation
                            score, demand prediction, competitor map, investor readiness report
                            and a complete pitch deck — in under a minute.
                        </p>
                        <div className="mt-8 flex flex-wrap items-center gap-3">
                            <button
                                onClick={goCta}
                                data-testid="hero-primary-cta"
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold transition cm-amber-glow"
                            >
                                {user ? "Open dashboard" : "Validate an idea — free"}
                                <ArrowRight className="w-4 h-4" />
                            </button>
                            <Link
                                to="/leaderboard"
                                data-testid="hero-secondary-cta"
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-full cm-glass text-zinc-100 hover:bg-white/10 transition"
                            >
                                Explore live leaderboard
                            </Link>
                        </div>
                        <div className="mt-10 flex items-center gap-6 text-xs text-zinc-500">
                            <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4 text-zinc-400" />
                                No credit card
                            </div>
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-amber-400" />
                                Full AI report in &lt;60s
                            </div>
                            <div className="flex items-center gap-2">
                                <Star className="w-4 h-4 text-amber-400" />
                                8 modules · fault-tolerant
                            </div>
                        </div>
                    </div>

                    {/* Hero dashboard preview */}
                    <div
                        className="lg:col-span-5 cm-fade-up"
                        style={{ animationDelay: "0.15s" }}
                    >
                        <div className="cm-glass rounded-3xl p-6 lg:p-7">
                            <div className="flex items-center justify-between">
                                <div className="cm-label">Validation score</div>
                                <span className="text-xs text-emerald-400 font-mono cm-breathe">
                                    live
                                </span>
                            </div>
                            <div className="mt-2 flex items-end gap-3">
                                <div className="font-display text-7xl font-black tracking-tighter cm-text-gradient">
                                    82
                                </div>
                                <div className="pb-2 text-xs text-zinc-500 font-mono">
                                    / 100
                                </div>
                            </div>
                            <div className="mt-1 text-sm text-emerald-300">
                                High demand · strong purchase intent
                            </div>

                            <div className="mt-6 grid grid-cols-3 gap-2">
                                {[
                                    { l: "Positive", v: "72%", c: "text-emerald-300" },
                                    { l: "Neutral", v: "18%", c: "text-zinc-300" },
                                    { l: "Negative", v: "10%", c: "text-rose-300" },
                                ].map((s) => (
                                    <div
                                        key={s.l}
                                        className="rounded-xl border border-white/8 bg-white/3 p-3"
                                    >
                                        <div className="cm-label text-[9px]">{s.l}</div>
                                        <div
                                            className={`font-display font-bold text-xl ${s.c}`}
                                        >
                                            {s.v}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-5 space-y-2">
                                {[
                                    "Onboarding too long",
                                    "Wants offline mode",
                                    "Pricing too steep for solo",
                                ].map((t, i) => (
                                    <div
                                        key={t}
                                        className="flex items-center justify-between rounded-lg border border-white/5 bg-white/2 px-3 py-2"
                                    >
                                        <span className="text-sm text-zinc-300">{t}</span>
                                        <span className="text-xs font-mono text-amber-300">
                                            #{i + 1}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* PROBLEM STATEMENT */}
            <section className="py-20 border-t border-white/5">
                <div className="max-w-7xl mx-auto px-5 lg:px-8">
                    <div className="max-w-2xl">
                        <div className="cm-label mb-3">The problem</div>
                        <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl tracking-tighter">
                            Most startups die from{" "}
                            <span className="text-rose-300">building the wrong thing.</span>
                        </h2>
                        <p className="mt-4 text-zinc-400 max-w-xl leading-relaxed">
                            Not from lack of effort. Not from competition. From shipping
                            something nobody wants — when the signal was sitting in their
                            feedback the whole time.
                        </p>
                    </div>
                    <div className="mt-12 grid md:grid-cols-3 gap-4 cm-stagger">
                        {PROBLEMS.map((p) => (
                            <div
                                key={p.title}
                                className="cm-card rounded-2xl p-6"
                                data-testid={`problem-${p.title.replace(/\s+/g, "-").toLowerCase()}`}
                            >
                                <div className="font-display font-black text-5xl tracking-tighter text-rose-300/90">
                                    {p.stat}
                                </div>
                                <div className="mt-3 font-display font-bold text-lg">
                                    {p.title}
                                </div>
                                <div className="mt-2 text-sm text-zinc-400 leading-relaxed">
                                    {p.body}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section id="how" className="py-20 border-t border-white/5">
                <div className="max-w-7xl mx-auto px-5 lg:px-8">
                    <div className="max-w-2xl">
                        <div className="cm-label mb-3">How it works</div>
                        <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl tracking-tighter">
                            From raw feedback to{" "}
                            <span className="cm-text-gradient">conviction</span> — in four
                            steps.
                        </h2>
                    </div>
                    <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 cm-stagger">
                        {STEPS.map((s) => (
                            <div
                                key={s.n}
                                className="cm-card rounded-2xl p-6"
                                data-testid={`step-${s.n}`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="font-mono text-amber-400 text-sm">
                                        {s.n}
                                    </div>
                                    <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/15 flex items-center justify-center">
                                        <s.icon className="w-4 h-4 text-amber-400" />
                                    </div>
                                </div>
                                <div className="mt-4 font-display font-bold text-lg">
                                    {s.title}
                                </div>
                                <div className="mt-2 text-sm text-zinc-400 leading-relaxed">
                                    {s.body}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* AI FEATURES */}
            <section id="features" className="py-20 border-t border-white/5">
                <div className="max-w-7xl mx-auto px-5 lg:px-8">
                    <div className="max-w-2xl">
                        <div className="cm-label mb-3">Inside the engine</div>
                        <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl tracking-tighter">
                            Eight signals. One score.
                            <br />
                            <span className="text-zinc-500">A real plan.</span>
                        </h2>
                    </div>
                    <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-4 cm-stagger">
                        {FEATURES.map((f) => (
                            <div
                                key={f.title}
                                className="cm-card rounded-2xl p-6 group"
                                data-testid={`feature-${f.title.replace(/\s+/g, "-").toLowerCase()}`}
                            >
                                <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center group-hover:bg-amber-500/15 transition">
                                    <f.icon className="w-5 h-5 text-amber-400" />
                                </div>
                                <div className="mt-4 font-display font-bold text-lg">
                                    {f.title}
                                </div>
                                <div className="mt-2 text-sm text-zinc-400 leading-relaxed">
                                    {f.body}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* STARTUP VALIDATION PROCESS — the 8 modules */}
            <section id="process" className="py-20 border-t border-white/5">
                <div className="max-w-7xl mx-auto px-5 lg:px-8">
                    <div className="max-w-2xl">
                        <div className="cm-label mb-3">The 8-module pipeline</div>
                        <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl tracking-tighter">
                            One run.{" "}
                            <span className="cm-text-gradient">Eight modules.</span>{" "}
                            Thirty seconds.
                        </h2>
                        <p className="mt-4 text-zinc-400 max-w-xl">
                            Every analysis runs all eight modules concurrently. If one stumbles,
                            the others still complete — fault tolerance built in.
                        </p>
                    </div>
                    <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-3 cm-stagger">
                        {MODULES.map((m) => (
                            <div
                                key={m.title}
                                className="cm-card rounded-2xl p-5 relative overflow-hidden"
                                data-testid={`module-${m.n}`}
                            >
                                <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-amber-500/8 blur-xl" />
                                <div className="relative flex items-center justify-between">
                                    <div className="font-mono text-amber-400 text-xs">
                                        Module {m.n}
                                    </div>
                                    <m.icon className="w-4 h-4 text-amber-400" />
                                </div>
                                <div className="relative mt-3 font-display font-bold tracking-tight">
                                    {m.title}
                                </div>
                                <div className="relative mt-1.5 text-xs text-zinc-400 leading-relaxed">
                                    {m.body}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FEATURE HIGHLIGHTS — alternating layouts */}
            <FeatureHighlightLeft
                label="Module 1"
                title="Product-Market Fit Analysis"
                body="Five sub-scores quantify what your gut feel can't — demand, market readiness, differentiation, scalability, and overall fit. Plus a qualitative read on what users love, hate, and want next."
                bullets={[
                    "Quantified PMF score 0–100",
                    "Five composable sub-scores",
                    "Loved / disliked / missing themes",
                    "Evolution roadmap",
                ]}
                mock={<PMFMock />}
            />

            <FeatureHighlightRight
                label="Module 3"
                title="Competitor Intelligence"
                body="Surfaces the competitors you'd run into in pitch meetings — with pricing, market position and customer sentiment. Then maps the market gaps, your competitive edge, and a few blue-ocean angles nobody is chasing yet."
                bullets={[
                    "Auto-discovered competitors with pricing",
                    "Sentiment classification per competitor",
                    "Market gap analysis",
                    "Blue-ocean opportunities",
                ]}
                mock={<CompetitorMock />}
            />

            <FeatureHighlightLeft
                label="Module 2"
                title="Customer Personas"
                body="Three to five fully-drawn personas with age range, occupation, income, goals, pain points and the channels they actually read — so you know who to build for, and how to reach them."
                bullets={[
                    "3–5 personas per project",
                    "Goals + pain points + channels",
                    "Tech comfort + buying motivation",
                    "Sized as customer segments",
                ]}
                mock={<PersonasMock />}
            />

            <FeatureHighlightRight
                label="Module 4"
                title="Investor Readiness Analysis"
                body="Five investor-shaped sub-scores plus a candid view of why a VC might invest, why they might pass, and the highest-leverage moves to close the gap. The exact framing your next pitch deck needs."
                bullets={[
                    "Investor / Funding / Opportunity / Growth / Risk",
                    "Why-invest vs why-reject lists",
                    "Specific gap-closing moves",
                    "Auto-feeds your pitch deck",
                ]}
                mock={<InvestorMock />}
            />

            {/* TESTIMONIALS */}
            <section className="py-20 border-t border-white/5">
                <div className="max-w-7xl mx-auto px-5 lg:px-8">
                    <div className="max-w-2xl mx-auto text-center">
                        <div className="cm-label mb-3">Builders' words</div>
                        <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl tracking-tighter">
                            Founders who shipped with conviction.
                        </h2>
                    </div>
                    <div className="mt-12 grid md:grid-cols-3 gap-4 cm-stagger">
                        {TESTIMONIALS.map((t) => (
                            <div
                                key={t.name}
                                className="cm-card rounded-2xl p-6"
                                data-testid={`testimonial-${t.name.replace(/\s+/g, "-").toLowerCase()}`}
                            >
                                <Quote className="w-6 h-6 text-amber-400" />
                                <p className="mt-4 text-sm text-zinc-200 leading-relaxed">
                                    "{t.quote}"
                                </p>
                                <div className="mt-5 flex items-center gap-3 pt-4 border-t border-white/5">
                                    <div className="w-9 h-9 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center font-display font-bold text-amber-300 text-xs">
                                        {t.initials}
                                    </div>
                                    <div>
                                        <div className="font-display font-semibold text-sm">
                                            {t.name}
                                        </div>
                                        <div className="text-xs text-zinc-500">{t.role}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section id="faq" className="py-20 border-t border-white/5">
                <div className="max-w-3xl mx-auto px-5 lg:px-8">
                    <div className="text-center">
                        <div className="cm-label mb-3">Questions</div>
                        <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl tracking-tighter">
                            Everything you might ask.
                        </h2>
                        <p className="mt-3 text-zinc-400">
                            If something's missing, just hit{" "}
                            <a
                                className="text-amber-400 hover:text-amber-300"
                                href="mailto:hello@crowdmind.ai"
                            >
                                hello@crowdmind.ai
                            </a>
                            .
                        </p>
                    </div>
                    <div
                        className="mt-10 space-y-3"
                        data-testid="faq-list"
                    >
                        {FAQS.map((f, i) => (
                            <FAQItem key={f.q} q={f.q} a={f.a} idx={i} />
                        ))}
                    </div>
                </div>
            </section>

            {/* MORE FEATURES — quick links */}
            <section className="py-20 border-t border-white/5">
                <div className="max-w-7xl mx-auto px-5 lg:px-8">
                    <div className="max-w-2xl">
                        <div className="cm-label mb-3">Beyond analysis</div>
                        <h2 className="font-display font-bold text-3xl sm:text-4xl tracking-tighter">
                            A platform, not a tool.
                        </h2>
                    </div>
                    <div className="mt-10 grid sm:grid-cols-3 gap-4 cm-stagger">
                        {[
                            {
                                to: "/founder",
                                icon: UserCircle2,
                                title: "Founder Twin AI",
                                body: "Score your profile, find industries built for you.",
                            },
                            {
                                to: "/battle",
                                icon: Swords,
                                title: "Idea Battle Mode",
                                body: "Two ideas enter. One wins. AI decides on 7 criteria.",
                            },
                            {
                                to: "/leaderboard",
                                icon: Trophy,
                                title: "Public Leaderboard",
                                body: "Publish your project. Rank globally on validation, PMF or innovation.",
                            },
                        ].map((c) => (
                            <Link
                                key={c.to}
                                to={c.to}
                                data-testid={`platform-${c.to.slice(1)}`}
                                className="cm-card rounded-2xl p-6 group block"
                            >
                                <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                                    <c.icon className="w-5 h-5 text-amber-400" />
                                </div>
                                <div className="mt-4 font-display font-bold text-lg">
                                    {c.title}
                                </div>
                                <div className="mt-2 text-sm text-zinc-400 leading-relaxed">
                                    {c.body}
                                </div>
                                <div className="mt-5 inline-flex items-center gap-1.5 text-xs text-amber-400 group-hover:text-amber-300 transition">
                                    Open <ArrowRight className="w-3 h-3" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* FINAL CTA */}
            <section className="py-20 border-t border-white/5">
                <div className="max-w-5xl mx-auto px-5 lg:px-8">
                    <div className="cm-glass rounded-3xl p-10 lg:p-14 text-center relative overflow-hidden">
                        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-amber-500/15 blur-3xl" />
                        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl" />
                        <div className="relative">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300 mb-6">
                                <Zap className="w-3 h-3 text-amber-400" />
                                Free during beta
                            </div>
                            <h2 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl tracking-tighter">
                                Stop guessing.
                                <br />
                                <span className="cm-text-gradient">Start validating.</span>
                            </h2>
                            <p className="mt-4 text-zinc-400 max-w-xl mx-auto">
                                Spin up your first project in under a minute.
                            </p>
                            <button
                                onClick={goCta}
                                data-testid="cta-bottom-btn"
                                className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold transition cm-amber-glow"
                            >
                                {user ? "Open dashboard" : "Validate my idea"}
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="border-t border-white/5">
                <div className="max-w-7xl mx-auto px-5 lg:px-8 py-10">
                    <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8">
                        <div>
                            <Link to="/" className="flex items-center gap-2.5 mb-4">
                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                                    <Sparkles className="w-3.5 h-3.5 text-zinc-950" strokeWidth={2.5} />
                                </div>
                                <div className="font-display font-extrabold">
                                    CrowdMind<span className="text-amber-400">.</span>AI
                                </div>
                            </Link>
                            <p className="text-xs text-zinc-500 leading-relaxed">
                                AI-powered startup validation & business intelligence.
                            </p>
                        </div>
                        <div>
                            <div className="cm-label mb-3">Product</div>
                            <ul className="space-y-2 text-sm text-zinc-400">
                                <li><a href="#features" className="hover:text-white">Features</a></li>
                                <li><a href="#process" className="hover:text-white">8-module pipeline</a></li>
                                <li><Link to="/founder" className="hover:text-white">Founder Twin</Link></li>
                                <li><Link to="/battle" className="hover:text-white">Idea Battle</Link></li>
                            </ul>
                        </div>
                        <div>
                            <div className="cm-label mb-3">Discover</div>
                            <ul className="space-y-2 text-sm text-zinc-400">
                                <li><Link to="/leaderboard" className="hover:text-white">Leaderboard</Link></li>
                                <li><a href="#faq" className="hover:text-white">FAQ</a></li>
                                <li><a href="#how" className="hover:text-white">How it works</a></li>
                            </ul>
                        </div>
                        <div>
                            <div className="cm-label mb-3">Account</div>
                            <ul className="space-y-2 text-sm text-zinc-400">
                                <li><Link to="/login" className="hover:text-white">Sign in</Link></li>
                                <li><Link to="/register" className="hover:text-white">Create account</Link></li>
                            </ul>
                        </div>
                    </div>
                    <div className="mt-10 pt-6 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-500">
                        <span>© {new Date().getFullYear()} CrowdMind AI</span>
                        <span className="font-mono">crafted for founders · v0.3</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
