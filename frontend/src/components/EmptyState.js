import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

/**
 * Custom SVG illustrations for each empty state — no emoji, no cartoons.
 * Built with floating geometric shapes + gradient orbs to match the
 * Linear / Stripe / Vercel aesthetic.
 */

function EmptyProjectsIllustration() {
    return (
        <svg
            viewBox="0 0 200 140"
            className="w-44 h-32 mx-auto"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <defs>
                <linearGradient id="emp-glow" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#fb923c" stopOpacity="0.18" />
                    <stop offset="1" stopColor="#fb923c" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="emp-card" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#ffffff" stopOpacity="0.08" />
                    <stop offset="1" stopColor="#ffffff" stopOpacity="0.02" />
                </linearGradient>
            </defs>
            <circle cx="100" cy="78" r="72" fill="url(#emp-glow)" />
            {/* Back card */}
            <g transform="translate(60 30) rotate(-8 50 30)">
                <rect width="100" height="60" rx="10" fill="url(#emp-card)" stroke="rgba(255,255,255,0.08)" />
                <rect x="12" y="14" width="40" height="4" rx="2" fill="rgba(255,255,255,0.18)" />
                <rect x="12" y="24" width="68" height="4" rx="2" fill="rgba(255,255,255,0.1)" />
                <rect x="12" y="34" width="52" height="4" rx="2" fill="rgba(255,255,255,0.08)" />
            </g>
            {/* Mid card */}
            <g transform="translate(50 38) rotate(-2 50 30)">
                <rect width="100" height="60" rx="10" fill="url(#emp-card)" stroke="rgba(255,255,255,0.1)" />
                <rect x="12" y="14" width="32" height="4" rx="2" fill="rgba(255,255,255,0.22)" />
                <rect x="12" y="24" width="74" height="4" rx="2" fill="rgba(255,255,255,0.12)" />
                <rect x="12" y="34" width="44" height="4" rx="2" fill="rgba(255,255,255,0.1)" />
            </g>
            {/* Front card with amber sparkle */}
            <g transform="translate(40 50)">
                <rect width="120" height="68" rx="12" fill="#16161a" stroke="rgba(251,146,60,0.35)" />
                <rect x="14" y="16" width="38" height="5" rx="2.5" fill="#fb923c" />
                <rect x="14" y="28" width="80" height="4" rx="2" fill="rgba(255,255,255,0.2)" />
                <rect x="14" y="38" width="64" height="4" rx="2" fill="rgba(255,255,255,0.14)" />
                <rect x="14" y="48" width="46" height="4" rx="2" fill="rgba(255,255,255,0.1)" />
                <circle cx="104" cy="22" r="3" fill="#fb923c" />
            </g>
        </svg>
    );
}

function EmptyFeedbackIllustration() {
    return (
        <svg
            viewBox="0 0 200 140"
            className="w-44 h-32 mx-auto"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <defs>
                <linearGradient id="fb-glow" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#10b981" stopOpacity="0.16" />
                    <stop offset="1" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
            </defs>
            <circle cx="100" cy="76" r="68" fill="url(#fb-glow)" />
            {/* Speech bubble large */}
            <g transform="translate(40 28)">
                <rect width="80" height="46" rx="14" fill="#16161a" stroke="rgba(255,255,255,0.1)" />
                <circle cx="22" cy="23" r="3" fill="rgba(255,255,255,0.4)" />
                <circle cx="34" cy="23" r="3" fill="rgba(255,255,255,0.4)" />
                <circle cx="46" cy="23" r="3" fill="rgba(255,255,255,0.4)" />
                <path d="M 18 46 L 26 56 L 32 46 Z" fill="#16161a" stroke="rgba(255,255,255,0.1)" />
            </g>
            {/* Speech bubble small */}
            <g transform="translate(98 72)">
                <rect width="64" height="38" rx="12" fill="#16161a" stroke="rgba(251,146,60,0.4)" />
                <circle cx="20" cy="19" r="2.5" fill="#fb923c" />
                <circle cx="32" cy="19" r="2.5" fill="#fb923c" opacity="0.7" />
                <circle cx="44" cy="19" r="2.5" fill="#fb923c" opacity="0.4" />
                <path d="M 38 38 L 30 48 L 46 38 Z" fill="#16161a" stroke="rgba(251,146,60,0.4)" />
            </g>
        </svg>
    );
}

