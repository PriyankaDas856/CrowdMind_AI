import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Brain,
    Check,
    Copy,
    Download,
    FileText,
    Globe,
    Loader2,
    Lock,
    Share2,
    Shield,
    Sparkles,
    Target,
    Trash2,
    Users,
    TrendingUp,
    AlertTriangle,
    Lightbulb,
    Compass,
    DollarSign,
    Rocket,
    MessageSquare,
    X,
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
import { api, API_BASE, getToken } from "../lib/api";
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
    const isPublic = !!project?.is_public;

    // ---- Async analysis job state ----
    const [job, setJob] = useState(null); // {job_id, status, progress, current_module, completed_modules, failed_modules}
    const pollRef = useRef(null);

    const stopPolling = () => {
        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
    };

    useEffect(() => () => stopPolling(), []);

    const pollJob = async (jobId) => {
        try {
            const { data: result } = await api.get(`/analyze/result/${jobId}`);
            setJob(result);
            if (
                result.status === "done" ||
                result.status === "partial" ||
                result.status === "failed"
            ) {
                stopPolling();
                if (result.status === "failed") {
                    toast.error("AI analysis failed. Please retry.");
                } else if (result.status === "partial") {
                    toast.warning(
                        `Analysis finished with ${result.failed_modules.length} module(s) skipped.`
                    );
                } else {
                    toast.success("AI analysis complete");
                }
                await load();
                setTimeout(() => setJob(null), 1500);
            }
        } catch {
            // transient errors — keep polling
        }
    };

    const togglePublish = async () => {
        try {
            await api.post(`/projects/${projectId}/publish`, {
                is_public: !isPublic,
            });
            toast.success(isPublic ? "Removed from leaderboard" : "Now on the leaderboard");
            await load();
        } catch (err) {
            toast.error(err.response?.data?.detail || "Could not toggle publish");
        }
    };

    const downloadPdf = async () => {
        try {
            const token = getToken();
            const res = await fetch(
                `${API_BASE}/projects/${projectId}/report.pdf`,
                {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                    credentials: "include",
                }
            );
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.detail || "PDF export failed");
            }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `CrowdMind_${project.name.replace(/\W+/g, "_")}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            toast.success("Report downloaded");
        } catch (err) {
            toast.error(err.message || "PDF export failed");
        }
    };

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
                        {insight && (
                            <>
                                <button
                                    onClick={downloadPdf}
                                    data-testid="download-pdf-btn"
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full cm-glass border border-white/10 hover:bg-white/8 text-sm transition"
                                >
                                    <Download className="w-4 h-4" /> PDF
                                </button>
                                <button
                                    onClick={togglePublish}
                                    data-testid="publish-toggle-btn"
                                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm transition ${
                                        isPublic
                                            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                                            : "cm-glass border-white/10 hover:bg-white/8"
                                    }`}
                                >
                                    {isPublic ? (
                                        <Globe className="w-4 h-4" />
                                    ) : (
                                        <Lock className="w-4 h-4" />
                                    )}
                                    {isPublic ? "Published" : "Publish"}
                                </button>
                            </>
                        )}
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
                    <div className="overflow-x-auto -mx-1 px-1">
                        <TabsList className="cm-glass border border-white/10 rounded-full p-1 inline-flex w-max">
                            {[
                                { v: "overview", l: "Overview" },
                                { v: "pmf", l: "PMF Engine" },
                                { v: "personas", l: "Personas" },
                                { v: "competitors", l: "Competitors" },
                                { v: "swot", l: "SWOT" },
                                { v: "bmc", l: "Business Model" },
                                { v: "investor", l: "Investor" },
                                { v: "predictor", l: "Predictor" },
                                { v: "report", l: "Report" },
                                { v: "feedback", l: "Feedback" },
                            ].map((t) => (
                                <TabsTrigger
                                    key={t.v}
                                    value={t.v}
                                    data-testid={`tab-${t.v}`}
                                    className="px-4 py-2 rounded-full data-[state=active]:bg-amber-500 data-[state=active]:text-zinc-950 text-sm font-medium whitespace-nowrap"
                                >
                                    {t.l}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>

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
                            {insight.pitch_deck_slides && insight.pitch_deck_slides.length > 0 ? (
                                <div className="grid sm:grid-cols-2 gap-3">
                                    {insight.pitch_deck_slides.map((sl, i) => (
                                        <div
                                            key={i}
                                            className="rounded-xl border border-white/8 bg-white/3 p-4"
                                            data-testid={`pitch-slide-${i}`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-amber-400 text-xs">
                                                    {String(i + 1).padStart(2, "0")}
                                                </span>
                                                <span className="font-display font-bold text-sm">
                                                    {sl.title}
                                                </span>
                                            </div>
                                            <ul className="mt-2 space-y-1 text-xs text-zinc-300">
                                                {(sl.bullets || []).map((b, k) => (
                                                    <li key={k} className="flex gap-1.5">
                                                        <span className="text-amber-400">·</span>
                                                        {b}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            ) : (
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
                            )}
                            <button
                                onClick={downloadPdf}
                                data-testid="pitch-download-btn"
                                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-sm transition cm-amber-glow"
                            >
                                <FileText className="w-4 h-4" /> Download full report PDF
                            </button>
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

                    {/* PMF ENGINE */}
                    <TabsContent value="pmf" className="mt-6 cm-stagger">
                        {!insight.pmf?.pmf_score ? (
                            <div className="cm-glass rounded-2xl p-8 text-center text-zinc-400">
                                Re-run analysis to populate the PMF Engine.
                            </div>
                        ) : (
                            <>
                                <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
                                    {[
                                        { l: "PMF", v: insight.pmf.pmf_score, hl: true },
                                        { l: "Demand", v: insight.pmf.demand_score },
                                        { l: "Readiness", v: insight.pmf.market_readiness_score },
                                        { l: "Differentiation", v: insight.pmf.differentiation_score },
                                        { l: "Scalability", v: insight.pmf.scalability_score },
                                    ].map((s) => (
                                        <div
                                            key={s.l}
                                            className={`cm-card rounded-2xl p-5 ${
                                                s.hl ? "ring-1 ring-amber-500/30" : ""
                                            }`}
                                            data-testid={`pmf-${s.l.toLowerCase()}`}
                                        >
                                            <div className="cm-label">{s.l}</div>
                                            <div className="mt-2 font-display font-black text-4xl tracking-tighter text-amber-300">
                                                {s.v}
                                                <span className="text-xs font-mono text-zinc-500 ml-1">
                                                    /100
                                                </span>
                                            </div>
                                            <div className="mt-3 h-1.5 rounded-full bg-white/5 overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-amber-500 to-amber-300"
                                                    style={{ width: `${s.v}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 grid md:grid-cols-2 gap-4">
                                    <div
                                        className="cm-card rounded-2xl p-6"
                                        data-testid="pmf-love"
                                    >
                                        <SectionTitle icon={Sparkles}>
                                            What users love
                                        </SectionTitle>
                                        <ul className="space-y-2 text-sm text-zinc-300">
                                            {(insight.pmf.what_users_love || []).map((x, i) => (
                                                <li key={i} className="flex gap-2">
                                                    <span className="text-emerald-400">▪</span>
                                                    {x}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div
                                        className="cm-card rounded-2xl p-6"
                                        data-testid="pmf-dislike"
                                    >
                                        <SectionTitle icon={AlertTriangle}>
                                            What users dislike
                                        </SectionTitle>
                                        <ul className="space-y-2 text-sm text-zinc-300">
                                            {(insight.pmf.what_users_dislike || []).map((x, i) => (
                                                <li key={i} className="flex gap-2">
                                                    <span className="text-rose-400">▪</span>
                                                    {x}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div
                                        className="cm-card rounded-2xl p-6"
                                        data-testid="pmf-missing"
                                    >
                                        <SectionTitle icon={Lightbulb}>
                                            Missing features
                                        </SectionTitle>
                                        <ul className="space-y-2 text-sm text-zinc-300">
                                            {(insight.pmf.missing_features || []).map((x, i) => (
                                                <li key={i} className="flex gap-2">
                                                    <span className="text-amber-400">▪</span>
                                                    {x}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div
                                        className="cm-card rounded-2xl p-6"
                                        data-testid="pmf-evolve"
                                    >
                                        <SectionTitle icon={Rocket}>
                                            How the idea should evolve
                                        </SectionTitle>
                                        <ul className="space-y-2 text-sm text-zinc-300">
                                            {(insight.pmf.evolution_advice || []).map((x, i) => (
                                                <li key={i} className="flex gap-2">
                                                    <span className="text-amber-400">▪</span>
                                                    {x}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </>
                        )}
                    </TabsContent>

                    {/* PERSONAS */}
                    <TabsContent value="personas" className="mt-6 cm-stagger">
                        {(insight.personas || []).length === 0 ? (
                            <div className="cm-glass rounded-2xl p-8 text-center text-zinc-400">
                                Re-run analysis to generate personas.
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {insight.personas.map((p, i) => (
                                    <div
                                        key={i}
                                        className="cm-card rounded-3xl p-6"
                                        data-testid={`persona-${i}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center font-display font-black text-amber-300">
                                                {(p.name || "?").charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-display font-bold text-lg">
                                                    {p.name}
                                                </div>
                                                <div className="text-xs text-zinc-500 font-mono">
                                                    {p.age_range} · {p.occupation}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                                            <div>
                                                <div className="cm-label">Income</div>
                                                <div className="text-zinc-300 mt-0.5">
                                                    {p.income_level}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="cm-label">Channels</div>
                                                <div className="text-zinc-300 mt-0.5 truncate">
                                                    {(p.preferred_channels || []).join(", ")}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-4">
                                            <div className="cm-label">Goals</div>
                                            <ul className="mt-1 space-y-1 text-sm text-zinc-300">
                                                {(p.goals || []).map((g, k) => (
                                                    <li key={k} className="flex gap-2">
                                                        <span className="text-emerald-400">▪</span>
                                                        {g}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="mt-3">
                                            <div className="cm-label">Pain points</div>
                                            <ul className="mt-1 space-y-1 text-sm text-zinc-300">
                                                {(p.pain_points || []).map((g, k) => (
                                                    <li key={k} className="flex gap-2">
                                                        <span className="text-rose-400">▪</span>
                                                        {g}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="mt-3 text-xs text-zinc-400 border-t border-white/5 pt-3">
                                            <div className="cm-label">Motivation</div>
                                            <div className="text-zinc-300 mt-0.5">
                                                {p.buying_motivation}
                                            </div>
                                        </div>
                                        <div className="mt-2 text-xs text-zinc-400">
                                            <div className="cm-label">Tech usage</div>
                                            <div className="text-zinc-300 mt-0.5">
                                                {p.technology_usage}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* SWOT */}
                    <TabsContent value="swot" className="mt-6 cm-stagger">
                        {!insight.swot?.strengths ? (
                            <div className="cm-glass rounded-2xl p-8 text-center text-zinc-400">
                                Re-run analysis to generate SWOT.
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-4">
                                {[
                                    {
                                        k: "strengths",
                                        l: "Strengths",
                                        c: "text-emerald-300",
                                        bg: "from-emerald-500/10",
                                        icon: Shield,
                                    },
                                    {
                                        k: "weaknesses",
                                        l: "Weaknesses",
                                        c: "text-rose-300",
                                        bg: "from-rose-500/10",
                                        icon: AlertTriangle,
                                    },
                                    {
                                        k: "opportunities",
                                        l: "Opportunities",
                                        c: "text-blue-300",
                                        bg: "from-blue-500/10",
                                        icon: TrendingUp,
                                    },
                                    {
                                        k: "threats",
                                        l: "Threats",
                                        c: "text-amber-300",
                                        bg: "from-amber-500/10",
                                        icon: Target,
                                    },
                                ].map(({ k, l, c, bg, icon: Icon }) => (
                                    <div
                                        key={k}
                                        className={`cm-card rounded-3xl p-6 bg-gradient-to-br ${bg} via-transparent to-transparent`}
                                        data-testid={`swot-${k}`}
                                    >
                                        <div className="flex items-center gap-2.5 mb-3">
                                            <div
                                                className={`w-7 h-7 rounded-md bg-white/5 border border-white/10 flex items-center justify-center`}
                                            >
                                                <Icon className={`w-3.5 h-3.5 ${c}`} />
                                            </div>
                                            <h3
                                                className={`font-display font-bold text-lg tracking-tight ${c}`}
                                            >
                                                {l}
                                            </h3>
                                        </div>
                                        <ul className="space-y-2 text-sm text-zinc-300">
                                            {(insight.swot[k] || []).map((x, i) => (
                                                <li key={i} className="flex gap-2">
                                                    <span className={c}>▪</span>
                                                    {x}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* BMC */}
                    <TabsContent value="bmc" className="mt-6 cm-fade-up">
                        {!insight.bmc?.value_proposition ? (
                            <div className="cm-glass rounded-2xl p-8 text-center text-zinc-400">
                                Re-run analysis to generate the Business Model Canvas.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3" data-testid="bmc-canvas">
                                {[
                                    { k: "key_partners", l: "Key Partners", span: "md:row-span-2" },
                                    { k: "key_activities", l: "Key Activities", span: "" },
                                    {
                                        k: "value_proposition",
                                        l: "Value Proposition",
                                        span: "md:row-span-2 lg:col-span-1",
                                        hl: true,
                                    },
                                    { k: "customer_relationships", l: "Customer Relationships", span: "" },
                                    { k: "customer_segments", l: "Customer Segments", span: "md:row-span-2" },
                                    { k: "key_resources", l: "Key Resources", span: "" },
                                    { k: "channels", l: "Channels", span: "" },
                                ].map(({ k, l, span, hl }) => (
                                    <div
                                        key={k}
                                        className={`cm-card rounded-2xl p-4 ${span} ${
                                            hl ? "ring-1 ring-amber-500/30 bg-amber-500/5" : ""
                                        }`}
                                        data-testid={`bmc-${k}`}
                                    >
                                        <div className="cm-label">{l}</div>
                                        <ul className="mt-2 space-y-1 text-sm text-zinc-300">
                                            {(insight.bmc[k] || []).map((x, i) => (
                                                <li key={i} className="flex gap-2">
                                                    <span className="text-amber-400">▪</span>
                                                    {x}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                                <div
                                    className="cm-card rounded-2xl p-4 md:col-span-2 lg:col-span-3"
                                    data-testid="bmc-cost"
                                >
                                    <div className="cm-label">Cost Structure</div>
                                    <ul className="mt-2 grid sm:grid-cols-2 gap-x-4 gap-y-1 text-sm text-zinc-300">
                                        {(insight.bmc.cost_structure || []).map((x, i) => (
                                            <li key={i} className="flex gap-2">
                                                <span className="text-rose-400">▪</span>
                                                {x}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div
                                    className="cm-card rounded-2xl p-4 md:col-span-1 lg:col-span-2"
                                    data-testid="bmc-revenue"
                                >
                                    <div className="cm-label">Revenue Streams</div>
                                    <ul className="mt-2 space-y-1 text-sm text-zinc-300">
                                        {(insight.bmc.revenue_streams || []).map((x, i) => (
                                            <li key={i} className="flex gap-2">
                                                <span className="text-emerald-400">▪</span>
                                                {x}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    {/* INVESTOR */}
                    <TabsContent value="investor" className="mt-6 cm-stagger">
                        {!insight.investor?.investor_readiness_score ? (
                            <div className="cm-glass rounded-2xl p-8 text-center text-zinc-400">
                                Re-run analysis to generate the investor dashboard.
                            </div>
                        ) : (
                            <>
                                <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
                                    {[
                                        { l: "Readiness", v: insight.investor.investor_readiness_score, hl: true },
                                        { l: "Funding", v: insight.investor.funding_potential_score },
                                        { l: "Opportunity", v: insight.investor.market_opportunity_score },
                                        { l: "Growth", v: insight.investor.growth_potential_score },
                                        { l: "Risk", v: insight.investor.risk_score, inverse: true },
                                    ].map((s) => (
                                        <div
                                            key={s.l}
                                            className={`cm-card rounded-2xl p-5 ${
                                                s.hl ? "ring-1 ring-amber-500/30" : ""
                                            }`}
                                            data-testid={`investor-${s.l.toLowerCase()}`}
                                        >
                                            <div className="cm-label">{s.l}</div>
                                            <div
                                                className={`mt-2 font-display font-black text-4xl tracking-tighter ${
                                                    s.inverse ? "text-rose-300" : "text-amber-300"
                                                }`}
                                            >
                                                {s.v}
                                                <span className="text-xs font-mono text-zinc-500 ml-1">
                                                    /100
                                                </span>
                                            </div>
                                            <div className="mt-3 h-1.5 rounded-full bg-white/5 overflow-hidden">
                                                <div
                                                    className={`h-full bg-gradient-to-r ${
                                                        s.inverse
                                                            ? "from-rose-500 to-rose-300"
                                                            : "from-amber-500 to-amber-300"
                                                    }`}
                                                    style={{ width: `${s.v}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 grid md:grid-cols-3 gap-4">
                                    <div className="cm-card rounded-2xl p-6" data-testid="investor-why">
                                        <SectionTitle icon={Sparkles}>Why invest</SectionTitle>
                                        <ul className="space-y-2 text-sm text-zinc-300">
                                            {(insight.investor.why_invest || []).map((x, i) => (
                                                <li key={i} className="flex gap-2">
                                                    <span className="text-emerald-400">▪</span>
                                                    {x}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="cm-card rounded-2xl p-6" data-testid="investor-reject">
                                        <SectionTitle icon={AlertTriangle}>
                                            Why reject
                                        </SectionTitle>
                                        <ul className="space-y-2 text-sm text-zinc-300">
                                            {(insight.investor.why_reject || []).map((x, i) => (
                                                <li key={i} className="flex gap-2">
                                                    <span className="text-rose-400">▪</span>
                                                    {x}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="cm-card rounded-2xl p-6" data-testid="investor-improve">
                                        <SectionTitle icon={Lightbulb}>
                                            How to improve
                                        </SectionTitle>
                                        <ul className="space-y-2 text-sm text-zinc-300">
                                            {(insight.investor.how_to_improve || []).map((x, i) => (
                                                <li key={i} className="flex gap-2">
                                                    <span className="text-amber-400">▪</span>
                                                    {x}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </>
                        )}
                    </TabsContent>

                    {/* PREDICTOR */}
                    <TabsContent value="predictor" className="mt-6 cm-stagger">
                        {!insight.success_prediction?.one_year_probability ? (
                            <div className="cm-glass rounded-2xl p-8 text-center text-zinc-400">
                                Re-run analysis to generate success forecasts.
                            </div>
                        ) : (
                            <>
                                <div className="grid sm:grid-cols-3 gap-3">
                                    {[
                                        { l: "1-year success", v: insight.success_prediction.one_year_probability },
                                        { l: "3-year success", v: insight.success_prediction.three_year_probability },
                                        { l: "5-year success", v: insight.success_prediction.five_year_probability },
                                    ].map((s) => (
                                        <div
                                            key={s.l}
                                            className="cm-card rounded-2xl p-6"
                                            data-testid={`predict-${s.l.split(" ")[0]}`}
                                        >
                                            <div className="cm-label">{s.l}</div>
                                            <div className="mt-2 font-display font-black text-5xl tracking-tighter text-amber-300">
                                                {s.v}
                                                <span className="text-xs font-mono text-zinc-500 ml-1">
                                                    %
                                                </span>
                                            </div>
                                            <div className="mt-3 h-1.5 rounded-full bg-white/5 overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-amber-500 to-amber-300"
                                                    style={{ width: `${s.v}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 cm-glass rounded-2xl p-6" data-testid="predict-explanation">
                                    <SectionTitle icon={Brain}>Trajectory</SectionTitle>
                                    <p className="text-sm text-zinc-300 leading-relaxed">
                                        {insight.success_prediction.explanation}
                                    </p>
                                </div>
                                <div className="mt-4 grid md:grid-cols-3 gap-4">
                                    <div className="cm-card rounded-2xl p-6" data-testid="predict-drivers">
                                        <SectionTitle icon={Rocket}>Growth drivers</SectionTitle>
                                        <ul className="space-y-2 text-sm text-zinc-300">
                                            {(insight.success_prediction.growth_drivers || []).map(
                                                (x, i) => (
                                                    <li key={i} className="flex gap-2">
                                                        <span className="text-emerald-400">▪</span>
                                                        {x}
                                                    </li>
                                                )
                                            )}
                                        </ul>
                                    </div>
                                    <div className="cm-card rounded-2xl p-6" data-testid="predict-risks">
                                        <SectionTitle icon={AlertTriangle}>Critical risks</SectionTitle>
                                        <ul className="space-y-2 text-sm text-zinc-300">
                                            {(insight.success_prediction.critical_risks || []).map(
                                                (x, i) => (
                                                    <li key={i} className="flex gap-2">
                                                        <span className="text-rose-400">▪</span>
                                                        {x}
                                                    </li>
                                                )
                                            )}
                                        </ul>
                                    </div>
                                    <div className="cm-card rounded-2xl p-6" data-testid="predict-barriers">
                                        <SectionTitle icon={Shield}>Market barriers</SectionTitle>
                                        <ul className="space-y-2 text-sm text-zinc-300">
                                            {(insight.success_prediction.market_barriers || []).map(
                                                (x, i) => (
                                                    <li key={i} className="flex gap-2">
                                                        <span className="text-amber-400">▪</span>
                                                        {x}
                                                    </li>
                                                )
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            </>
                        )}
                    </TabsContent>

                    {/* COMPETITORS (enhanced with intel) */}
                    <TabsContent value="competitors" className="mt-6 cm-stagger">
                        {(() => {
                            const intel = insight.competitor_intel || {};
                            const table =
                                intel.table && intel.table.length
                                    ? intel.table
                                    : (insight.competitors || []).map((c) => ({
                                          ...c,
                                          pricing: "—",
                                          market_position: "—",
                                          customer_sentiment: "Mixed",
                                      }));
                            return (
                                <>
                                    <div
                                        className="cm-card rounded-2xl p-0 overflow-hidden"
                                        data-testid="competitor-table"
                                    >
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead className="bg-white/3">
                                                    <tr className="text-left text-xs uppercase tracking-widest text-zinc-500">
                                                        <th className="px-5 py-3">Competitor</th>
                                                        <th className="px-5 py-3">Strengths</th>
                                                        <th className="px-5 py-3">Weaknesses</th>
                                                        <th className="px-5 py-3">Pricing</th>
                                                        <th className="px-5 py-3">Position</th>
                                                        <th className="px-5 py-3">Sentiment</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {table.map((c, i) => (
                                                        <tr
                                                            key={i}
                                                            className="border-t border-white/5 align-top hover:bg-white/2 transition"
                                                            data-testid={`competitor-row-${i}`}
                                                        >
                                                            <td className="px-5 py-4 font-display font-bold">
                                                                {c.name}
                                                            </td>
                                                            <td className="px-5 py-4 text-zinc-300">
                                                                {c.strengths}
                                                            </td>
                                                            <td className="px-5 py-4 text-zinc-300">
                                                                {c.weaknesses}
                                                            </td>
                                                            <td className="px-5 py-4 text-zinc-300 whitespace-nowrap">
                                                                {c.pricing || "—"}
                                                            </td>
                                                            <td className="px-5 py-4 text-zinc-300">
                                                                {c.market_position || "—"}
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                <span
                                                                    className={`text-xs px-2 py-1 rounded-full border ${
                                                                        c.customer_sentiment === "Positive"
                                                                            ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/20"
                                                                            : c.customer_sentiment ===
                                                                              "Negative"
                                                                            ? "text-rose-300 bg-rose-500/10 border-rose-500/20"
                                                                            : "text-zinc-300 bg-white/5 border-white/10"
                                                                    }`}
                                                                >
                                                                    {c.customer_sentiment || "Mixed"}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <div className="mt-4 grid md:grid-cols-3 gap-4">
                                        <div
                                            className="cm-card rounded-2xl p-6"
                                            data-testid="market-gaps"
                                        >
                                            <SectionTitle icon={Target}>
                                                Market gaps
                                            </SectionTitle>
                                            <ul className="space-y-2 text-sm text-zinc-300">
                                                {(intel.market_gaps || []).map((x, i) => (
                                                    <li key={i} className="flex gap-2">
                                                        <span className="text-amber-400">▪</span>
                                                        {x}
                                                    </li>
                                                ))}
                                                {(intel.market_gaps || []).length === 0 && (
                                                    <li className="text-zinc-500 text-xs">
                                                        Re-run analysis to populate.
                                                    </li>
                                                )}
                                            </ul>
                                        </div>
                                        <div
                                            className="cm-card rounded-2xl p-6"
                                            data-testid="competitive-advantages"
                                        >
                                            <SectionTitle icon={Shield}>
                                                Your edge
                                            </SectionTitle>
                                            <ul className="space-y-2 text-sm text-zinc-300">
                                                {(intel.competitive_advantages || []).map(
                                                    (x, i) => (
                                                        <li key={i} className="flex gap-2">
                                                            <span className="text-emerald-400">▪</span>
                                                            {x}
                                                        </li>
                                                    )
                                                )}
                                                {(intel.competitive_advantages || []).length ===
                                                    0 && (
                                                    <li className="text-zinc-500 text-xs">
                                                        Re-run analysis to populate.
                                                    </li>
                                                )}
                                            </ul>
                                        </div>
                                        <div
                                            className="cm-card rounded-2xl p-6"
                                            data-testid="blue-ocean"
                                        >
                                            <SectionTitle icon={Compass}>
                                                Blue ocean
                                            </SectionTitle>
                                            <ul className="space-y-2 text-sm text-zinc-300">
                                                {(intel.blue_ocean_opportunities || []).map(
                                                    (x, i) => (
                                                        <li key={i} className="flex gap-2">
                                                            <span className="text-blue-400">▪</span>
                                                            {x}
                                                        </li>
                                                    )
                                                )}
                                                {(intel.blue_ocean_opportunities || []).length ===
                                                    0 && (
                                                    <li className="text-zinc-500 text-xs">
                                                        Re-run analysis to populate.
                                                    </li>
                                                )}
                                            </ul>
                                        </div>
                                    </div>
                                </>
                            );
                        })()}
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

            {/* ---------------- Analysis Progress Modal ---------------- */}
            {job && (
                <AnalysisProgressModal job={job} onClose={() => { stopPolling(); setJob(null); }} />
            )}
        </AppLayout>
    );
}


const MODULES_ORDER = [
    "Product-Market Fit",
    "Customer Personas",
    "Competitor Intelligence",
    "Investor Readiness",
    "SWOT Analysis",
    "Business Model Canvas",
    "Success Forecast",
    "Market Validation Report",
];

function AnalysisProgressModal({ job, onClose }) {
    const progress = Math.min(100, Math.max(0, job.progress || 0));
    const completed = new Set(job.completed_modules || []);
    const failed = new Map(
        (job.failed_modules || []).map((f) => [f.module, f.error])
    );
    const done = job.status === "done" || job.status === "partial" || job.status === "failed";

    // Naive ETA: assume 5s per remaining module
    const remaining = MODULES_ORDER.filter(
        (m) => !completed.has(m) && !failed.has(m)
    ).length;
    const etaSec = done ? 0 : Math.max(3, remaining * 5);

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 cm-fade-in"
            data-testid="analysis-progress-modal"
        >
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={done ? onClose : undefined}
            />
            <div className="relative w-full max-w-xl cm-glass-strong rounded-3xl p-7 lg:p-8 border border-white/10 shadow-2xl cm-fade-up">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="cm-label flex items-center gap-2">
                            <span className="cm-ai-dots inline-flex">
                                <span></span><span></span><span></span>
                            </span>
                            AI pipeline · 8 modules
                        </div>
                        <h3 className="mt-1 font-display font-black text-2xl tracking-tight">
                            {done
                                ? (job.status === "done"
                                    ? "Analysis complete"
                                    : job.status === "partial"
                                    ? "Analysis finished (partial)"
                                    : "Analysis failed")
                                : "Generating your full report"}
                        </h3>
                        <p className="mt-1 text-sm text-zinc-400">
                            {done
                                ? "Refreshing your dashboard…"
                                : `${job.current_module || "Working"} · est. ${etaSec}s remaining`}
                        </p>
                    </div>
                    {done && (
                        <button
                            onClick={onClose}
                            data-testid="modal-close-btn"
                            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center"
                            aria-label="Close"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Animated progress bar */}
                <div className="mt-6">
                    <div className="flex items-center justify-between text-xs text-zinc-500 font-mono mb-2">
                        <span>{job.status === "queued" ? "Queued" : "In progress"}</span>
                        <span data-testid="modal-progress-value">{progress}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 transition-[width] duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Modules grid */}
                <div className="mt-6 grid sm:grid-cols-2 gap-2" data-testid="modal-modules-grid">
                    {MODULES_ORDER.map((m, i) => {
                        const isDone = completed.has(m);
                        const isFailed = failed.has(m);
                        const isCurrent = !isDone && !isFailed && job.current_module === m;
                        return (
                            <div
                                key={m}
                                data-testid={`modal-module-${i}`}
                                className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-sm transition ${
                                    isDone
                                        ? "border-emerald-500/30 bg-emerald-500/8 text-emerald-100"
                                        : isFailed
                                        ? "border-rose-500/30 bg-rose-500/8 text-rose-100"
                                        : isCurrent
                                        ? "border-amber-500/40 bg-amber-500/10 text-amber-100 cm-breathe"
                                        : "border-white/8 bg-white/2 text-zinc-400"
                                }`}
                            >
                                <span
                                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                        isDone
                                            ? "bg-emerald-500/25"
                                            : isFailed
                                            ? "bg-rose-500/25"
                                            : isCurrent
                                            ? "bg-amber-500/30"
                                            : "bg-white/5"
                                    }`}
                                >
                                    {isDone ? (
                                        <Check className="w-3 h-3" />
                                    ) : isFailed ? (
                                        <X className="w-3 h-3" />
                                    ) : isCurrent ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                        i + 1
                                    )}
                                </span>
                                <span className="flex-1 truncate">{m}</span>
                            </div>
                        );
                    })}
                </div>

                {failed.size > 0 && (
                    <div className="mt-4 text-xs text-rose-300 cm-glass rounded-lg p-3 border border-rose-500/20">
                        <span className="font-semibold">
                            {failed.size} module(s) skipped:
                        </span>{" "}
                        {Array.from(failed.keys()).join(", ")}. Re-run analysis to retry.
                    </div>
                )}
            </div>
        </div>
    );
}
