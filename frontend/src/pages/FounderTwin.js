import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Loader2,
    Sparkles,
    Briefcase,
    Wallet,
    Clock,
    Compass,
    TrendingUp,
    Brain,
    Save,
    Wand2,
} from "lucide-react";
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

const RISK = ["low", "medium", "high"];
const TIME = ["weekends", "part-time", "full-time"];

const SKILL_PRESETS = [
    "Engineering",
    "Design",
    "Sales",
    "Marketing",
    "Operations",
    "Product",
    "Data / AI",
    "Finance",
    "Community",
];
const INDUSTRY_PRESETS = [
    "SaaS",
    "Fintech",
    "Healthtech",
    "Edtech",
    "AI / ML",
    "Marketplace",
    "Consumer Apps",
    "Creator Economy",
    "Climate",
    "DevTools",
];

function Chips({ value, onChange, options, testIdPrefix }) {
    const toggle = (v) =>
        onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
    return (
        <div className="flex flex-wrap gap-2">
            {options.map((o) => {
                const active = value.includes(o);
                return (
                    <button
                        type="button"
                        key={o}
                        data-testid={`${testIdPrefix}-${o.replace(/\s+/g, "-").toLowerCase()}`}
                        onClick={() => toggle(o)}
                        className={`px-3 py-1.5 rounded-full text-xs border transition ${
                            active
                                ? "bg-amber-500 text-zinc-950 border-amber-500 font-semibold"
                                : "bg-white/3 border-white/10 text-zinc-300 hover:border-white/20"
                        }`}
                    >
                        {o}
                    </button>
                );
            })}
        </div>
    );
}

