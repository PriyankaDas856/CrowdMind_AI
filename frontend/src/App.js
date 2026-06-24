import "@/App.css";
import {
    BrowserRouter,
    Routes,
    Route,
    useLocation,
} from "react-router-dom";
import { AuthProvider } from "./lib/auth-context";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AuthCallback from "./pages/AuthCallback";
import Dashboard from "./pages/Dashboard";
import CreateProject from "./pages/CreateProject";
import ProjectDetail from "./pages/ProjectDetail";
import FeedbackSubmit from "./pages/FeedbackSubmit";
import FounderTwin from "./pages/FounderTwin";
import IdeaBattle from "./pages/IdeaBattle";
import Leaderboard from "./pages/Leaderboard";
import ProtectedRoute from "./components/ProtectedRoute";
import { Toaster } from "sonner";

function AppRouter() {
    const location = useLocation();
    // Detect Emergent OAuth fragment synchronously to avoid race conditions
    if (location.hash?.includes("session_id=")) {
        return <AuthCallback />;
    }
    return (
        <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/feedback/:publicLinkId" element={<FeedbackSubmit />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/projects"
                element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/projects/new"
                element={
                    <ProtectedRoute>
                        <CreateProject />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/projects/:projectId"
                element={
                    <ProtectedRoute>
                        <ProjectDetail />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/founder"
                element={
                    <ProtectedRoute>
                        <FounderTwin />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/battle"
                element={
                    <ProtectedRoute>
                        <IdeaBattle />
                    </ProtectedRoute>
                }
            />
        </Routes>
    );
}

function App() {
    return (
        <div className="App">
            <BrowserRouter>
                <AuthProvider>
                    <Toaster
                        position="top-right"
                        theme="dark"
                        toastOptions={{
                            style: {
                                background: "rgba(11,15,25,0.9)",
                                color: "#F9FAFB",
                                border: "1px solid rgba(255,255,255,0.08)",
                                backdropFilter: "blur(20px)",
                            },
                        }}
                    />
                    <AppRouter />
                </AuthProvider>
            </BrowserRouter>
        </div>
    );
}

export default App;
