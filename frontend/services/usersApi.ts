import { api } from '@/services/api';

export type User = {
  id: number;
  email: string;
  displayName: string;
  role: string;
  createdAt: string;
};

export const getUserById = async (id: number): Promise<User> => {
  const response = await api.get<User>(`/users/${id}`);
  return response.data;
};
