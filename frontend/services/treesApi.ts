import { api } from '@/services/api';
import type { TreeType } from '@/services/focusSessionsApi';

export type Tree = {
  id: number;
  userId: number;
  focusSessionId: number | null;
  species: string;
  treeType: TreeType;
  growthStage: number;
  growthProgress: number;
  damaged: boolean;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};

export const getTreesByUser = async (userId: number): Promise<Tree[]> => {
  const response = await api.get<Tree[]>('/trees', {
    params: { userId },
  });

  return response.data;
};

export const getTreeById = async (treeId: number): Promise<Tree> => {
  const response = await api.get<Tree>(`/trees/${treeId}`);
  return response.data;
};
