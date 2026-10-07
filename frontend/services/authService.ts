import { apiClient } from './api';

const TOKEN_KEY = 'token';

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

interface ApiEnvelope<T = undefined> {
  success: boolean;
  message: string;
  data?: T;
}

export const authService = {
  // Registrasi user baru -> POST /api/auth/register
  async register(payload: RegisterPayload): Promise<ApiEnvelope> {
    return apiClient<ApiEnvelope>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Login -> POST /api/auth/login, mengembalikan token JWT
  async login(payload: LoginPayload): Promise<string> {
    const response = await apiClient<ApiEnvelope<{ token: string }>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const token = response.data?.token;
    if (!token) {
      throw new Error('Token tidak diterima dari server.');
    }

    return token;
  },

  // Logout: cukup hapus token dari browser (JWT bersifat stateless)
  logout(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
  },

  saveToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  isAuthenticated(): boolean {
    return authService.getToken() !== null;
  },
};
