import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
    ArrowRight,
    CheckCircle2,
    Loader2,
    Sparkles,
    Star,
} from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { toast } from "sonner";
import {
    RadioGroup,
    RadioGroupItem,
} from "../components/ui/radio-group";
import { Label } from "../components/ui/label";

const INTENTS = [
    { v: "definitely", l: "Definitely yes" },
    { v: "likely", l: "Likely" },
    { v: "maybe", l: "Maybe" },
    { v: "unlikely", l: "Unlikely" },
    { v: "no", l: "Not for me" },
];

export default function FeedbackSubmit() {
    const { publicLinkId } = useParams();
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [text, setText] = useState("");
    const [suggestion, setSuggestion] = useState("");
    const [intent, setIntent] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const { data } = await api.get(`/public/projects/${publicLinkId}`);
                setProject(data);
            } catch {
                toast.error("Project not found");
                navigate("/");
            } finally {
                setLoading(false);
            }
        })();
    }, [publicLinkId, navigate]);

    const submit = async (e) => {
        e.preventDefault();
        if (!user) {
            navigate(
                `/login?next=${encodeURIComponent(`/feedback/${publicLinkId}`)}`
            );
            return;
        }
        if (rating < 1 || !text || !intent) {
            toast.error("Please rate, share feedback and pick your purchase intent");
            return;
        }
        setSubmitting(true);
        try {
            await api.post(`/projects/${project.project_id}/feedback`, {
                rating,
                feedback_text: text,
                suggestion,
                purchase_intent: intent,
            });
            setDone(true);
        } catch (err) {
            toast.error(err.response?.data?.detail || "Could not submit");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading || authLoading) {
        return (
            <div className="cm-bg min-h-screen flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
            </div>
        );
    }

    return (
        <div className="cm-bg min-h-screen">
            <header className="border-b border-white/5 cm-glass-strong sticky top-0 z-50">
                <div className="max-w-3xl mx-auto px-5 lg:px-8 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center cm-amber-glow">
                            <Sparkles className="w-4 h-4 text-zinc-950" strokeWidth={2.5} />
                        </div>
                        <div className="font-display font-extrabold text-base">
                            CrowdMind<span className="text-amber-400">.</span>AI
                        </div>
                    </Link>
                    {!user && (
                        <Link
                            to={`/login?next=${encodeURIComponent(
                                `/feedback/${publicLinkId}`
                            )}`}
                            data-testid="feedback-login-link"
                            className="text-sm text-zinc-300 hover:text-white"
                        >
                            Sign in
                        </Link>
                    )}
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-5 lg:px-8 py-10">
                {done ? (
                    <div className="cm-glass rounded-3xl p-12 text-center cm-fade-up" data-testid="feedback-success">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                        </div>
                        <h1 className="mt-6 font-display font-black text-4xl tracking-tighter">
                            Thank you.
                        </h1>
                        <p className="mt-3 text-zinc-400 max-w-md mx-auto">
                            Your feedback helps shape what gets built. Want to validate one
                            of your own ideas?
                        </p>
                        <Link
                            to="/dashboard"
                            className="mt-8 inline-flex items-center gap-2 px-5 py-3 rounded-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold transition cm-amber-glow"
                            data-testid="feedback-done-cta"
                        >
                            Go to dashboard <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                ) : (
                    <div className="cm-fade-up">
                        <div className="cm-label">{project.category}</div>
                        <h1 className="mt-1 font-display font-black text-4xl sm:text-5xl tracking-tighter">
                            {project.name}
                        </h1>
                        <p className="mt-3 text-zinc-400 leading-relaxed">
                            {project.description}
                        </p>
                        <div className="mt-3 text-xs text-zinc-500 font-mono">
                            For: {project.target_audience} · {project.location}
                        </div>

                        {!user && (
                            <div
                                className="mt-6 cm-glass rounded-2xl p-5 flex items-center justify-between gap-4"
                                data-testid="feedback-auth-cta"
                            >
                                <div className="text-sm text-zinc-300">
                                    Sign in to share feedback. Takes 30s.
                                </div>
                                <Link
                                    to={`/login?next=${encodeURIComponent(
                                        `/feedback/${publicLinkId}`
                                    )}`}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-sm transition"
                                >
                                    Sign in
                                </Link>
                            </div>
                        )}

                        <form
                            onSubmit={submit}
                            className={`mt-8 cm-glass rounded-3xl p-6 lg:p-8 space-y-6 ${
                                !user ? "opacity-60 pointer-events-none" : ""
                            }`}
                        >
                            <div>
                                <label className="cm-label mb-3 block">Your rating</label>
                                <div className="flex items-center gap-1" data-testid="rating-stars">
                                    {[1, 2, 3, 4, 5].map((n) => (
                                        <button
                                            type="button"
                                            key={n}
                                            onMouseEnter={() => setHover(n)}
                                            onMouseLeave={() => setHover(0)}
                                            onClick={() => setRating(n)}
                                            data-testid={`star-${n}`}
                                            className="p-1"
                                        >
                                            <Star
                                                className={`w-7 h-7 transition-all ${
                                                    n <= (hover || rating)
                                                        ? "fill-amber-400 text-amber-400 scale-110"
                                                        : "text-zinc-600"
                                                }`}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="cm-label mb-2 block">
                                    What do you think?
                                </label>
                                <textarea
                                    rows={5}
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    placeholder="Honest feedback helps the most."
                                    data-testid="feedback-text-input"
                                    className="w-full px-4 py-3 rounded-xl bg-white/3 border border-white/8 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition placeholder:text-zinc-600 resize-y"
                                />
                            </div>

                            <div>
                                <label className="cm-label mb-2 block">
                                    Any suggestion? (optional)
                                </label>
                                <input
                                    type="text"
                                    value={suggestion}
                                    onChange={(e) => setSuggestion(e.target.value)}
                                    placeholder="What would make this 10x better?"
                                    data-testid="feedback-suggestion-input"
                                    className="w-full px-4 py-3 rounded-xl bg-white/3 border border-white/8 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition placeholder:text-zinc-600"
                                />
                            </div>

                            <div>
                                <label className="cm-label mb-3 block">
                                    Would you buy this?
                                </label>
                                <RadioGroup
                                    value={intent}
                                    onValueChange={setIntent}
                                    className="grid sm:grid-cols-2 gap-2"
                                >
                                    {INTENTS.map((opt) => (
                                        <label
                                            key={opt.v}
                                            htmlFor={`intent-${opt.v}`}
                                            data-testid={`intent-${opt.v}`}
                                            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                                                intent === opt.v
                                                    ? "border-amber-500/60 bg-amber-500/10"
                                                    : "border-white/8 hover:border-white/15"
                                            }`}
                                        >
                                            <RadioGroupItem
                                                value={opt.v}
                                                id={`intent-${opt.v}`}
                                                className="border-white/20"
                                            />
                                            <Label
                                                htmlFor={`intent-${opt.v}`}
                                                className="text-sm cursor-pointer"
                                            >
                                                {opt.l}
                                            </Label>
                                        </label>
                                    ))}
                                </RadioGroup>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting || !user}
                                data-testid="feedback-submit-btn"
                                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-zinc-950 font-semibold transition cm-amber-glow"
                            >
                                {submitting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        Submit feedback <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                )}
            </main>
        </div>
    );
}
