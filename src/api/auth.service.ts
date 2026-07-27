import { api } from './axios';
import type { AuthResponse } from '../types'; // <-- Agrega 'type' aquí

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/usuarios/login', { email, password });
    return response.data;
  },
};