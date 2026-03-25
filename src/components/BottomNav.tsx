import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context";
import { GalleryHorizontalEnd, LogOut, Shield, Wand2 } from "lucide-react";

const itemBaseClass =
  "min-h-[56px] rounded-2xl px-2.5 py-1.5 flex flex-col items-center justify-center gap-1 touch-manipulation select-none transition-colors border border-transparent";

const activeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
const inactiveClass = "text-gray-500 hover:bg-gray-50 border-gray-100";

const BottomNav = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;
  const isAdmin = user?.role === "admin";

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/90 backdrop-blur-xl border-t border-gray-200"
      aria-label="Mobile navigation"
    >
      <div
        className="px-3 pt-2"
        style={{
          paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))",
        }}
      >
        <div className={`mx-auto ${isAdmin ? "grid grid-cols-4" : "grid grid-cols-3"} gap-2`}>
          <Link
            to="/editor"
            className={`${itemBaseClass} ${isActive("/editor") ? activeClass : inactiveClass}`}
            aria-label="Editor"
          >
            <Wand2 className="w-5 h-5" aria-hidden />
            <span className="text-[10px] font-medium leading-none">Editor</span>
          </Link>

          <Link
            to="/gallery"
            className={`${itemBaseClass} ${isActive("/gallery") ? activeClass : inactiveClass}`}
            aria-label="Gallery"
          >
            <GalleryHorizontalEnd className="w-5 h-5" aria-hidden />
            <span className="text-[10px] font-medium leading-none">Gallery</span>
          </Link>

          {isAdmin ? (
            <Link
              to="/admin"
              className={`${itemBaseClass} ${isActive("/admin") ? activeClass : inactiveClass}`}
              aria-label="Admin"
            >
              <Shield className="w-5 h-5" aria-hidden />
              <span className="text-[10px] font-medium leading-none">Admin</span>
            </Link>
          ) : null}

          <button
            type="button"
            onClick={handleLogout}
            className={`${itemBaseClass} ${inactiveClass}`}
            aria-label="Logout"
          >
            <LogOut className="w-5 h-5" aria-hidden />
            <span className="text-[10px] font-medium leading-none">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BottomNav;
