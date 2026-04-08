import { useState, useEffect, type ReactNode } from 'react';
import { addUser } from '@/utils';
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

  const login = async (username: string): Promise<User | null> => {
    try {
      const normalizedUsername = username.trim();
      if (!normalizedUsername) return null;
      const lower = normalizedUsername.toLowerCase();
      /** Admin accounts (navbar shows Admin + full dashboard). */
      const isAdminUser = lower === 'walid' || lower === 'shalah';

      const usersResponse = await fetch('/api/users', { method: 'GET' });
      if (!usersResponse.ok) {
        throw new Error('Failed to reach users registry');
      }

      const usersPayload = (await usersResponse.json()) as { users?: User[] };
      const users = Array.isArray(usersPayload.users) ? usersPayload.users : [];
      const foundUser = users.find(u => u.username.toLowerCase() === lower);

      // Admin bypass with fetch-first registry reconciliation.
      if (isAdminUser) {
        const adminUser: User = foundUser
          ? {
              ...foundUser,
              role: 'admin',
            }
          : {
              id: Date.now(),
              username: lower,
              assignedMethod: pickRandomAssignedMethod(),
              role: 'admin',
            };

        try {
          if (!foundUser || foundUser.role !== 'admin') {
            await addUser(adminUser);
          }
        } catch (error) {
          console.warn('Failed to sync admin user to blob; continuing with local session.', error);
        }

        setUser(adminUser);
        localStorage.setItem('citizen_user', JSON.stringify(adminUser));
        return adminUser;
      }
      
      if (foundUser) {
        const userToLogin: User = {
          ...foundUser,
          role: foundUser.role ?? 'user',
        };
        setUser(userToLogin);
        localStorage.setItem('citizen_user', JSON.stringify(userToLogin));
        return userToLogin;
      }

      // Non-admin users must already exist in blob registry.
      return null;
    } catch (error) {
      console.error('Login error:', error);
      return null;
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