export default function FounderTwin() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [insight, setInsight] = useState(null);
    const [form, setForm] = useState({
        budget: 0,
        skills: [],
        experience_years: 0,
        industry_interests: [],
        risk_appetite: "medium",
        time_availability: "part-time",
        prior_startups: 0,
    });

    useEffect(() => {
        (async () => {
            try {
                const [{ data: profile }, { data: insightData }] = await Promise.all([
                    api.get("/founder/profile"),
                    api.get("/founder/insight"),
                ]);
                if (profile) setForm((f) => ({ ...f, ...profile }));
                if (insightData) setInsight(insightData);
            } catch {
                // ignore
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const save = async (e) => {
        e?.preventDefault();
        if (!form.budget || form.skills.length === 0 || form.industry_interests.length === 0) {
            toast.error("Pick a budget, at least 1 skill and 1 industry");
            return;
        }
        setSaving(true);
        try {
            await api.post("/founder/profile", { ...form, budget: Number(form.budget) });
            toast.success("Profile saved");
        } catch (err) {
            toast.error(err.response?.data?.detail || "Save failed");
        } finally {
            setSaving(false);
        }
    };

    const analyze = async () => {
        await save();
        setAnalyzing(true);
        try {
            const { data } = await api.post("/founder/analyze");
            setInsight(data);
            toast.success("Founder analysis complete");
        } catch (err) {
            toast.error(err.response?.data?.detail || "AI analysis failed");
        } finally {
            setAnalyzing(false);
        }
    };

    if (loading) {
        return (
            <AppLayout>
                <div className="py-20 flex justify-center text-zinc-500">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="cm-fade-up">
                <div className="cm-label">Founder Twin AI</div>
                <h1 className="mt-1 font-display font-black text-4xl sm:text-5xl tracking-tighter">
                    Build the version of <span className="text-amber-400">you</span> that ships.
                </h1>
                <p className="mt-3 text-zinc-400 max-w-2xl">
                    Tell CrowdMind about your context. It scores your founder profile and
                    recommends the categories of startup where you have the best shot.
                </p>
            </div>

            <div className="mt-10 grid lg:grid-cols-5 gap-6">
                {/* Form */}
                <form
                    onSubmit={save}
                    className="lg:col-span-3 cm-glass rounded-3xl p-6 lg:p-8 space-y-6"
                    data-testid="founder-profile-form"
                >
                    <div>
                        <label className="cm-label mb-2 block flex items-center gap-2">
                            <Wallet className="w-3.5 h-3.5 text-amber-400" /> Budget (USD)
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-mono">$</span>
                            <input
                                type="number"
                                min={0}
                                step="100"
                                value={form.budget || ""}
                                onChange={(e) =>
                                    setForm({ ...form, budget: Number(e.target.value) || 0 })
                                }
                                placeholder="e.g. 25000"
                                data-testid="founder-budget"
                                className="w-full pl-8 pr-4 py-3 rounded-xl bg-white/3 border border-white/8 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition placeholder:text-zinc-600"
                            />
                        </div>
                        <p className="mt-1.5 text-xs text-zinc-500">
                            Roughly what you can put behind this. Decimal allowed.
                        </p>
                    </div>

                    <div>
                        <label className="cm-label mb-2 block flex items-center gap-2">
                            <Briefcase className="w-3.5 h-3.5 text-amber-400" /> Core skills
                        </label>
                        <Chips
                            value={form.skills}
                            onChange={(v) => setForm({ ...form, skills: v })}
                            options={SKILL_PRESETS}
                            testIdPrefix="founder-skill"
                        />
                    </div>

                    <div>
                        <label className="cm-label mb-2 block flex items-center gap-2">
                            <Compass className="w-3.5 h-3.5 text-amber-400" /> Industries you care about
                        </label>
                        <Chips
                            value={form.industry_interests}
                            onChange={(v) => setForm({ ...form, industry_interests: v })}
                            options={INDUSTRY_PRESETS}
                            testIdPrefix="founder-industry"
                        />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <label className="cm-label mb-2 block">Years of experience</label>
                            <input
                                type="number"
                                min={0}
                                max={60}
                                value={form.experience_years}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        experience_years: Number(e.target.value) || 0,
                                    })
                                }
                                data-testid="founder-experience-years"
                                className="w-full px-4 py-3 rounded-xl bg-white/3 border border-white/8"
                            />
                        </div>
                        <div>
                            <label className="cm-label mb-2 block">Prior startups</label>
                            <input
                                type="number"
                                min={0}
                                max={20}
                                value={form.prior_startups}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        prior_startups: Number(e.target.value) || 0,
                                    })
                                }
                                data-testid="founder-prior-startups"
                                className="w-full px-4 py-3 rounded-xl bg-white/3 border border-white/8"
                            />
                        </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <label className="cm-label mb-2 block">Risk appetite</label>
                            <Select
                                value={form.risk_appetite}
                                onValueChange={(v) => setForm({ ...form, risk_appetite: v })}
                            >
                                <SelectTrigger
                                    data-testid="founder-risk"
                                    className="w-full px-4 py-3 h-auto rounded-xl bg-white/3 border border-white/8"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="cm-glass-strong border-white/10">
                                    {RISK.map((r) => (
                                        <SelectItem key={r} value={r} className="capitalize">
                                            {r}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="cm-label mb-2 block flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5 text-amber-400" /> Time availability
                            </label>
                            <Select
                                value={form.time_availability}
                                onValueChange={(v) =>
                                    setForm({ ...form, time_availability: v })
                                }
                            >
                                <SelectTrigger
                                    data-testid="founder-time"
                                    className="w-full px-4 py-3 h-auto rounded-xl bg-white/3 border border-white/8"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="cm-glass-strong border-white/10">
                                    {TIME.map((t) => (
                                        <SelectItem key={t} value={t} className="capitalize">
                                            {t.replace("-", " ")}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={saving}
                            data-testid="founder-save-btn"
                            className="inline-flex items-center gap-2 px-5 py-3 rounded-full cm-glass border border-white/10 hover:bg-white/8 text-sm transition"
                        >
                            {saving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            Save profile
                        </button>
                        <button
                            type="button"
                            onClick={analyze}
                            disabled={analyzing}
                            data-testid="founder-analyze-btn"
                            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-zinc-950 font-semibold text-sm transition cm-amber-glow"
                        >
                            {analyzing ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Wand2 className="w-4 h-4" />
                            )}
                            {insight ? "Re-run AI analysis" : "Run AI analysis"}
                        </button>
                    </div>
                </form>

                {/* Insight panel */}
                <div className="lg:col-span-2">
                    {insight ? (
                        <div className="cm-card rounded-3xl p-6 cm-fade-up" data-testid="founder-insight">
                            <div className="cm-label">Founder score</div>
                            <div className="mt-2 font-display font-black text-7xl tracking-tighter text-amber-300">
                                {insight.founder_score}
                                <span className="text-xs text-zinc-500 font-mono ml-1">
                                    / 100
                                </span>
                            </div>
                            <div className="mt-2 h-2 rounded-full bg-white/5 overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-amber-500 to-amber-300"
                                    style={{ width: `${insight.founder_score}%` }}
                                />
                            </div>

                            <div className="mt-6">
                                <div className="cm-label text-emerald-300">Strengths</div>
                                <ul className="mt-2 space-y-1.5 text-sm">
                                    {insight.strengths.map((s, i) => (
                                        <li key={i} className="flex gap-2">
                                            <span className="text-emerald-400">▪</span>
                                            {s}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="mt-5">
                                <div className="cm-label text-rose-300">Weaknesses</div>
                                <ul className="mt-2 space-y-1.5 text-sm">
                                    {insight.weaknesses.map((s, i) => (
                                        <li key={i} className="flex gap-2">
                                            <span className="text-rose-400">▪</span>
                                            {s}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="mt-5">
                                <div className="cm-label">Recommended industries</div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {insight.recommended_industries.map((i, k) => (
                                        <span
                                            key={k}
                                            className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/8"
                                        >
                                            {i}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="mt-5">
                                <div className="cm-label">Best-fit startup types</div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {insight.recommended_startup_types.map((i, k) => (
                                        <span
                                            key={k}
                                            className="text-xs px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300"
                                        >
                                            {i}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="mt-5">
                                <div className="cm-label flex items-center gap-2">
                                    <Brain className="w-3.5 h-3.5 text-amber-400" /> Personalized advice
                                </div>
                                <ul className="mt-2 space-y-1.5 text-sm">
                                    {insight.advice.map((s, i) => (
                                        <li key={i} className="flex gap-2">
                                            <span className="text-amber-400">▪</span>
                                            {s}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <button
                                onClick={() => navigate("/projects/new")}
                                data-testid="founder-create-project-btn"
                                className="mt-7 inline-flex items-center gap-2 px-5 py-3 rounded-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-sm transition cm-amber-glow"
                            >
                                <TrendingUp className="w-4 h-4" />
                                Validate a matching idea
                            </button>
                        </div>
                    ) : (
                        <div className="cm-glass rounded-3xl p-8 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto">
                                <Sparkles className="w-6 h-6 text-amber-400" />
                            </div>
                            <h3 className="mt-5 font-display font-bold text-xl">
                                Score your founder profile
                            </h3>
                            <p className="mt-2 text-sm text-zinc-400">
                                Fill the form and run analysis to get a score, strengths,
                                weaknesses and recommendations tailored to you.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
