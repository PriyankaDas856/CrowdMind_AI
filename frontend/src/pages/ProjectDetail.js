import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Brain,
    Copy,
    Loader2,
    Share2,
    Sparkles,
    Trash2,
    Users,
    TrendingUp,
    AlertTriangle,
    Lightbulb,
    Compass,
    DollarSign,
    Rocket,
    MessageSquare,
} from "lucide-react";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
} from "recharts";
import { api } from "../lib/api";
import AppLayout from "../components/AppLayout";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

const SENTIMENT_COLORS = {
    positive: "#10B981",
    neutral: "#9CA3AF",
    negative: "#F43F5E",
};
const DEMAND_COLORS = {
    Low: "text-rose-300 bg-rose-500/10 border-rose-500/20",
    Medium: "text-amber-300 bg-amber-500/10 border-amber-500/20",
    High: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
};

function ScoreGauge({ score, label, sub }) {
    const pct = Math.min(100, Math.max(0, score || 0));
    return (
        <div className="cm-card rounded-2xl p-6" data-testid={`gauge-${label.toLowerCase().replace(/\s+/g, "-")}`}>
            <div className="cm-label">{label}</div>
            <div className="mt-2 flex items-end gap-2">
                <div className="font-display font-black text-6xl tracking-tighter text-amber-300">
                    {pct}
                </div>
                <div className="pb-2 text-xs text-zinc-500 font-mono">/ 100</div>
            </div>
            <div className="mt-4 h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all"
                    style={{ width: `${pct}%` }}
                />
            </div>
            {sub && <div className="mt-3 text-xs text-zinc-500">{sub}</div>}
        </div>
    );
}

function Pill({ children, className = "" }) {
    return (
        <span
            className={`inline-block text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/8 ${className}`}
        >
            {children}
        </span>
    );
}

function SectionTitle({ icon: Icon, children }) {
    return (
        <div className="flex items-center gap-2.5 mb-3">
            <div className="w-7 h-7 rounded-md bg-amber-500/10 border border-amber-500/15 flex items-center justify-center">
                <Icon className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <h3 className="font-display font-bold text-lg tracking-tight">{children}</h3>
        </div>
    );
}

