'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/axiosInstance';

interface User {
  username: string;
  id: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string, userData: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const savedUser = localStorage.getItem('username');
      const savedId = localStorage.getItem('user_id');

      if (token && savedUser && savedId) {
        // Fast path: Load from storage immediately
        setUser({ username: savedUser, id: savedId });
      } else if (token) {
        // Slow path: Token exists but user data is missing (e.g., OAuth)
        // Verify with API
        const response = await api.get('/auth/user/');
        const newData = { 
          username: response.data.username || 'User', 
          id: response.data.pk || response.data.id 
        };
        setUser(newData);
        // Sync storage
        localStorage.setItem('username', newData.username);
        localStorage.setItem('user_id', newData.id);
      }
    } catch (error) {
      console.error("Session restoration failed", error);
      // Token likely invalid
      logout(false); 
    } finally {
      setIsLoading(false);
    }
  };

  const login = (token: string, userData: any) => {
    localStorage.setItem('auth_token', token);
    
    // Normalize user data (handle different API responses)
    const username = userData.username || userData.user?.username || 'User';
    const id = userData.user_id || userData.pk || userData.id || '0';

    localStorage.setItem('username', username);
    localStorage.setItem('user_id', id);

    setUser({ username, id });
    router.push('/'); // Centralized redirect
  };

  const logout = (shouldRedirect = true) => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('username');
    setUser(null);
    if (shouldRedirect) {
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom Hook for easy access
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}