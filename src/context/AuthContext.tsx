import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, setAuthToken, getAuthToken } from '../services/api';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  is_verified: boolean;
  is_admin: boolean;
  wallet_balance: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (userData: any) => Promise<any>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = getAuthToken();
    if (token) {
      const response = await api.verifyToken();
      if (response.success) {
        setUser(response.data);
      } else {
        setAuthToken(null);
      }
    }
    setLoading(false);
  };

  const login = async (email: string, password: string) => {
    const response = await api.login(email, password);
    if (response.success) {
      setUser(response.data);
    }
    return response;
  };

  const register = async (userData: any) => {
    const response = await api.register(userData);
    if (response.success) {
      await checkAuth();
    }
    return response;
  };

  const logout = () => {
    api.logout();
    setUser(null);
    setAuthToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
