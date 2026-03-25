import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import EditorPage from "./pages/EditorPage";
import GalleryPage from "./pages/GalleryPage";
import AdminPage from "./pages/AdminPage";
// import PostStudyFormPage from "./pages/PostStudyFormPage";
import Login from "./components/Auth/Login";
import { AuthProvider, useAuth } from "./context";
import ScrollToTop from "./components/ScrollToTop";
import Layout from "./components/Layout";
import "./App.css";
import type { JSX } from "react";
import PostStudyFormPage from "./pages/PostStudyFormPage";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
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
    return <Navigate to="/editor" replace />;
  }

  return children;
};

const AdminRoute = ({ children }: { children: JSX.Element }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "admin") {
    return <Navigate to="/editor" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />

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
                  <Navigate to="/editor" replace />
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

          <Route path="*" element={<Navigate to="/editor" replace />} />

        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;