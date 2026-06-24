import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from "lucide-react";
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

const CATEGORIES = [
    "SaaS / Software",
    "Mobile App",
    "Consumer Hardware",
    "Marketplace",
    "E-commerce",
    "Fintech",
    "Healthtech",
    "Edtech",
    "AI / ML",
    "Creator Tools",
    "Productivity",
    "Other",
];

export default function CreateProject() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: "",
        category: "",
        description: "",
        target_audience: "",
        location: "",
    });
    const [loading, setLoading] = useState(false);

    const set = (k) => (e) =>
        setForm((p) => ({
            ...p,
            [k]: typeof e === "string" ? e : e.target.value,
        }));

    const submit = async (e) => {
        e.preventDefault();
        if (
            !form.name ||
            !form.category ||
            !form.description ||
            !form.target_audience ||
            !form.location
        ) {
            toast.error("Please fill all fields");
            return;
        }
        setLoading(true);
        try {
            const { data } = await api.post("/projects", form);
            toast.success("Project created");
            navigate(`/projects/${data.project_id}`, { replace: true });
        } catch (err) {
            toast.error(err.response?.data?.detail || "Could not create project");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppLayout>
            <button
                onClick={() => navigate(-1)}
                data-testid="back-btn"
                className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white mb-6"
            >
                <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <div className="max-w-3xl cm-fade-up">
                <div className="cm-label">New project</div>
                <h1 className="mt-1 font-display font-black text-4xl sm:text-5xl tracking-tighter">
                    Describe the idea you want to validate.
                </h1>
                <p className="mt-3 text-zinc-400">
                    The more specific you are, the sharper CrowdMind&apos;s analysis will be.
                </p>

                <form
                    onSubmit={submit}
                    className="mt-10 cm-glass rounded-3xl p-6 lg:p-8 space-y-6"
                >
                    <div className="grid md:grid-cols-2 gap-5">
                        <div>
                            <label className="cm-label mb-2 block">Product name</label>
                            <input
                                type="text"
                                required
                                value={form.name}
                                onChange={set("name")}
                                placeholder="e.g. Threadwise"
                                data-testid="project-name-input"
                                className="w-full px-4 py-3 rounded-xl bg-white/3 border border-white/8 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition placeholder:text-zinc-600"
                            />
                        </div>
                        <div>
                            <label className="cm-label mb-2 block">Category</label>
                            <Select
                                value={form.category}
                                onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}
                            >
                                <SelectTrigger
                                    data-testid="project-category-trigger"
                                    className="w-full px-4 py-3 h-auto rounded-xl bg-white/3 border border-white/8 focus:ring-amber-500/20 focus:border-amber-500/60"
                                >
                                    <SelectValue placeholder="Pick a category" />
                                </SelectTrigger>
                                <SelectContent className="cm-glass-strong border-white/10">
                                    {CATEGORIES.map((c) => (
                                        <SelectItem
                                            key={c}
                                            value={c}
                                            data-testid={`category-option-${c}`}
                                        >
                                            {c}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div>
                        <label className="cm-label mb-2 block">Description</label>
                        <textarea
                            required
                            value={form.description}
                            onChange={set("description")}
                            rows={5}
                            placeholder="A short pitch: what does it do, who it's for, and why now."
                            data-testid="project-description-input"
                            className="w-full px-4 py-3 rounded-xl bg-white/3 border border-white/8 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition placeholder:text-zinc-600 resize-y"
                        />
                    </div>

                    <div className="grid md:grid-cols-2 gap-5">
                        <div>
                            <label className="cm-label mb-2 block">Target audience</label>
                            <input
                                type="text"
                                required
                                value={form.target_audience}
                                onChange={set("target_audience")}
                                placeholder="e.g. Indie founders shipping their 1st SaaS"
                                data-testid="project-audience-input"
                                className="w-full px-4 py-3 rounded-xl bg-white/3 border border-white/8 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition placeholder:text-zinc-600"
                            />
                        </div>
                        <div>
                            <label className="cm-label mb-2 block">Location</label>
                            <input
                                type="text"
                                required
                                value={form.location}
                                onChange={set("location")}
                                placeholder="e.g. North America"
                                data-testid="project-location-input"
                                className="w-full px-4 py-3 rounded-xl bg-white/3 border border-white/8 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition placeholder:text-zinc-600"
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <Sparkles className="w-4 h-4 text-amber-400" />
                            CrowdMind will generate a public link to collect signed-in feedback.
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            data-testid="project-create-submit"
                            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-zinc-950 font-semibold transition cm-amber-glow"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    Create project <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
