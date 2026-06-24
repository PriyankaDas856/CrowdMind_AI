import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Loader2,
    Swords,
    Trophy,
    Sparkles,
    ArrowLeftRight,
    ArrowRight,
} from "lucide-react";
import {
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    ResponsiveContainer,
    Legend,
    Tooltip,
} from "recharts";
import { api } from "../lib/api";
import AppLayout from "../components/AppLayout";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select";

const LABELS = {
    market_size: "Market size",
    competition: "Competition",
    risk: "Risk",
    revenue_potential: "Revenue",
    scalability: "Scalability",
    investor_appeal: "Investor appeal",
    pmf: "PMF",
};

export default function IdeaBattle() {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [a, setA] = useState("");
    const [b, setB] = useState("");
    const [loading, setLoading] = useState(true);
    const [battling, setBattling] = useState(false);
    const [result, setResult] = useState(null);

    useEffect(() => {
        (async () => {
            try {
                const { data } = await api.get("/projects");
                setProjects(data);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const fight = async () => {
        if (!a || !b) {
            toast.error("Pick two projects");
            return;
        }
        if (a === b) {
            toast.error("Pick two different projects");
            return;
        }
        setBattling(true);
        try {
            const { data } = await api.post("/battle", {
                project_a_id: a,
                project_b_id: b,
            });
            setResult(data);
        } catch (err) {
            toast.error(err.response?.data?.detail || "Battle failed");
        } finally {
            setBattling(false);
        }
    };

    const radarData = result
        ? Object.entries(result.criteria).map(([k, v]) => ({
              criterion: LABELS[k] || k,
              A: v.a,
              B: v.b,
          }))
        : [];

    return (
        <AppLayout>
            <div className="cm-fade-up">
                <div className="cm-label">Idea Battle Mode</div>
                <h1 className="mt-1 font-display font-black text-4xl sm:text-5xl tracking-tighter">
                    Two ideas enter. <span className="text-amber-400">One wins.</span>
                </h1>
                <p className="mt-3 text-zinc-400 max-w-2xl">
                    Pit any two of your projects against each other. Claude rates them on 7
                    criteria, declares a winner, and tells you what to fix on the loser.
                </p>
            </div>

            <div className="mt-10 cm-glass rounded-3xl p-6 lg:p-8" data-testid="battle-selector">
                {loading ? (
                    <div className="flex justify-center py-6 text-zinc-500">
                        <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                ) : projects.length < 2 ? (
                    <div className="text-center py-6">
                        <p className="text-zinc-400">
                            You need at least 2 projects to battle.
                        </p>
                        <button
                            onClick={() => navigate("/projects/new")}
                            className="mt-4 inline-flex items-center gap-2 px-5 py-3 rounded-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-sm transition"
                            data-testid="battle-create-project-btn"
                        >
                            New project <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
                        <div>
                            <div className="cm-label mb-2 text-amber-300">Idea A</div>
                            <Select value={a} onValueChange={setA}>
                                <SelectTrigger
                                    data-testid="battle-a-select"
                                    className="w-full px-4 py-3 h-auto rounded-xl bg-white/3 border border-white/8"
                                >
                                    <SelectValue placeholder="Pick a project" />
                                </SelectTrigger>
                                <SelectContent className="cm-glass-strong border-white/10">
                                    {projects.map((p) => (
                                        <SelectItem
                                            key={p.project_id}
                                            value={p.project_id}
                                            disabled={p.project_id === b}
                                        >
                                            {p.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="hidden md:flex items-center justify-center text-amber-400">
                            <Swords className="w-8 h-8" />
                        </div>
                        <div>
                            <div className="cm-label mb-2 text-emerald-300">Idea B</div>
                            <Select value={b} onValueChange={setB}>
                                <SelectTrigger
                                    data-testid="battle-b-select"
                                    className="w-full px-4 py-3 h-auto rounded-xl bg-white/3 border border-white/8"
                                >
                                    <SelectValue placeholder="Pick a project" />
                                </SelectTrigger>
                                <SelectContent className="cm-glass-strong border-white/10">
                                    {projects.map((p) => (
                                        <SelectItem
                                            key={p.project_id}
                                            value={p.project_id}
                                            disabled={p.project_id === a}
                                        >
                                            {p.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="md:col-span-3 flex justify-center mt-2">
                            <button
                                onClick={fight}
                                disabled={battling || !a || !b}
                                data-testid="battle-fight-btn"
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-zinc-950 font-semibold transition cm-amber-glow"
                            >
                                {battling ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <ArrowLeftRight className="w-4 h-4" />
                                )}
                                {battling ? "Battling…" : "Battle!"}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {result && (
                <div className="mt-10 grid lg:grid-cols-3 gap-6 cm-stagger">
                    {/* Winner */}
                    <div
                        className="cm-glass rounded-3xl p-6 lg:col-span-1"
                        data-testid="battle-winner"
                    >
                        <div className="cm-label">Winner</div>
                        <div className="mt-3 flex items-center gap-3">
                            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                                <Trophy className="w-7 h-7 text-amber-400" />
                            </div>
                            <div>
                                <div className="font-display font-black text-2xl tracking-tight">
                                    {result.winner_name}
                                </div>
                                <div className="text-xs text-zinc-500 font-mono">
                                    {result.winner === "TIE" ? "no clear winner" : `Idea ${result.winner}`}
                                </div>
                            </div>
                        </div>
                        <div className="mt-5 text-sm text-zinc-300 leading-relaxed">
                            {result.reasoning}
                        </div>
                    </div>

                    {/* Radar */}
                    <div
                        className="cm-card rounded-3xl p-6 lg:col-span-2"
                        data-testid="battle-radar"
                    >
                        <div className="cm-label">Head-to-head</div>
                        <div className="h-80 mt-3">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart data={radarData}>
                                    <PolarGrid stroke="rgba(255,255,255,0.08)" />
                                    <PolarAngleAxis
                                        dataKey="criterion"
                                        tick={{ fill: "#9CA3AF", fontSize: 11 }}
                                    />
                                    <PolarRadiusAxis
                                        angle={30}
                                        domain={[0, 100]}
                                        tick={{ fill: "#6B7280", fontSize: 9 }}
                                    />
                                    <Radar
                                        name={result.project_a.name}
                                        dataKey="A"
                                        stroke="#F59E0B"
                                        fill="#F59E0B"
                                        fillOpacity={0.3}
                                    />
                                    <Radar
                                        name={result.project_b.name}
                                        dataKey="B"
                                        stroke="#10B981"
                                        fill="#10B981"
                                        fillOpacity={0.3}
                                    />
                                    <Legend wrapperStyle={{ color: "#9CA3AF", fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{
                                            background: "#0b0f19",
                                            border: "1px solid rgba(255,255,255,0.1)",
                                            borderRadius: 10,
                                        }}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Criteria notes */}
                    <div
                        className="cm-card rounded-3xl p-6 lg:col-span-3"
                        data-testid="battle-criteria"
                    >
                        <div className="cm-label">Criterion-by-criterion</div>
                        <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {Object.entries(result.criteria).map(([k, v]) => (
                                <div
                                    key={k}
                                    className="rounded-xl border border-white/5 bg-white/2 p-3"
                                >
                                    <div className="cm-label">{LABELS[k] || k}</div>
                                    <div className="mt-2 flex items-center justify-between text-sm">
                                        <span className="text-amber-300 font-mono">A: {v.a}</span>
                                        <span className="text-emerald-300 font-mono">
                                            B: {v.b}
                                        </span>
                                    </div>
                                    <div className="mt-2 text-xs text-zinc-400 leading-snug">
                                        {v.note}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Improvements */}
                    <div
                        className="cm-card rounded-3xl p-6 lg:col-span-2"
                        data-testid="battle-loser-improvements"
                    >
                        <div className="cm-label text-rose-300">
                            How the {result.winner === "TIE" ? "loser" : "losing"} idea can improve
                        </div>
                        <ul className="mt-3 space-y-2 text-sm text-zinc-300">
                            {result.improvements_for_loser.map((s, i) => (
                                <li key={i} className="flex gap-2">
                                    <span className="text-rose-400">▪</span>
                                    {s}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="cm-card rounded-3xl p-6" data-testid="battle-winner-tips">
                        <div className="cm-label text-emerald-300">Even the winner could…</div>
                        <ul className="mt-3 space-y-2 text-sm text-zinc-300">
                            {result.improvements_for_winner.map((s, i) => (
                                <li key={i} className="flex gap-2">
                                    <Sparkles className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                                    {s}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
