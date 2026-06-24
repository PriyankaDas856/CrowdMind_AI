import { Sparkles } from "lucide-react";

/**
 * Small transparency badge shown beside titles of demo/synthetic items.
 * Use anywhere a project/insight from the seeded demo environment is displayed.
 */
export default function DemoBadge({ className = "", compact = false, label }) {
    if (compact) {
        return (
            <span
                title="All data shown is synthetic and generated for demonstration purposes."
                data-testid="demo-badge"
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-widest font-semibold border border-amber-500/30 bg-amber-500/10 text-amber-300 ${className}`}
            >
                <Sparkles className="w-2.5 h-2.5" />
                Demo
            </span>
        );
    }
    return (
        <span
            title="All data shown is synthetic and generated for demonstration purposes."
            data-testid="demo-badge"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-widest font-semibold border border-amber-500/30 bg-amber-500/10 text-amber-300 ${className}`}
        >
            <Sparkles className="w-3 h-3" />
            {label || "Demo data"}
        </span>
    );
}
