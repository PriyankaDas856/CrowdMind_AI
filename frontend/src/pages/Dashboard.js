import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    Plus,
    Sparkles,
    Users,
    BarChart3,
    Activity,
    Brain,
    ArrowUpRight,
    Loader2,
    UserCircle2,
    Swords,
    Trophy,
} from "lucide-react";
import { api } from "../lib/api";
import AppLayout from "../components/AppLayout";
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
                <div className="py-20 flex items-center justify-center text-zinc-500">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading dashboard…
                </div>
            ) : (
                <>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 cm-stagger">
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
                            icon={BarChart3}
                            label="Avg score"
                            value={stats?.avg_validation_score ?? "—"}
                            sub="0–100"
                            testId="stat-avg-score"
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
                        <div
                            className="mt-6 cm-glass rounded-3xl p-10 text-center"
                            data-testid="empty-projects-state"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto">
                                <Sparkles className="w-6 h-6 text-amber-400" />
                            </div>
                            <h3 className="mt-5 font-display font-bold text-2xl tracking-tight">
                                Validate your first idea
                            </h3>
                            <p className="mt-2 text-zinc-400 max-w-md mx-auto">
                                Create a project, collect feedback from real people, then let
                                CrowdMind score and analyze it.
                            </p>
                            <Link
                                to="/projects/new"
                                data-testid="empty-state-cta"
                                className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold transition cm-amber-glow"
                            >
                                <Plus className="w-4 h-4" /> New project
                            </Link>
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
