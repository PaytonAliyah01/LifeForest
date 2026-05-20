import { api } from '@/services/api';

export type Routine = {
  id: number;
  userId: number;
  title: string;
  description: string | null;
  completed: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type CreateRoutinePayload = {
  userId: number;
  routine: {
    title: string;
    description: string | null;
  };
};

type UpdateRoutinePayload = {
  title: string;
  description: string | null;
  completed: boolean;
};

export const getRoutinesByUser = async (userId: number): Promise<Routine[]> => {
  const response = await api.get<Routine[]>('/routines', {
    params: { userId },
  });

  return response.data;
};

export const createRoutine = async (payload: CreateRoutinePayload): Promise<Routine> => {
  const response = await api.post<Routine>('/routines', payload);
  return response.data;
};

export const updateRoutineById = async (
  id: number,
  payload: UpdateRoutinePayload,
): Promise<Routine> => {
  const response = await api.put<Routine>(`/routines/${id}`, payload);
  return response.data;
};

export const deleteRoutineById = async (id: number): Promise<void> => {
  await api.delete(`/routines/${id}`);
};

