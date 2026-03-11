import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/context";
import logo2 from "@/assets/logo3.png";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <nav className="sticky max-w-7xl border border-white/30 mx-auto rounded-full py-2 my-3 top-0 z-50 backdrop-blur-2xl bg-black/80 border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
      <div className="px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <NavLink
          to="/"
          className="flex items-center gap-2 text-xl font-bold text-white"
        >
          <img src={logo2} alt="Citizen Redesign Logo" className="w-20 h-20 object-contain" />
        </NavLink>

        {/* Navigation */}
        <div className="flex items-center gap-10">
          <ul className="flex items-center gap-8">

            {/* Home */}
            <li>
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `relative text-sm font-medium transition duration-300 ${
                    isActive
                      ? "text-emerald-400"
                      : "text-white hover:text-emerald-400"
                  }`
                }
              >
                {({ isActive }) => (
                  <span className="relative text-white">
                    Home
                    {isActive && (
                      <span className="absolute -bottom-2 left-0 w-full h-[2px] bg-emerald-400 rounded"></span>
                    )}
                  </span>
                )}
              </NavLink>
            </li>

            {/* Editor */}
            <li>
              <NavLink
                to="/editor"
                className={({ isActive }) =>
                  `relative text-sm font-medium transition duration-300 ${
                    isActive
                      ? "text-emerald-400"
                      : "text-white hover:text-emerald-400"
                  }`
                }
              >
                {({ isActive }) => (
                  <span className="relative text-white">
                    Editor
                    {isActive && (
                      <span className="absolute -bottom-2 left-0 w-full h-[2px] bg-emerald-400 rounded"></span>
                    )}
                  </span>
                )}
              </NavLink>
            </li>

            {/* Gallery */}
            {user?.role === 'admin' && (
              <li>
                <NavLink
                  to="/gallery"
                  className={({ isActive }) =>
                    `relative text-sm font-medium transition duration-300 ${
                      isActive
                        ? "text-emerald-400"
                        : "text-white hover:text-emerald-400"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <span className="relative text-white">
                      Gallery
                      {isActive && (
                        <span className="absolute -bottom-2 left-0 w-full h-[2px] bg-emerald-400 rounded"></span>
                      )}
                    </span>
                  )}
                </NavLink>
              </li>
            )}

            {user && (
              <li>
                <NavLink
                  to="/profile"
                  className={({ isActive }) =>
                    `relative text-sm font-medium transition duration-300 ${
                      isActive
                        ? "text-emerald-400"
                        : "text-white hover:text-emerald-400"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <span className="relative text-white">
                      Profile
                      {isActive && (
                        <span className="absolute -bottom-2 left-0 w-full h-[2px] bg-emerald-400 rounded"></span>
                      )}
                    </span>
                  )}
                </NavLink>
              </li>
            )}

            {user?.role === "admin" && (
              <li>
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    `relative text-sm font-medium transition duration-300 ${
                      isActive
                        ? "text-emerald-400"
                        : "text-white hover:text-emerald-400"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <span className="relative text-white">
                      Admin
                      {isActive && (
                        <span className="absolute -bottom-2 left-0 w-full h-[2px] bg-emerald-400 rounded"></span>
                      )}
                    </span>
                  )}
                </NavLink>
              </li>
            )}

          </ul>

          {/* Auth Section */}
          {user ? (
            <div className="flex items-center gap-4 pl-6 border-l border-white/10">

              <div className="flex items-center gap-3 bg-white/10 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md hover:bg-white/20 transition">
                <img
                  src={user.avatar}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span className="text-sm font-medium text-white">
                  {user.username}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="text-sm font-medium px-5 py-2 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg hover:scale-105 hover:shadow-red-500/40 transition"
              >
                Logout
              </button>

            </div>
          ) : (
            <div className="flex items-center gap-4 pl-6 border-l border-white/10">

              <NavLink
                to="/login"
                className="text-sm font-medium text-white hover:text-emerald-400 transition"
              >
                Log in
              </NavLink>

              <NavLink
                to="/create-account"
                className="px-6 py-2 rounded-full text-sm font-medium text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:scale-105 shadow-xl hover:shadow-emerald-500/40 transition"
              >
                Sign Up
              </NavLink>

            </div>
          )}

        </div>
      </div>
    </nav>
  );
};

export default Navbar;