export default function ProjectDetail() {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);

    const load = async () => {
        try {
            const { data } = await api.get(`/projects/${projectId}`);
            setData(data);
        } catch {
            toast.error("Project not found");
            navigate("/dashboard");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId]);

    const project = data?.project;
    const feedback = data?.feedback || [];
    const insight = data?.insight;

    const publicLink = useMemo(() => {
        if (!project) return "";
        return `${window.location.origin}/feedback/${project.public_link_id}`;
    }, [project]);

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(publicLink);
            toast.success("Public feedback link copied");
        } catch {
            toast.error("Could not copy");
        }
    };

    const runAnalysis = async () => {
        if (feedback.length < 1) {
            toast.error("Collect at least 1 response first");
            return;
        }
        setAnalyzing(true);
        try {
            await api.post(`/projects/${projectId}/analyze`);
            toast.success("AI analysis complete");
            await load();
        } catch (err) {
            toast.error(err.response?.data?.detail || "Analysis failed");
        } finally {
            setAnalyzing(false);
        }
    };

    const deleteProject = async () => {
        if (!window.confirm("Delete this project and all its feedback?")) return;
        try {
            await api.delete(`/projects/${projectId}`);
            toast.success("Project deleted");
            navigate("/dashboard");
        } catch {
            toast.error("Delete failed");
        }
    };

    if (loading) {
        return (
            <AppLayout>
                <div className="py-20 flex items-center justify-center text-zinc-500">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading project…
                </div>
            </AppLayout>
        );
    }

    const sentimentData = insight
        ? Object.entries(insight.sentiment_breakdown).map(([k, v]) => ({
              name: k,
              value: v,
          }))
        : [];
    const intentData = insight
        ? Object.entries(insight.purchase_intent_breakdown).map(([k, v]) => ({
              name: k,
              value: v,
          }))
        : [];

    return (
        <AppLayout>
            <button
                onClick={() => navigate("/dashboard")}
                data-testid="back-to-dashboard-btn"
                className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white mb-6"
            >
                <ArrowLeft className="w-4 h-4" /> Dashboard
            </button>

            {/* Header */}
            <div className="cm-fade-up">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                        <div className="cm-label">{project.category}</div>
                        <h1
                            className="mt-1 font-display font-black text-4xl sm:text-5xl tracking-tighter"
                            data-testid="project-title"
                        >
                            {project.name}
                        </h1>
                        <p className="mt-3 text-zinc-400 max-w-3xl">{project.description}</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                            <Pill>👥 {project.target_audience}</Pill>
                            <Pill>📍 {project.location}</Pill>
                            <Pill>{feedback.length} responses</Pill>
                            {insight && (
                                <Pill className="text-emerald-300 border-emerald-500/20 bg-emerald-500/5">
                                    Analyzed
                                </Pill>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={copyLink}
                            data-testid="copy-link-btn"
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full cm-glass border border-white/10 hover:bg-white/8 text-sm transition"
                        >
                            <Share2 className="w-4 h-4" /> Copy public link
                        </button>
                        <button
                            onClick={runAnalysis}
                            disabled={analyzing || feedback.length < 1}
                            data-testid="run-analysis-btn"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-semibold text-sm transition cm-amber-glow"
                        >
                            {analyzing ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Sparkles className="w-4 h-4" />
                            )}
                            {analyzing ? "Analyzing…" : insight ? "Re-run analysis" : "Run AI analysis"}
                        </button>
                        <button
                            onClick={deleteProject}
                            data-testid="delete-project-btn"
                            className="inline-flex items-center justify-center w-10 h-10 rounded-full cm-glass border border-white/10 hover:bg-rose-500/10 hover:border-rose-500/30 text-rose-300 transition"
                            title="Delete project"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Public link box */}
                <div className="mt-5 cm-glass rounded-2xl p-4 flex items-center gap-3">
                    <div className="cm-label whitespace-nowrap">Public link</div>
                    <code
                        className="flex-1 font-mono text-xs text-zinc-300 truncate"
                        data-testid="public-link-value"
                    >
                        {publicLink}
                    </code>
                    <button
                        onClick={copyLink}
                        className="text-zinc-400 hover:text-amber-400 transition"
                        data-testid="copy-link-icon"
                    >
                        <Copy className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Empty insights state */}
            {!insight ? (
                <div
                    className="mt-10 cm-glass rounded-3xl p-10 text-center"
                    data-testid="no-insights-state"
                >
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto">
                        <Brain className="w-6 h-6 text-amber-400" />
                    </div>
                    <h3 className="mt-5 font-display font-bold text-2xl tracking-tight">
                        No analysis yet
                    </h3>
                    <p className="mt-2 text-zinc-400 max-w-md mx-auto">
                        {feedback.length === 0
                            ? "Share your public link and collect your first responses."
                            : `You have ${feedback.length} response(s). Run analysis whenever you're ready.`}
                    </p>
                    {feedback.length > 0 && (
                        <button
                            onClick={runAnalysis}
                            disabled={analyzing}
                            data-testid="empty-run-analysis-btn"
                            className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold transition cm-amber-glow"
                        >
                            {analyzing ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Sparkles className="w-4 h-4" />
                            )}
                            Run AI analysis
                        </button>
                    )}
                </div>
            ) : (
                <Tabs defaultValue="overview" className="mt-10">
                    <TabsList className="cm-glass border border-white/10 rounded-full p-1 inline-flex">
                        {[
                            { v: "overview", l: "Overview" },
                            { v: "report", l: "AI Report" },
                            { v: "trends", l: "Trends" },
                            { v: "competitors", l: "Competitors" },
                            { v: "feedback", l: "Feedback" },
                        ].map((t) => (
                            <TabsTrigger
                                key={t.v}
                                value={t.v}
                                data-testid={`tab-${t.v}`}
                                className="px-4 py-2 rounded-full data-[state=active]:bg-amber-500 data-[state=active]:text-zinc-950 text-sm font-medium"
                            >
                                {t.l}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {/* OVERVIEW */}
                    <TabsContent value="overview" className="mt-6 cm-stagger">
                        <div className="grid lg:grid-cols-3 gap-4">
                            <ScoreGauge
                                score={insight.validation_score}
                                label="Validation score"
                                sub={`${insight.total_responses} responses analyzed`}
                            />
                            <div
                                className="cm-card rounded-2xl p-6"
                                data-testid="demand-card"
                            >
                                <div className="cm-label">Demand prediction</div>
                                <div className="mt-4">
                                    <span
                                        className={`inline-flex items-center text-base font-display font-bold px-4 py-2 rounded-full border ${
                                            DEMAND_COLORS[insight.demand_prediction] ||
                                            "text-zinc-300 border-white/10"
                                        }`}
                                    >
                                        {insight.demand_prediction} demand
                                    </span>
                                </div>
                                <div className="mt-6 cm-label">Investor readiness</div>
                                <div className="mt-2 font-display font-black text-4xl tracking-tighter text-amber-300">
                                    {insight.investor_readiness_score}
                                    <span className="text-xs font-mono text-zinc-500 ml-1">
                                        / 100
                                    </span>
                                </div>
                            </div>
                            <div
                                className="cm-card rounded-2xl p-6"
                                data-testid="sentiment-card"
                            >
                                <div className="cm-label">Sentiment</div>
                                <div className="h-44 mt-2">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={sentimentData}
                                                innerRadius={42}
                                                outerRadius={70}
                                                paddingAngle={2}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {sentimentData.map((s) => (
                                                    <Cell
                                                        key={s.name}
                                                        fill={SENTIMENT_COLORS[s.name] || "#9CA3AF"}
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    background: "#0b0f19",
                                                    border: "1px solid rgba(255,255,255,0.1)",
                                                    borderRadius: 10,
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="grid grid-cols-3 gap-2 mt-2">
                                    {sentimentData.map((s) => (
                                        <div
                                            key={s.name}
                                            className="text-center"
                                        >
                                            <div
                                                className="text-xs font-mono"
                                                style={{ color: SENTIMENT_COLORS[s.name] }}
                                            >
                                                {s.value}
                                            </div>
                                            <div className="cm-label text-[9px]">{s.name}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 grid lg:grid-cols-2 gap-4">
                            <div className="cm-card rounded-2xl p-6" data-testid="intent-card">
                                <SectionTitle icon={Users}>Purchase intent</SectionTitle>
                                <div className="h-48">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={intentData}>
                                            <XAxis
                                                dataKey="name"
                                                tick={{ fill: "#9CA3AF", fontSize: 11 }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <YAxis hide />
                                            <Tooltip
                                                cursor={{ fill: "rgba(255,255,255,0.04)" }}
                                                contentStyle={{
                                                    background: "#0b0f19",
                                                    border: "1px solid rgba(255,255,255,0.1)",
                                                    borderRadius: 10,
                                                }}
                                            />
                                            <Bar dataKey="value" fill="#F59E0B" radius={[6, 6, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <div className="cm-card rounded-2xl p-6" data-testid="segments-card">
                                <SectionTitle icon={Compass}>Customer segments</SectionTitle>
                                <div className="space-y-3">
                                    {insight.customer_segments.map((s, i) => (
                                        <div key={i}>
                                            <div className="flex justify-between text-sm">
                                                <span className="font-semibold">{s.name}</span>
                                                <span className="text-amber-300 font-mono">
                                                    {s.percent}%
                                                </span>
                                            </div>
                                            <div className="mt-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                                                <div
                                                    className="h-full bg-amber-500"
                                                    style={{ width: `${s.percent}%` }}
                                                />
                                            </div>
                                            <div className="mt-1 text-xs text-zinc-500">
                                                {s.description}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* REPORT */}
                    <TabsContent value="report" className="mt-6 space-y-4 cm-stagger">
                        <div className="cm-glass rounded-2xl p-6" data-testid="exec-summary">
                            <SectionTitle icon={Sparkles}>Executive summary</SectionTitle>
                            <p className="text-zinc-300 leading-relaxed">
                                {insight.report.executive_summary}
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="cm-card rounded-2xl p-6" data-testid="risks-card">
                                <SectionTitle icon={AlertTriangle}>Market risks</SectionTitle>
                                <ul className="space-y-2 text-sm text-zinc-300">
                                    {insight.report.market_risks.map((r, i) => (
                                        <li key={i} className="flex gap-2">
                                            <span className="text-rose-400">▪</span>
                                            {r}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="cm-card rounded-2xl p-6" data-testid="opps-card">
                                <SectionTitle icon={TrendingUp}>Opportunities</SectionTitle>
                                <ul className="space-y-2 text-sm text-zinc-300">
                                    {insight.report.opportunities.map((r, i) => (
                                        <li key={i} className="flex gap-2">
                                            <span className="text-emerald-400">▪</span>
                                            {r}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="cm-card rounded-2xl p-6" data-testid="pain-card">
                                <SectionTitle icon={MessageSquare}>Pain points</SectionTitle>
                                <ul className="space-y-2 text-sm text-zinc-300">
                                    {insight.pain_points.map((r, i) => (
                                        <li key={i} className="flex gap-2">
                                            <span className="text-amber-400">▪</span>
                                            {r}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="cm-card rounded-2xl p-6" data-testid="improvements-card">
                                <SectionTitle icon={Lightbulb}>Improvements</SectionTitle>
                                <ul className="space-y-2 text-sm text-zinc-300">
                                    {insight.report.improvements.map((r, i) => (
                                        <li key={i} className="flex gap-2">
                                            <span className="text-amber-400">▪</span>
                                            {r}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="cm-card rounded-2xl p-6" data-testid="gtm-card">
                                <SectionTitle icon={Rocket}>Go-to-market</SectionTitle>
                                <p className="text-sm text-zinc-300 leading-relaxed">
                                    {insight.report.gtm_strategy}
                                </p>
                            </div>
                            <div className="cm-card rounded-2xl p-6" data-testid="pricing-card">
                                <SectionTitle icon={DollarSign}>Pricing strategy</SectionTitle>
                                <p className="text-sm text-zinc-300 leading-relaxed">
                                    {insight.report.pricing_strategy}
                                </p>
                            </div>
                        </div>

                        <div className="cm-glass rounded-2xl p-6" data-testid="pitch-card">
                            <SectionTitle icon={Sparkles}>Pitch deck outline</SectionTitle>
                            <ol className="grid sm:grid-cols-2 gap-2 text-sm text-zinc-300">
                                {insight.report.pitch_deck.map((s, i) => (
                                    <li
                                        key={i}
                                        className="flex gap-3 p-3 rounded-lg border border-white/5 bg-white/2"
                                    >
                                        <span className="font-mono text-amber-400 text-xs">
                                            {String(i + 1).padStart(2, "0")}
                                        </span>
                                        <span>{s}</span>
                                    </li>
                                ))}
                            </ol>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="cm-card rounded-2xl p-6" data-testid="business-models">
                                <SectionTitle icon={Compass}>Business models</SectionTitle>
                                <div className="flex flex-wrap gap-2">
                                    {insight.business_models.map((b, i) => (
                                        <Pill key={i}>{b}</Pill>
                                    ))}
                                </div>
                            </div>
                            <div className="cm-card rounded-2xl p-6" data-testid="revenue-models">
                                <SectionTitle icon={DollarSign}>Revenue models</SectionTitle>
                                <div className="flex flex-wrap gap-2">
                                    {insight.revenue_models.map((b, i) => (
                                        <Pill key={i}>{b}</Pill>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* TRENDS */}
                    <TabsContent value="trends" className="mt-6 cm-stagger">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="cm-card rounded-2xl p-6" data-testid="trends-card">
                                <SectionTitle icon={TrendingUp}>Recurring trends</SectionTitle>
                                <div className="space-y-2">
                                    {insight.trends.map((t, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/2"
                                        >
                                            <span className="text-sm text-zinc-300">{t}</span>
                                            <span className="text-xs font-mono text-amber-300">
                                                #{i + 1}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="cm-card rounded-2xl p-6" data-testid="pain-trends-card">
                                <SectionTitle icon={AlertTriangle}>Pain points</SectionTitle>
                                <div className="space-y-2">
                                    {insight.pain_points.map((t, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/2"
                                        >
                                            <span className="text-sm text-zinc-300">{t}</span>
                                            <span className="text-xs font-mono text-rose-300">
                                                #{i + 1}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* COMPETITORS */}
                    <TabsContent value="competitors" className="mt-6 cm-stagger">
                        <div className="grid md:grid-cols-2 gap-4">
                            {insight.competitors.map((c, i) => (
                                <div
                                    key={i}
                                    className="cm-card rounded-2xl p-6"
                                    data-testid={`competitor-${i}`}
                                >
                                    <div className="font-display font-bold text-xl tracking-tight">
                                        {c.name}
                                    </div>
                                    <div className="mt-3">
                                        <div className="cm-label text-emerald-300">Strengths</div>
                                        <div className="mt-1 text-sm text-zinc-300">{c.strengths}</div>
                                    </div>
                                    <div className="mt-3">
                                        <div className="cm-label text-rose-300">Weaknesses</div>
                                        <div className="mt-1 text-sm text-zinc-300">
                                            {c.weaknesses}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </TabsContent>

                    {/* FEEDBACK */}
                    <TabsContent value="feedback" className="mt-6 cm-stagger">
                        {feedback.length === 0 ? (
                            <div className="cm-glass rounded-2xl p-8 text-center text-zinc-400">
                                No feedback yet.
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-4">
                                {feedback.map((f) => (
                                    <div
                                        key={f.feedback_id}
                                        className="cm-card rounded-2xl p-5"
                                        data-testid={`feedback-${f.feedback_id}`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="font-semibold text-sm">{f.user_name}</div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-amber-400 text-sm">
                                                    {"★".repeat(f.rating)}
                                                    <span className="text-zinc-700">
                                                        {"★".repeat(5 - f.rating)}
                                                    </span>
                                                </span>
                                            </div>
                                        </div>
                                        <div className="mt-3 text-sm text-zinc-300 leading-relaxed">
                                            {f.feedback_text}
                                        </div>
                                        {f.suggestion && (
                                            <div className="mt-3 text-xs text-zinc-400 border-t border-white/5 pt-3">
                                                <span className="cm-label">Suggestion · </span>
                                                {f.suggestion}
                                            </div>
                                        )}
                                        <div className="mt-3 flex items-center gap-2 text-[10px]">
                                            <Pill>intent: {f.purchase_intent}</Pill>
                                            {f.sentiment_label && (
                                                <Pill
                                                    className="capitalize"
                                                    style={{ color: SENTIMENT_COLORS[f.sentiment_label] }}
                                                >
                                                    {f.sentiment_label}
                                                </Pill>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            )}
        </AppLayout>
    );
}
