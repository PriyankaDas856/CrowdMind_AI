import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    Loader2,
    Trophy,
    TrendingUp,
    Flame,
    Heart,
    Sparkles,
    ArrowUpRight,
} from "lucide-react";
import { api, API_BASE } from "../lib/api";
import AppLayout from "../components/AppLayout";

const SORTS = [
    { v: "validation", l: "Top validated", icon: Trophy },
    { v: "investor", l: "Most investable", icon: Sparkles },
    { v: "pmf", l: "Best PMF", icon: TrendingUp },
    { v: "innovation", l: "Most innovative", icon: Flame },
    { v: "trending", l: "Trending", icon: TrendingUp },
    { v: "community", l: "Community fav", icon: Heart },
];

function Row({ item, idx, onLike, liked }) {
    const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`;
    return (
        <div
            className="cm-card rounded-2xl p-5 flex flex-col sm:flex-row gap-4 sm:items-center"
            data-testid={`leaderboard-row-${item.project_id}`}
        >
            <div className="w-12 text-2xl font-display font-black text-amber-300 text-center">
                {medal}
            </div>
            <div className="flex-1 min-w-0">
                <div className="font-display font-bold text-xl tracking-tight truncate">
                    {item.name}
                </div>
                <div className="text-xs text-zinc-500 font-mono">{item.category}</div>
                <div className="mt-1 text-sm text-zinc-400 line-clamp-2">
                    {item.description}
                </div>
            </div>
            <div className="grid grid-cols-4 gap-3 sm:gap-5 text-center">
                {[
                    { l: "Val", v: item.validation_score },
                    { l: "PMF", v: item.pmf_score },
                    { l: "Inv", v: item.investor_score },
                    { l: "Inn", v: item.innovation_score },
                ].map((s) => (
                    <div key={s.l}>
                        <div className="font-display font-bold text-amber-300 text-base">
                            {s.v}
                        </div>
                        <div className="cm-label text-[9px]">{s.l}</div>
                    </div>
                ))}
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onLike(item.public_link_id)}
                    data-testid={`leaderboard-like-${item.project_id}`}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full border text-xs transition ${
                        liked
                            ? "bg-rose-500/15 border-rose-500/40 text-rose-300"
                            : "bg-white/3 border-white/10 hover:border-rose-500/30 text-zinc-300"
                    }`}
                >
                    <Heart
                        className={`w-3.5 h-3.5 ${liked ? "fill-rose-400 text-rose-400" : ""}`}
                    />
                    {item.community_likes}
                </button>
                <Link
                    to={`/feedback/${item.public_link_id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs"
                    data-testid={`leaderboard-view-${item.project_id}`}
                >
                    View <ArrowUpRight className="w-3 h-3" />
                </Link>
            </div>
        </div>
    );
}

export default function Leaderboard() {
    const [sort, setSort] = useState("validation");
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [liked, setLiked] = useState(
        () => new Set(JSON.parse(localStorage.getItem("cm_liked") || "[]"))
    );

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const { data } = await api.get(`/leaderboard`, { params: { sort } });
                setItems(data.items);
            } finally {
                setLoading(false);
            }
        })();
    }, [sort]);

    const onLike = async (publicLinkId) => {
        if (liked.has(publicLinkId)) return;
        try {
            const res = await fetch(`${API_BASE}/leaderboard/like/${publicLinkId}`, {
                method: "POST",
                credentials: "include",
            });
            if (!res.ok) return;
            const { community_likes } = await res.json();
            setItems((prev) =>
                prev.map((p) =>
                    p.public_link_id === publicLinkId
                        ? { ...p, community_likes }
                        : p
                )
            );
            const next = new Set(liked);
            next.add(publicLinkId);
            setLiked(next);
            localStorage.setItem("cm_liked", JSON.stringify([...next]));
        } catch {
            // ignore
        }
    };

    return (
        <AppLayout>
            <div className="cm-fade-up">
                <div className="cm-label">Leaderboard</div>
                <h1 className="mt-1 font-display font-black text-4xl sm:text-5xl tracking-tighter">
                    The world&apos;s most <span className="text-amber-400">validated</span> ideas.
                </h1>
                <p className="mt-3 text-zinc-400 max-w-2xl">
                    Only published projects appear here. Publish yours from the project
                    page to compete.
                </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-2" data-testid="leaderboard-sort">
                {SORTS.map((s) => {
                    const active = sort === s.v;
                    return (
                        <button
                            key={s.v}
                            onClick={() => setSort(s.v)}
                            data-testid={`sort-${s.v}`}
                            className={`px-4 py-2 rounded-full text-sm border transition flex items-center gap-2 ${
                                active
                                    ? "bg-amber-500 text-zinc-950 border-amber-500 font-semibold"
                                    : "bg-white/3 border-white/10 text-zinc-300 hover:border-white/20"
                            }`}
                        >
                            <s.icon className="w-3.5 h-3.5" />
                            {s.l}
                        </button>
                    );
                })}
            </div>

            <div className="mt-6">
                {loading ? (
                    <div className="py-20 flex justify-center text-zinc-500">
                        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading rankings…
                    </div>
                ) : items.length === 0 ? (
                    <div
                        className="cm-glass rounded-3xl p-12 text-center"
                        data-testid="leaderboard-empty"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto">
                            <Trophy className="w-6 h-6 text-amber-400" />
                        </div>
                        <h3 className="mt-5 font-display font-bold text-2xl tracking-tight">
                            Nobody&apos;s on the board yet
                        </h3>
                        <p className="mt-2 text-zinc-400 max-w-md mx-auto">
                            Publish your first analyzed project from its detail page and
                            it&apos;ll appear here.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3 cm-stagger">
                        {items.map((it, i) => (
                            <Row
                                key={it.project_id}
                                item={it}
                                idx={i}
                                onLike={onLike}
                                liked={liked.has(it.public_link_id)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
