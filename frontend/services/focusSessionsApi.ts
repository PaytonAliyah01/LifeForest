import { api } from '@/services/api';

export type TreeType = 'MAPLE' | 'OAK' | 'BIRCH' | 'PINE' | 'CHERRY_BLOSSOM';

export type FocusSession = {
  id: number;
  startedAt: string;
  endedAt: string | null;
  duration: number | null;
  treeType: TreeType | null;
  completed: boolean;
  interrupted: boolean;
};

type StartFocusSessionPayload = {
  userId: number;
  taskId: number | null;
};

export const startFocusSession = async (
  payload: StartFocusSessionPayload,
): Promise<FocusSession> => {
  const response = await api.post<FocusSession>('/focus-sessions/start', payload);
  return response.data;
};

export const completeFocusSession = async (id: number): Promise<FocusSession> => {
  const response = await api.post<FocusSession>(`/focus-sessions/${id}/complete`);
  return response.data;
};

export const interruptFocusSession = async (id: number): Promise<FocusSession> => {
  const response = await api.post<FocusSession>(`/focus-sessions/${id}/interrupt`);
  return response.data;
};
