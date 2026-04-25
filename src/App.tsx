import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import EditorPage from "./pages/EditorPage";
import GalleryPage from "./pages/GalleryPage";
import AdminPage from "./pages/AdminPage";
import WelcomePage from "./pages/WelcomePage";
// import PostStudyFormPage from "./pages/PostStudyFormPage";
import Login from "./components/Auth/Login";
import { AuthProvider, NavigationGuardProvider, useAuth } from "./context";
import ScrollToTop from "./components/ScrollToTop";
import Layout from "./components/Layout";
import "./App.css";
import { useEffect, type JSX } from "react";
import PostStudyFormPage from "./pages/PostStudyFormPage";

const getDefaultAuthenticatedRoute = (role?: string) =>
  role === "admin" ? "/editor" : "/welcome";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/login${location.search}`} replace />;
  }

  return children;
};

const PublicRoute = ({ children }: { children: JSX.Element }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (user) {
    return <Navigate to={getDefaultAuthenticatedRoute(user.role)} replace />;
  }

  return children;
};

const AdminRoute = ({ children }: { children: JSX.Element }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/login${location.search}`} replace />;
  }

  if (user.role !== "admin") {
    return <Navigate to="/editor" replace />;
  }

  return children;
};

const useDisableMobileSwipeNavigation = () => {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const isTouchDevice =
      window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;

    if (!isTouchDevice) return;

    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;

      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
    };

    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;

      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;
      const startedAtLeftEdge = touchStartX <= 32;
      const startedAtRightEdge = touchStartX >= window.innerWidth - 32;
      const isMostlyHorizontal = Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10;

      if (
        isMostlyHorizontal &&
        ((startedAtLeftEdge && deltaX > 0) || (startedAtRightEdge && deltaX < 0))
      ) {
        event.preventDefault();
      }
    };

    document.documentElement.classList.add("disable-mobile-swipe-nav");
    document.body.classList.add("disable-mobile-swipe-nav");

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      document.documentElement.classList.remove("disable-mobile-swipe-nav");
      document.body.classList.remove("disable-mobile-swipe-nav");
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);
};

function App() {
  useDisableMobileSwipeNavigation();

  return (
    <AuthProvider>
      <Router>
        <NavigationGuardProvider>
          <ScrollToTop />
          <AppRoutes />
        </NavigationGuardProvider>
      </Router>
    </AuthProvider>
  );
}

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>

          {/* Public Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />

          {/* Layout Wrapper */}
          <Route element={<Layout />}>

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Navigate to={getDefaultAuthenticatedRoute(user?.role)} replace />
                </ProtectedRoute>
              }
            />

            <Route
              path="/welcome"
              element={
                <ProtectedRoute>
                  <WelcomePage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/editor"
              element={
                <ProtectedRoute>
                  <EditorPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/gallery"
              element={
                <ProtectedRoute>
                  <GalleryPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/post-study-form"
              element={
                <ProtectedRoute>
                  <PostStudyFormPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminPage />
                </AdminRoute>
              }
            />

          </Route>

          <Route
            path="*"
            element={<Navigate to={getDefaultAuthenticatedRoute(user?.role)} replace />}
          />

    </Routes>
  );
};

export default App;