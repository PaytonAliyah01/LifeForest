import { api } from '@/services/api';

export type Reflection = {
  id: number;
  userId: number;
  focusSessionId: number | null;
  content: string;
  focusLevel: number;
  distractions: string | null;
  createdAt: string;
  updatedAt: string;
};

type CreateReflectionPayload = {
  userId: number;
  focusSessionId: number;
  content: string;
  focusLevel: number;
  distractions: string;
};

export const createReflection = async (payload: CreateReflectionPayload): Promise<Reflection> => {
  const response = await api.post<Reflection>('/reflections', payload);
  return response.data;
};

export const getReflectionById = async (reflectionId: number): Promise<Reflection> => {
  const response = await api.get<Reflection>(`/reflections/${reflectionId}`);
  return response.data;
};

export const getReflectionByFocusSession = async (
  focusSessionId: number,
): Promise<Reflection | null> => {
  const response = await api.get<Reflection[]>('/reflections', {
    params: { focusSessionId },
  });

  return response.data[0] ?? null;
};
