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

  saveTokens(tokens: AuthResponse): void {
    localStorage.setItem('accessToken', tokens.access);
    localStorage.setItem('refreshToken', tokens.refresh);
  },

  clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  },

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  },

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  },
};
