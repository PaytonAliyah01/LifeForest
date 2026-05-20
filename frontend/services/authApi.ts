import { api } from '@/services/api';

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  tokenType: string;
};

export type RegisterRequest = {
  email: string;
  password: string;
  displayName: string;
};

export const login = async (payload: LoginRequest): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>('/auth/login', payload);
  return response.data;
};

export const register = async (payload: RegisterRequest): Promise<void> => {
  await api.post('/users', payload);
};