function EmptyReportIllustration() {
    return (
        <svg
            viewBox="0 0 200 140"
            className="w-44 h-32 mx-auto"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <defs>
                <linearGradient id="rep-glow" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#fb923c" stopOpacity="0.2" />
                    <stop offset="1" stopColor="#fb923c" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="rep-arc" x1="0" y1="1" x2="1" y2="0">
                    <stop offset="0" stopColor="#fb923c" />
                    <stop offset="1" stopColor="#fbbf24" />
                </linearGradient>
            </defs>
            <circle cx="100" cy="78" r="72" fill="url(#rep-glow)" />
            {/* Gauge */}
            <g transform="translate(58 38)">
                <path
                    d="M 0 60 A 42 42 0 0 1 84 60"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                />
                <path
                    d="M 0 60 A 42 42 0 0 1 22 24"
                    stroke="url(#rep-arc)"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    opacity="0.7"
                />
                <line
                    x1="42"
                    y1="60"
                    x2="42"
                    y2="22"
                    stroke="#fb923c"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                />
                <circle cx="42" cy="60" r="5" fill="#fb923c" />
                <circle cx="42" cy="60" r="2.5" fill="#0a0a0b" />
            </g>
            {/* Mini chart */}
            <g transform="translate(70 110)">
                <rect width="6" height="14" rx="2" fill="rgba(255,255,255,0.18)" />
                <rect x="12" width="6" height="22" rx="2" fill="rgba(255,255,255,0.25)" />
                <rect x="24" width="6" height="10" rx="2" fill="rgba(255,255,255,0.2)" />
                <rect x="36" width="6" height="18" rx="2" fill="#fb923c" />
                <rect x="48" width="6" height="26" rx="2" fill="#fbbf24" />
            </g>
        </svg>
    );
}

function EmptyPersonasIllustration() {
    return (
        <svg
            viewBox="0 0 200 140"
            className="w-44 h-32 mx-auto"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <defs>
                <linearGradient id="per-glow" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#3b82f6" stopOpacity="0.18" />
                    <stop offset="1" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
            </defs>
            <circle cx="100" cy="80" r="70" fill="url(#per-glow)" />
            {[40, 84, 128].map((x, i) => (
                <g key={x} transform={`translate(${x} ${44 + (i === 1 ? -10 : 0)})`}>
                    <circle cx="16" cy="14" r="10" fill="#16161a" stroke="rgba(255,255,255,0.15)" />
                    <rect x="0" y="28" width="32" height="38" rx="8" fill="#16161a" stroke="rgba(255,255,255,0.1)" />
                    <rect x="6" y="34" width="20" height="3" rx="1.5" fill="rgba(255,255,255,0.25)" />
                    <rect x="6" y="42" width="14" height="3" rx="1.5" fill="rgba(255,255,255,0.12)" />
                    <rect x="6" y="50" width="18" height="3" rx="1.5" fill="rgba(255,255,255,0.1)" />
                </g>
            ))}
            <circle cx="100" cy="42" r="4" fill="#fb923c" />
        </svg>
    );
}

const VARIANTS = {
    projects: EmptyProjectsIllustration,
    feedback: EmptyFeedbackIllustration,
    report: EmptyReportIllustration,
    personas: EmptyPersonasIllustration,
};

export default function EmptyState({
    variant = "projects",
    title,
    body,
    cta,
    ctaTo,
    onCta,
    testId,
    children,
}) {
    const Illustration = VARIANTS[variant] || EmptyProjectsIllustration;
    return (
        <div
            className="cm-glass rounded-3xl px-6 py-10 sm:py-14 text-center cm-fade-up"
            data-testid={testId || `empty-${variant}`}
        >
            <Illustration />
            <h3 className="mt-4 font-display font-bold text-2xl tracking-tight">
                {title}
            </h3>
            {body && (
                <p className="mt-2 text-sm sm:text-base text-zinc-400 max-w-md mx-auto leading-relaxed">
                    {body}
                </p>
            )}
            {children && <div className="mt-5">{children}</div>}
            {cta && (
                ctaTo ? (
                    <Link
                        to={ctaTo}
                        onClick={onCta}
                        data-testid={`${testId || `empty-${variant}`}-cta`}
                        className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold transition cm-amber-glow"
                    >
                        {cta} <ArrowRight className="w-4 h-4" />
                    </Link>
                ) : (
                    <button
                        onClick={onCta}
                        data-testid={`${testId || `empty-${variant}`}-cta`}
                        className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold transition cm-amber-glow"
                    >
                        {cta} <ArrowRight className="w-4 h-4" />
                    </button>
                )
            )}
        </div>
    );
}
