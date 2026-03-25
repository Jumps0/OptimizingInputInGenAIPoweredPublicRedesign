// import { Mail } from "lucide-react";
import Logo from "../assets/logo3.png";

const Footer = () => {
  // const currentYear = new Date().getFullYear();

  return (
    <footer id="footer" className="bg-black text-gray-300 py-12 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-6 flex flex-col items-center justify-center gap-6">
        
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
            <img src={Logo} alt="Logo" className="w-28 h-20 object-contain" />
            <p className="text-center text-gray-400 max-w-md">
                Turning imagination into visual stories. The professional AI-powered platform for next-generation design and photo editing.
            </p>
        </div>

        {/* Email */}
        <div className="flex items-center gap-2 text-emerald-500">
          {/* <Mail size={18} className="text-emerald-500" /> */}
          <span>support@citizenredesign.com</span>
        </div>

        {/* Copyright */}
        {/* <div className="text-xs text-gray-500 mt-4">
            <p>&copy; {currentYear} Citizen Redesign. All rights reserved.</p>
        </div> */}

      </div>
    </footer>
  );
};

export default Footer;
