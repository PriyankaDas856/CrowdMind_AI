import { Link, NavLink, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    FolderKanban,
    Plus,
    LogOut,
    Sparkles,
    User as UserIcon,
} from "lucide-react";
import { useAuth } from "../lib/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const navItems = [
    { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { to: "/projects", label: "Projects", icon: FolderKanban },
];

export default function AppLayout({ children }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const onLogout = async () => {
        await logout();
        navigate("/login", { replace: true });
    };

    const initials = (user?.name || "U")
        .split(" ")
        .map((s) => s[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

    return (
        <div className="cm-bg min-h-screen">
            <header
                className="sticky top-0 z-50 border-b border-white/5 cm-glass-strong"
                data-testid="app-header"
            >
                <div className="max-w-7xl mx-auto px-5 lg:px-8 h-16 flex items-center justify-between gap-4">
                    <Link
                        to="/dashboard"
                        className="flex items-center gap-2.5 group"
                        data-testid="app-logo-link"
                    >
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center cm-amber-glow">
                            <Sparkles className="w-4 h-4 text-zinc-950" strokeWidth={2.5} />
                        </div>
                        <div className="font-display font-extrabold text-lg tracking-tight">
                            CrowdMind<span className="text-amber-400">.</span>AI
                        </div>
                    </Link>

                    <nav className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                data-testid={`nav-${item.label.toLowerCase()}`}
                                className={({ isActive }) =>
                                    `px-3.5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                                        isActive
                                            ? "bg-white/8 text-white border border-white/10"
                                            : "text-zinc-400 hover:text-white hover:bg-white/5"
                                    }`
                                }
                            >
                                <item.icon className="w-4 h-4" />
                                {item.label}
                            </NavLink>
                        ))}
                    </nav>

                    <div className="flex items-center gap-3">
                        <Link
                            to="/projects/new"
                            data-testid="new-project-cta"
                            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-sm transition-all cm-amber-glow"
                        >
                            <Plus className="w-4 h-4" /> New project
                        </Link>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    data-testid="user-menu-trigger"
                                    className="rounded-full p-0.5 ring-1 ring-white/10 hover:ring-amber-400/40 transition"
                                >
                                    <Avatar className="w-9 h-9">
                                        {user?.picture && (
                                            <AvatarImage src={user.picture} alt={user.name} />
                                        )}
                                        <AvatarFallback className="bg-zinc-900 text-amber-400 text-xs font-bold">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="cm-glass-strong border-white/10 w-56"
                            >
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col">
                                        <span
                                            className="text-sm font-semibold truncate"
                                            data-testid="user-menu-name"
                                        >
                                            {user?.name}
                                        </span>
                                        <span className="text-xs text-zinc-500 truncate">
                                            {user?.email}
                                        </span>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-white/10" />
                                <DropdownMenuItem
                                    onClick={() => navigate("/dashboard")}
                                    className="cursor-pointer focus:bg-white/5"
                                    data-testid="menu-dashboard"
                                >
                                    <UserIcon className="w-4 h-4 mr-2" /> Dashboard
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={onLogout}
                                    className="cursor-pointer focus:bg-white/5 text-rose-400"
                                    data-testid="menu-logout"
                                >
                                    <LogOut className="w-4 h-4 mr-2" /> Sign out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-5 lg:px-8 py-8 lg:py-12">
                {children}
            </main>

            <footer className="border-t border-white/5 mt-12">
                <div className="max-w-7xl mx-auto px-5 lg:px-8 py-6 text-xs text-zinc-500 flex items-center justify-between">
                    <span>© {new Date().getFullYear()} CrowdMind AI</span>
                    <span className="font-mono">v0.1 · powered by Claude Sonnet 4.5</span>
                </div>
            </footer>
        </div>
    );
}
