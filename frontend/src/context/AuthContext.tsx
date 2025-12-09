import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { setAuthToken } from '../api/client';

export type User = {
  userId: string;
  email: string;
  name: string;
  gradeLevel: number;
  provider?: string;
  phone?: string | null;
  dateOfBirth?: string | null;
  avatarBase64?: string | null;
};

type AuthContextValue = {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('mathkid_token'));
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem('mathkid_user');
    return raw ? (JSON.parse(raw) as User) : null;
  });

  useEffect(() => {
    setAuthToken(token || undefined);
  }, [token]);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('mathkid_token', newToken);
    localStorage.setItem('mathkid_user', JSON.stringify(newUser));
    setAuthToken(newToken);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('mathkid_token');
    localStorage.removeItem('mathkid_user');
    setAuthToken(undefined);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
