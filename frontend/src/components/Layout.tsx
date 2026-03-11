import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import BottomNav from "./BottomNav";

const Layout = () => {
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const isEditorPage = location.pathname === "/editor";

  return (
    <div className={`${isEditorPage ? "h-screen overflow-hidden" : "min-h-screen"} flex flex-col bg-white text-gray-900 pb-16 md:pb-0`}>

      {/* Navbar Wrapper - Sticky */}
      <div className={isHomePage ? "hidden md:block bg-black" : "hidden md:block bg-white "}>
        <Navbar />
      </div>

      {/* Main Content */}
      <main 
        className={`flex-1 w-full ${
          isHomePage 
            ? "" // Full width for Home
            : isEditorPage 
              ? "bg-gray-50 overflow-hidden flex flex-col" // Full width/height for Editor
              : "max-w-md mx-auto md:max-w-7xl md:container md:p-4 bg-white md:bg-transparent" // Constrained for others
        }`}
      >
        <Outlet />
      </main>

      {/* Footer */}
      {!isEditorPage && (
        <div className="hidden md:block">
          <Footer />
        </div>
      )}
   

      <div className="md:hidden">
        <BottomNav />
      </div>

    </div>
  );
};

export default Layout;
