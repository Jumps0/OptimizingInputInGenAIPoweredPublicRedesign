import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/context";
import { GalleryHorizontalEnd, Shield, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

const navPillClass = (isActive: boolean) =>
  cn(
    "min-h-[44px] rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-2 touch-manipulation select-none px-3 active:scale-[0.98]",
    "max-[360px]:w-11 max-[360px]:min-w-[44px] max-[360px]:px-0 max-[360px]:gap-0",
    isActive
      ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/30"
      : "text-gray-700 hover:bg-emerald-50 active:bg-emerald-100"
  );

const NavLabel = ({ children }: { children: ReactNode }) => (
  <span className="max-[360px]:sr-only">{children}</span>
);

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const linkFocus =
    "shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-2";

  return (
    <nav
      className="w-full px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] md:px-4"
      aria-label="Main navigation"
    >
      <div className="max-w-6xl mx-auto my-3 sm:my-5 rounded-2xl sm:rounded-full border border-emerald-100/80 bg-white/90 backdrop-blur-xl shadow-[0_12px_30px_rgba(16,185,129,0.16)] px-2.5 py-2.5 sm:px-4 sm:py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <div className="flex flex-wrap items-center justify-center gap-2 min-w-0 sm:justify-start sm:flex-1">
            <NavLink to="/editor" className={linkFocus}>
              {({ isActive }) => (
                <div className={navPillClass(isActive)}>
                  <Wand2 className="w-4 h-4 shrink-0" aria-hidden />
                  <NavLabel>Editor</NavLabel>
                </div>
              )}
            </NavLink>

            <NavLink to="/gallery" className={linkFocus}>
              {({ isActive }) => (
                <div className={navPillClass(isActive)}>
                  <GalleryHorizontalEnd className="w-4 h-4 shrink-0" aria-hidden />
                  <NavLabel>Gallery</NavLabel>
                </div>
              )}
            </NavLink>

            {user?.role === "admin" && (
              <NavLink to="/admin" className={linkFocus}>
                {({ isActive }) => (
                  <div className={navPillClass(isActive)}>
                    <Shield className="w-4 h-4 shrink-0" aria-hidden />
                    <NavLabel>Admin</NavLabel>
                  </div>
                )}
              </NavLink>
            )}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="min-h-[44px] w-full sm:w-auto shrink-0 px-4 py-2.5 rounded-full text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 active:bg-red-200/80 transition-colors touch-manipulation active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-red-400/60 focus-visible:ring-offset-2"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
