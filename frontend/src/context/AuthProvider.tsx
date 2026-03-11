import { useState, type ReactNode } from 'react';
import { fetchUsers, addUser } from '@/utils';
import { AVATARS } from '@/utils/constants';
import type { User } from '@/utils';
import { AuthContext } from './useAuth';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('citizen_user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  
  // Since we load from localStorage synchronously, we don't need a loading state for auth check
  const [isLoading] = useState(false);

  const login = async (username: string): Promise<boolean> => {
    try {
      // Check if it's a known user
      const users = await fetchUsers();
      const foundUser = users.find(u => u.username.toLowerCase() === username.toLowerCase());
      
      if (foundUser) {
        // Check if user should be admin based on new criteria
        // First avatar is AVATARS[0]
        const isAdmin = foundUser.avatar === AVATARS[0] && foundUser.username.toLowerCase() === 'salah';
        const role: 'admin' | 'user' = isAdmin ? 'admin' : 'user';
        
        const userToLogin = { ...foundUser, role };

        setUser(userToLogin);
        localStorage.setItem('citizen_user', JSON.stringify(userToLogin));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const signup = async (username: string, avatar: string, assignedMethod?: User['assignedMethod']): Promise<boolean> => {
    try {
      const users = await fetchUsers();
      
      // Check against existing users
      if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
          return false; // User already exists
      }
      
      // Assign method if not provided (fallback)
      const method = assignedMethod || 'text';

      // Admin Logic: First Avatar + Name 'salah'
      const isAdmin = avatar === AVATARS[0] && username.toLowerCase() === 'salah';

      const newUser: User = {
        id: Date.now(),
        username,
        avatar,
        assignedMethod: method,
        role: isAdmin ? 'admin' : 'user'
      };

      // Save to storage
      addUser(newUser);

      // Log them in
      setUser(newUser);
      localStorage.setItem('citizen_user', JSON.stringify(newUser));
      return true;
    } catch (error) {
      console.error('Signup error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('citizen_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
