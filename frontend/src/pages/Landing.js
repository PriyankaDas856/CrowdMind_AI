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
} from "lucide-react";
import { useAuth } from "../lib/auth-context";

const features = [
    {
        icon: Brain,
        title: "Sentiment-aware analysis",
        body: "Claude Sonnet 4.5 labels every response — positive, neutral or negative — and surfaces the why behind each rating.",
    },
    {
        icon: BarChart3,
        title: "0–100 validation score",
        body: "A single, defensible number you can put in a pitch deck. Breaks down into demand, intent, and theme strength.",
    },
    {
        icon: Compass,
        title: "Trend & pain-point mining",
        body: "Recurring needs, blockers and unmet demand pulled out of unstructured feedback automatically.",
    },
    {
        icon: Users,
        title: "Auto customer segments",
        body: "Persona clusters with size estimates so you know who to build for first.",
    },
    {
        icon: LineChart,
        title: "Investor readiness score",
        body: "How fundable is your idea today? Get the gaps to close before your next pitch.",
    },
    {
        icon: Rocket,
        title: "GTM, pricing & pitch outline",
        body: "Actionable go-to-market, pricing strategy and a complete pitch deck outline — generated.",
    },
];

const steps = [
    { n: "01", title: "Describe your idea", body: "Name, category, audience, location." },
    { n: "02", title: "Collect signals", body: "Share with potential customers — they rate, comment, signal intent." },
    { n: "03", title: "Run AI analysis", body: "Score, sentiment, trends, competitors, full report." },
    { n: "04", title: "Decide with conviction", body: "Pivot, polish, or build. No more guessing." },
];

export default function Landing() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const goCta = () => navigate(user ? "/dashboard" : "/register");

    return (
        <div className="cm-bg min-h-screen">
            {/* Top nav */}
            <header className="sticky top-0 z-50 border-b border-white/5 cm-glass-strong">
                <div className="max-w-7xl mx-auto px-5 lg:px-8 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2.5" data-testid="landing-logo">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center cm-amber-glow">
                            <Sparkles className="w-4 h-4 text-zinc-950" strokeWidth={2.5} />
                        </div>
                        <div className="font-display font-extrabold text-lg">
                            CrowdMind<span className="text-amber-400">.</span>AI
                        </div>
                    </Link>
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
                            Powered by Claude Sonnet 4.5
                        </div>
                        <h1 className="font-display font-black text-5xl sm:text-6xl lg:text-7xl tracking-tighter leading-[0.95]">
                            Validate your idea
                            <br />
                            <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-600 bg-clip-text text-transparent">
                                before you build it.
                            </span>
                        </h1>
                        <p className="mt-6 text-lg text-zinc-400 max-w-xl leading-relaxed">
                            CrowdMind AI turns raw customer feedback into a market validation
                            score, demand prediction, competitor map and a full business report —
                            in under a minute.
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
                                to="/login"
                                data-testid="hero-secondary-cta"
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-full cm-glass text-zinc-100 hover:bg-white/10 transition"
                            >
                                I have an account
                            </Link>
                        </div>
                        <div className="mt-10 flex items-center gap-6 text-xs text-zinc-500">
                            <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4 text-zinc-400" />
                                No credit card
                            </div>
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-amber-400" />
                                AI report in &lt;60s
                            </div>
                        </div>
                    </div>

                    {/* Hero card mock */}
                    <div className="lg:col-span-5 cm-fade-up" style={{ animationDelay: "0.15s" }}>
                        <div className="cm-glass rounded-3xl p-6 lg:p-7">
                            <div className="flex items-center justify-between">
                                <div className="cm-label">Validation score</div>
                                <span className="text-xs text-emerald-400 font-mono">live</span>
                            </div>
                            <div className="mt-2 flex items-end gap-3">
                                <div className="font-display text-7xl font-black tracking-tighter">
                                    82
                                </div>
                                <div className="pb-2 text-xs text-zinc-500 font-mono">/ 100</div>
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
                                        <div className="text-[10px] uppercase tracking-widest text-zinc-500">
                                            {s.l}
                                        </div>
                                        <div className={`font-display font-bold text-xl ${s.c}`}>
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

            {/* HOW IT WORKS */}
            <section className="py-20 border-t border-white/5">
                <div className="max-w-7xl mx-auto px-5 lg:px-8">
                    <div className="max-w-2xl">
                        <div className="cm-label mb-3">How it works</div>
                        <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl tracking-tighter">
                            From raw feedback to{" "}
                            <span className="text-amber-400">conviction</span> — fast.
                        </h2>
                    </div>
                    <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 cm-stagger">
                        {steps.map((s) => (
                            <div
                                key={s.n}
                                className="cm-card rounded-2xl p-6"
                                data-testid={`step-${s.n}`}
                            >
                                <div className="font-mono text-amber-400 text-sm">{s.n}</div>
                                <div className="mt-3 font-display font-bold text-xl">
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

            {/* FEATURES */}
            <section className="py-20 border-t border-white/5">
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
                        {features.map((f) => (
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

            {/* TESTIMONIAL */}
            <section className="py-20 border-t border-white/5">
                <div className="max-w-4xl mx-auto px-5 lg:px-8 text-center cm-fade-up">
                    <Quote className="w-8 h-8 text-amber-400 mx-auto" />
                    <p className="mt-6 font-display text-2xl sm:text-3xl tracking-tight leading-tight">
                        “We killed two ideas and doubled down on a third in a single
                        afternoon. CrowdMind told us what 40 hours of user calls would have.”
                    </p>
                    <div className="mt-6 text-sm text-zinc-500">
                        Maya Okafor — Founder, Threadwise
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 border-t border-white/5">
                <div className="max-w-5xl mx-auto px-5 lg:px-8">
                    <div className="cm-glass rounded-3xl p-10 lg:p-14 text-center">
                        <h2 className="font-display font-black text-4xl sm:text-5xl tracking-tighter">
                            Stop guessing.
                            <br />
                            <span className="text-amber-400">Start validating.</span>
                        </h2>
                        <p className="mt-4 text-zinc-400 max-w-xl mx-auto">
                            Spin up your first project in under a minute. Free while in beta.
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
            </section>

            <footer className="border-t border-white/5">
                <div className="max-w-7xl mx-auto px-5 lg:px-8 py-8 text-xs text-zinc-500 flex flex-wrap items-center justify-between gap-3">
                    <span>© {new Date().getFullYear()} CrowdMind AI</span>
                    <span className="font-mono">crafted for founders · v0.1</span>
                </div>
            </footer>
        </div>
    );
}
