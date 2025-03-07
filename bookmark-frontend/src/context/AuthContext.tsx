import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';

// Define the User type
interface User {
  id: string;
  email: string;
  username?: string;
}

// Define the context type
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  register: (email: string, username: string, password: string, password_confirm: string) => Promise<void>;
  logout: () => void;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

// Create a provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          const response = await api.get('/auth/me/');
          setUser(response.data);
          setIsAuthenticated(true);
        } catch (err) {
          // Clear invalid tokens
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
        }
      }
      
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string, remember = false) => {
    setError(null);
    try {
      const response = await api.post('/auth/login/', { email, password });
      const { access, refresh, user: userData } = response.data;
      
      localStorage.setItem('token', access);
      
      // Only store refresh token if remember me is checked
      if (remember) {
        localStorage.setItem('refreshToken', refresh);
      }
      
      setUser(userData);
      setIsAuthenticated(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to login');
      throw err;
    }
  };

  // Register function
  const register = async (email: string, username: string, password: string, password_confirm: string) => {
    setError(null);
    try {
      await api.post('/auth/register/', { email, username, password, password_confirm});
      // Automatically login after successful registration
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to register');
      throw err;
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        error,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Create a hook for using the auth context
export const useAuth = () => useContext(AuthContext);