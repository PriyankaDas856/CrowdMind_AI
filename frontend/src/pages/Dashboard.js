import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    Plus,
    Users,
    BarChart3,
    Activity,
    Brain,
    ArrowUpRight,
    UserCircle2,
    Swords,
    Trophy,
    Target,
    Gauge,
} from "lucide-react";
import { api } from "../lib/api";
import AppLayout from "../components/AppLayout";
import EmptyState from "../components/EmptyState";
import {
    SkeletonStatCard,
    SkeletonProjectCard,
    SkeletonHealthScore,
} from "../components/Skeleton";
import { useAuth } from "../lib/auth-context";

function StatCard({ icon: Icon, label, value, sub, testId }) {
    return (
        <div className="cm-card rounded-2xl p-5" data-testid={testId}>
            <div className="flex items-start justify-between">
                <div className="cm-label">{label}</div>
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/15 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-amber-400" />
                </div>
            </div>
            <div className="mt-4 font-display font-black text-4xl tracking-tighter">
                {value}
            </div>
            {sub && (
                <div className="mt-1 text-xs text-zinc-500 font-mono">{sub}</div>
            )}
        </div>
    );
}

function HealthScoreCard({ stats }) {
    const score = stats?.startup_health_score ?? 0;
    const breakdown = stats?.health_breakdown ?? {};
    // gauge math
    const R = 60;
    const C = 2 * Math.PI * R;
    const pct = Math.max(0, Math.min(100, score)) / 100;
    const dash = C * pct;
    const ringColor =
        score >= 75 ? "#10b981" : score >= 50 ? "#fb923c" : "#f43f5e";
    const verdict =
        score >= 75
            ? "Investor-ready"
            : score >= 50
            ? "Promising — keep iterating"
            : "Validate further";

    const subs = [
        { key: "validation", label: "Validation", value: breakdown.validation ?? 0 },
        { key: "pmf", label: "PMF", value: breakdown.pmf ?? 0 },
        { key: "investor", label: "Investor", value: breakdown.investor ?? 0 },
        { key: "success_1y", label: "1y Success", value: breakdown.success_1y ?? 0 },
    ];

    return (
        <div
            className="cm-card rounded-3xl p-7 cm-fade-up"
            data-testid="startup-health-score-card"
        >
            <div className="flex flex-col md:flex-row items-center gap-7">
                <div className="relative w-36 h-36 shrink-0">
                    <svg viewBox="0 0 144 144" className="w-full h-full -rotate-90">
                        <circle
                            cx="72"
                            cy="72"
                            r={R}
                            fill="none"
                            stroke="rgba(255,255,255,0.06)"
                            strokeWidth="10"
                        />
                        <circle
                            cx="72"
                            cy="72"
                            r={R}
                            fill="none"
                            stroke={ringColor}
                            strokeWidth="10"
                            strokeLinecap="round"
                            strokeDasharray={`${dash} ${C - dash}`}
                            style={{ transition: "stroke-dasharray 800ms ease-out" }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div
                            className="font-display font-black text-4xl tracking-tighter"
                            data-testid="startup-health-score-value"
                        >
                            {score}
                        </div>
                        <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">
                            / 100
                        </div>
                    </div>
                </div>

                <div className="flex-1 w-full text-center md:text-left">
                    <div className="inline-flex items-center gap-1.5 cm-label">
                        <Gauge className="w-3 h-3 text-amber-400" /> Startup Health Score
                    </div>
                    <h2 className="mt-1 font-display font-bold text-2xl tracking-tight">
                        {verdict}
                    </h2>
                    <p className="mt-1 text-sm text-zinc-400 max-w-md">
                        Composite of validation, product-market fit, investor readiness
                        and one-year success probability across your analyzed projects.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                        {subs.map((s) => (
                            <div
                                key={s.key}
                                className="rounded-xl bg-white/[0.02] border border-white/5 p-3"
                                data-testid={`health-sub-${s.key}`}
                            >
                                <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">
                                    {s.label}
                                </div>
                                <div className="mt-1 font-display font-bold text-xl">
                                    {s.value}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ProjectCard({ p }) {
    const status = p.status === "analyzed" ? "Analyzed" : "Collecting";
    const statusClass =
        p.status === "analyzed"
            ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/20"
            : "text-amber-300 bg-amber-500/10 border-amber-500/20";
    return (
        <Link
            to={`/projects/${p.project_id}`}
            data-testid={`project-card-${p.project_id}`}
            className="cm-card rounded-2xl p-5 block group"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="cm-label truncate">{p.category}</div>
                <span
                    className={`text-[10px] uppercase tracking-widest font-semibold px-2 py-1 rounded-full border ${statusClass}`}
                >
                    {status}
                </span>
            </div>
            <h3 className="mt-3 font-display font-bold text-xl tracking-tight line-clamp-2">
                {p.name}
            </h3>
            <p className="mt-2 text-sm text-zinc-400 line-clamp-3 leading-relaxed">
                {p.description}
            </p>
            <div className="mt-4 flex items-center justify-between">
                <div className="text-xs text-zinc-500 font-mono">
                    {p.location} · {p.target_audience}
                </div>
                <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-amber-400 transition" />
            </div>
        </Link>
    );
}

export default function Dashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const [s, p] = await Promise.all([
                    api.get("/dashboard/stats"),
                    api.get("/projects"),
                ]);
                setStats(s.data);
                setProjects(p.data);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    return (
        <AppLayout>
            <div className="flex flex-wrap items-end justify-between gap-4 mb-8 cm-fade-up">
                <div>
                    <div className="cm-label">Dashboard</div>
                    <h1 className="mt-1 font-display font-black text-4xl sm:text-5xl tracking-tighter">
                        Hello, {user?.name?.split(" ")[0] || "founder"}.
                    </h1>
                    <p className="mt-2 text-zinc-400">
                        Your validation pipeline at a glance.
                    </p>
                </div>
                <Link
                    to="/projects/new"
                    data-testid="dashboard-new-project-btn"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold transition cm-amber-glow"
                >
                    <Plus className="w-4 h-4" /> New project
                </Link>
            </div>

            {loading ? (
                <>
                    <SkeletonHealthScore testId="skeleton-health" />
                    <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <SkeletonStatCard testId="skeleton-stat-1" />
                        <SkeletonStatCard testId="skeleton-stat-2" />
                        <SkeletonStatCard testId="skeleton-stat-3" />
                        <SkeletonStatCard testId="skeleton-stat-4" />
                    </div>
                    <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <SkeletonProjectCard testId="skeleton-project-1" />
                        <SkeletonProjectCard testId="skeleton-project-2" />
                        <SkeletonProjectCard testId="skeleton-project-3" />
                    </div>
                </>
            ) : (
                <>
                    {stats?.analyzed_projects > 0 && <HealthScoreCard stats={stats} />}

                    <div
                        className={`${
                            stats?.analyzed_projects > 0 ? "mt-6" : ""
                        } grid sm:grid-cols-2 lg:grid-cols-4 gap-4 cm-stagger`}
                    >
                        <StatCard
                            icon={Activity}
                            label="Projects"
                            value={stats?.total_projects ?? 0}
                            sub="total"
                            testId="stat-total-projects"
                        />
                        <StatCard
                            icon={Users}
                            label="Responses"
                            value={stats?.total_responses ?? 0}
                            sub="across all projects"
                            testId="stat-total-responses"
                        />
                        <StatCard
                            icon={Target}
                            label="Avg PMF"
                            value={stats?.avg_pmf_score ?? "—"}
                            sub="0–100"
                            testId="stat-avg-pmf"
                        />
                        <StatCard
                            icon={Brain}
                            label="AI reports"
                            value={stats?.analyzed_projects ?? 0}
                            sub="generated"
                            testId="stat-analyzed"
                        />
                    </div>

                    {/* Advanced module shortcuts */}
                    <div className="mt-12 grid sm:grid-cols-3 gap-4 cm-stagger">
                        {[
                            {
                                to: "/founder",
                                icon: UserCircle2,
                                title: "Founder Twin AI",
                                body: "Score your founder profile and unlock industries built for you.",
                                cta: "Open Founder",
                                testid: "shortcut-founder",
                            },
                            {
                                to: "/battle",
                                icon: Swords,
                                title: "Idea Battle Mode",
                                body: "Put two of your projects head-to-head and let AI decide.",
                                cta: "Start a battle",
                                testid: "shortcut-battle",
                            },
                            {
                                to: "/leaderboard",
                                icon: Trophy,
                                title: "Public Leaderboard",
                                body: "See where the world's most validated ideas rank — publish to join.",
                                cta: "View leaderboard",
                                testid: "shortcut-leaderboard",
                            },
                        ].map((s) => (
                            <Link
                                key={s.to}
                                to={s.to}
                                data-testid={s.testid}
                                className="cm-card rounded-2xl p-6 group"
                            >
                                <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                                    <s.icon className="w-5 h-5 text-amber-400" />
                                </div>
                                <div className="mt-4 font-display font-bold text-lg">
                                    {s.title}
                                </div>
                                <div className="mt-2 text-sm text-zinc-400 leading-relaxed">
                                    {s.body}
                                </div>
                                <div className="mt-5 inline-flex items-center gap-1.5 text-xs text-amber-400 font-mono group-hover:text-amber-300">
                                    {s.cta} <ArrowUpRight className="w-3 h-3" />
                                </div>
                            </Link>
                        ))}
                    </div>

                    <div className="mt-12 flex items-end justify-between gap-3">
                        <div>
                            <div className="cm-label">Your projects</div>
                            <h2 className="mt-1 font-display font-bold text-2xl tracking-tight">
                                {projects.length > 0
                                    ? `${projects.length} active`
                                    : "Nothing yet"}
                            </h2>
                        </div>
                    </div>

                    {projects.length === 0 ? (
                        <div className="mt-6">
                            <EmptyState
                                variant="projects"
                                testId="empty-projects-state"
                                title="Validate your first idea"
                                body="Create a project, collect feedback from real people, then let CrowdMind score and analyze it."
                                cta="New project"
                                ctaTo="/projects/new"
                            />
                        </div>
                    ) : (
                        <div className="mt-6 grid md:grid-cols-2 lg:grid-cols-3 gap-4 cm-stagger">
                            {projects.map((p) => (
                                <ProjectCard key={p.project_id} p={p} />
                            ))}
                        </div>
                    )}
                </>
            )}
        </AppLayout>
    );
}
