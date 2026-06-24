import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
export default function AuthCallback() {
    const navigate = useNavigate();
    const { setUserFromCallback } = useAuth();

    useEffect(() => {
        const hash = window.location.hash || "";
        const match = hash.match(/session_id=([^&]+)/);
        if (!match) {
            navigate("/login", { replace: true });
            return;
        }
        const session_id = match[1];
        // Strip the fragment
        window.history.replaceState(null, "", window.location.pathname);

        (async () => {
            try {
                const { data } = await api.post("/auth/google/session", {
                    session_id,
                });
                setUserFromCallback(data.user);
                toast.success(`Welcome, ${data.user.name.split(" ")[0]}!`);
                navigate("/dashboard", { replace: true, state: { user: data.user } });
            } catch (err) {
                toast.error("Sign-in failed. Please try again.");
                navigate("/login", { replace: true });
            }
        })();
    }, [navigate, setUserFromCallback]);

    return (
        <div className="cm-bg min-h-screen flex items-center justify-center">
            <div className="cm-glass rounded-2xl px-8 py-6 flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
                <span className="font-mono text-sm text-zinc-300">
                    finalising secure sign-in…
                </span>
            </div>
        </div>
    );
}
