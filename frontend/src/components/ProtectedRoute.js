import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import { Loader2 } from "lucide-react";

export default function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="cm-bg min-h-screen flex items-center justify-center">
                <div className="flex items-center gap-3 text-zinc-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="font-mono text-sm">authenticating…</span>
                </div>
            </div>
        );
    }

    if (!user) return <Navigate to="/login" replace />;
    return children;
}
