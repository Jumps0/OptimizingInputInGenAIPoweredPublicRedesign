import { useState, useEffect, type ReactNode } from 'react';
import { fetchUsers, addUser } from '@/utils';
import type { User } from '@/utils';
import { pickRandomAssignedMethod } from '@/utils/constants';
import { AuthContext } from './useAuth';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('citizen_user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  
  // Since we load from localStorage synchronously, we don't need a loading state for auth check
  const [isLoading] = useState(false);

  // Ensure admin usernames always have role admin (e.g. after policy change, without re-login).
  useEffect(() => {
    setUser((prev) => {
      if (!prev) return null;
      const lower = prev.username.toLowerCase();
      const shouldBeAdmin = lower === 'walid' || lower === 'shalah';
      if (shouldBeAdmin && prev.role !== 'admin') {
        const updated: User = { ...prev, role: 'admin' };
        localStorage.setItem('citizen_user', JSON.stringify(updated));
        return updated;
      }
      return prev;
    });
  }, []);

  const login = async (username: string): Promise<boolean> => {
    try {
      const normalizedUsername = username.trim();
      if (!normalizedUsername) return false;
      const lower = normalizedUsername.toLowerCase();
      /** Admin accounts (navbar shows Admin + full dashboard). */
      const isAdminUser = lower === 'walid' || lower === 'shalah';

      const users = await fetchUsers();
      const foundUser = users.find(u => u.username.toLowerCase() === normalizedUsername.toLowerCase());
      
      if (foundUser) {
        const userToLogin: User = {
          ...foundUser,
          role: isAdminUser ? 'admin' : (foundUser.role ?? 'user'),
        };
        setUser(userToLogin);
        localStorage.setItem('citizen_user', JSON.stringify(userToLogin));
        return true;
      }

      // Allow easy access: create a new account on first login for any username.
      const newUser: User = {
        id: Date.now(),
        username: normalizedUsername,
        assignedMethod: pickRandomAssignedMethod(),
        role: isAdminUser ? 'admin' : 'user',
      };
      addUser(newUser);
      setUser(newUser);
      localStorage.setItem('citizen_user', JSON.stringify(newUser));
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('citizen_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
