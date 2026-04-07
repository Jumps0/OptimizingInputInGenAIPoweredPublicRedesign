import { createContext, useContext } from 'react';
import type { User } from '@/utils';

export interface AuthContextType {
  user: User | null;
  login: (username: string) => Promise<User | null>;
  logout: () => void;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
