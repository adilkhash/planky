import api from './api';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  password_confirm: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

interface AuthResponse {
  access: string;
  refresh: string;
}

interface UserResponse {
  id: number;
  email: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  auth_provider: string;
}

// storage keys
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const REMEMBER_ME_KEY = 'rememberMe';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post('/auth/login/', credentials);
    return response.data;
  },

  async register(data: RegisterData): Promise<{ user: UserResponse; tokens: AuthResponse }> {
    const response = await api.post('/auth/register/', data);
    return response.data;
  },

  async logout(refreshToken: string): Promise<void> {
    await api.post('/auth/logout/', { refresh: refreshToken });
  },

  async getCurrentUser(): Promise<UserResponse> {
    const response = await api.get('/auth/me/');
    return response.data;
  },

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await api.post('/auth/token/refresh/', { refresh: refreshToken });
    return response.data;
  },

  saveTokens(tokens: AuthResponse, rememberMe = false): void {
    const storage = rememberMe ? localStorage : sessionStorage;

    // Save tokens in the appropriate storage
    storage.setItem(ACCESS_TOKEN_KEY, tokens.access);
    storage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);

    // Save the remember me preference
    localStorage.setItem(REMEMBER_ME_KEY, rememberMe.toString());
  },

  clearTokens(): void {
    // Clear from both storage types to be safe
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);

    // Keep the remember me preference
  },

  getAccessToken(): string | null {
    // Check if token is in localStorage (remember me was true)
    const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === 'true';

    // Try to get from the appropriate storage first
    const storage = rememberMe ? localStorage : sessionStorage;
    let token = storage.getItem(ACCESS_TOKEN_KEY);

    // If not found in the expected storage, try the other one
    if (!token) {
      const altStorage = rememberMe ? sessionStorage : localStorage;
      token = altStorage.getItem(ACCESS_TOKEN_KEY);
    }

    return token;
  },

  getRefreshToken(): string | null {
    // Check if token is in localStorage (remember me was true)
    const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === 'true';

    // Try to get from the appropriate storage first
    const storage = rememberMe ? localStorage : sessionStorage;
    let token = storage.getItem(REFRESH_TOKEN_KEY);

    // If not found in the expected storage, try the other one
    if (!token) {
      const altStorage = rememberMe ? sessionStorage : localStorage;
      token = altStorage.getItem(REFRESH_TOKEN_KEY);
    }

    return token;
  },

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  },

  getRememberMePreference(): boolean {
    return localStorage.getItem(REMEMBER_ME_KEY) === 'true';
  },
};
