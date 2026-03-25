import { Link, useLocation } from 'react-router-dom';
import { Home, PlusSquare, User } from 'lucide-react';

const BottomNav = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 px-6 flex justify-between items-center z-50 md:hidden">
      <Link to="/gallery" className={`flex flex-col items-center gap-1 ${isActive('/gallery') ? 'text-black' : 'text-gray-400'}`}>
        <Home size={24} strokeWidth={isActive('/gallery') ? 2.5 : 2} />
        <span className="text-[10px] font-medium">Feed</span>
      </Link>
      
      <Link to="/editor" className={`flex flex-col items-center gap-1 ${isActive('/editor') ? 'text-black' : 'text-gray-400'}`}>
        <PlusSquare size={24} strokeWidth={isActive('/editor') ? 2.5 : 2} />
        <span className="text-[10px] font-medium">Studio</span>
      </Link>
      
      <Link to="/profile" className={`flex flex-col items-center gap-1 ${isActive('/profile') ? 'text-black' : 'text-gray-400'}`}>
        <User size={24} strokeWidth={isActive('/profile') ? 2.5 : 2} />
        <span className="text-[10px] font-medium">Profile</span>
      </Link>
    </div>
  );
};

export default BottomNav;
