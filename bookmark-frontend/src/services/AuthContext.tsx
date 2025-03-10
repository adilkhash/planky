import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/authService';

interface User {
  id: number;
  email: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  auth_provider: string;
}

interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface RegisterData {
  email: string;
  username?: string;
  password: string;
  password_confirm: string;
  first_name?: string;
  last_name?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      if (authService.isAuthenticated()) {
        try {
          const user = await authService.getCurrentUser();
          setUser(user);
        } catch (error) {
          console.error('Failed to get current user:', error);
          authService.clearTokens();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async ({ email, password, rememberMe = false }: LoginCredentials) => {
    setLoading(true);
    setError(null);

    try {
      const tokens = await authService.login({ email, password });

      // Save tokens (with remember me setting)
      authService.saveTokens(tokens, rememberMe);

      const user = await authService.getCurrentUser();
      setUser(user);
    } catch (error: any) {
      console.error('Login failed:', error);

      if (error.response?.status === 401) {
        setError('Invalid email or password. Please try again.');
      } else if (error.response?.data) {
        const errorMsg = typeof error.response.data === 'object'
          ? Object.values(error.response.data).flat().join(' ')
          : error.response.data;
        setError(`Login failed: ${errorMsg}`);
      } else if (error.message) {
        setError(`Login failed: ${error.message}`);
      } else {
        setError('Login failed. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await authService.register(data);
      authService.saveTokens(response.tokens);
      setUser(response.user);
    } catch (error: any) {
      console.error('Registration failed:', error);

      if (error.response?.data) {
        // Format error messages from API response
        const errorData = error.response.data;
        if (typeof errorData === 'object') {
          const errorMessages = Object.entries(errorData)
            .map(([key, value]) => {
              const fieldName = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
              return `${fieldName}: ${Array.isArray(value) ? value.join(', ') : value}`;
            })
            .join('\n');
          setError(errorMessages);
        } else {
          setError(`Registration failed: ${errorData}`);
        }
      } else if (error.message) {
        setError(`Registration failed: ${error.message}`);
      } else {
        setError('Registration failed. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    setError(null);

    try {
      const refreshToken = authService.getRefreshToken();
      if (refreshToken) {
        try {
          await authService.logout(refreshToken);
        } catch (error) {
          // Log the error but continue with local cleanup
          console.error('Logout request failed:', error);
        }
      }
    } finally {
      // Always clear local tokens and state
      authService.clearTokens();
      setUser(null);
      setLoading(false);
      // Navigate to login page is handled by the component
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        user,
        login,
        register,
        logout,
        loading,
        error,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
