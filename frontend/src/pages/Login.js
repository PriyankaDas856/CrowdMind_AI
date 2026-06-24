import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Mail, Lock, ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "../lib/auth-context";
import { toast } from "sonner";

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
function googleSignIn() {
    const redirectUrl = window.location.origin + "/auth/callback";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(
        redirectUrl
    )}`;
}

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const u = await login(email.trim(), password);
            toast.success(`Welcome back, ${u.name.split(" ")[0]}!`);
            navigate("/dashboard", { replace: true });
        } catch (err) {
            toast.error(err.response?.data?.detail || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="cm-bg min-h-screen flex">
            {/* Left brand panel */}
            <div className="hidden lg:flex w-1/2 relative overflow-hidden border-r border-white/5">
                <div className="absolute inset-0 cm-grid-lines opacity-30" />
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-blue-500/5" />
                <div className="relative z-10 m-auto p-12 max-w-md cm-fade-up">
                    <Link to="/" className="flex items-center gap-2.5 mb-12" data-testid="login-logo">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center cm-amber-glow">
                            <Sparkles className="w-5 h-5 text-zinc-950" strokeWidth={2.5} />
                        </div>
                        <div className="font-display font-extrabold text-xl">
                            CrowdMind<span className="text-amber-400">.</span>AI
                        </div>
                    </Link>
                    <h1 className="font-display font-black text-5xl tracking-tighter leading-[0.95]">
                        Welcome back,
                        <br />
                        <span className="text-amber-400">founder.</span>
                    </h1>
                    <p className="mt-6 text-zinc-400 leading-relaxed">
                        Pick up where you left off. Your projects, feedback streams and AI
                        reports are waiting.
                    </p>

                    <div className="mt-10 grid grid-cols-3 gap-3">
                        {[
                            { v: "0–100", l: "Score" },
                            { v: "Low–Med–High", l: "Demand" },
                            { v: "Auto", l: "Sentiment" },
                        ].map((s) => (
                            <div
                                key={s.l}
                                className="rounded-xl border border-white/5 bg-white/2 p-3"
                            >
                                <div className="font-display font-bold text-amber-300 text-sm">
                                    {s.v}
                                </div>
                                <div className="cm-label mt-1 text-[10px]">{s.l}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right form */}
            <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
                <div className="w-full max-w-md cm-fade-up">
                    <div className="lg:hidden flex items-center gap-2.5 mb-10">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center cm-amber-glow">
                            <Sparkles className="w-4 h-4 text-zinc-950" strokeWidth={2.5} />
                        </div>
                        <div className="font-display font-extrabold text-lg">
                            CrowdMind<span className="text-amber-400">.</span>AI
                        </div>
                    </div>

                    <div className="cm-label">Sign in</div>
                    <h2 className="mt-1 font-display font-bold text-3xl tracking-tight">
                        Access your dashboard
                    </h2>

                    <button
                        onClick={googleSignIn}
                        data-testid="google-signin-btn"
                        className="mt-8 w-full inline-flex items-center justify-center gap-3 px-5 py-3 rounded-full cm-glass hover:bg-white/8 transition border border-white/10"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 48 48">
                            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
                            <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
                            <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
                            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
                        </svg>
                        <span className="font-medium">Continue with Google</span>
                    </button>

                    <div className="my-6 flex items-center gap-3">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-xs uppercase tracking-widest text-zinc-500">
                            or with email
                        </span>
                        <div className="flex-1 h-px bg-white/10" />
                    </div>

                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label className="cm-label mb-2 block">Email</label>
                            <div className="relative">
                                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@startup.com"
                                    data-testid="login-email-input"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/3 border border-white/8 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition placeholder:text-zinc-600"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="cm-label mb-2 block">Password</label>
                            <div className="relative">
                                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="password"
                                    required
                                    minLength={8}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    data-testid="login-password-input"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/3 border border-white/8 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition placeholder:text-zinc-600"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            data-testid="login-submit-btn"
                            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-zinc-950 font-semibold transition cm-amber-glow"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    Sign in <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="mt-6 text-sm text-zinc-500 text-center">
                        New to CrowdMind?{" "}
                        <Link
                            to="/register"
                            data-testid="login-to-register-link"
                            className="text-amber-400 hover:text-amber-300 font-medium"
                        >
                            Create an account
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
