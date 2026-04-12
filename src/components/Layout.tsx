import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import BottomNav from "./BottomNav";

const Layout = () => {
  const location = useLocation();
  const isEditorPage = location.pathname === "/editor";
  const isPostStudyPage = location.pathname === "/post-study-form";
  const isWelcomePage = location.pathname === "/welcome";
  const hideNavigationChrome = isPostStudyPage || isWelcomePage;

  return (
    <div className={`${isEditorPage ? "h-[50dvh] overflow-hidden" : "min-h-screen"} flex flex-col bg-white text-gray-900`}>

      {!hideNavigationChrome && (
        <>
          <div className="hidden md:block bg-white border-b border-gray-100">
            <Navbar />
          </div>
          <BottomNav />
        </>
      )}

      <main 
        className={`flex-1 w-full ${
          isEditorPage 
              ? "bg-gray-50 overflow-hidden flex flex-col" // Full width/height for Editor
              : "max-w-6xl mx-auto w-full px-3 md:px-4 bg-white md:bg-transparent" // Constrained for others
        }`}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
