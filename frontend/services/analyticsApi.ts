import { api } from '@/services/api';

export type Analytics = {
  userId: number;
  totalSessions: number;
  completedSessions: number;
  interruptedSessions: number;
  completionRate: number;
  totalFocusMinutes: number;
  completedFocusMinutes: number;
  weeklyFocusMinutes: number;
  estimatedTaskMinutes: number;
  actualTaskMinutes: number;
  estimationAccuracyPercentage: number;
  averageSessionMinutes: number;
  averageFocusLevel: number;
  reflectionsCount: number;
  treesGrown: number;
  completedTrees: number;
  damagedTrees: number;
  productivityScore: number;
};

export const getAnalyticsByUser = async (userId: number): Promise<Analytics> => {
  const response = await api.get<Analytics>('/analytics', {
    params: { userId },
  });

  return response.data;
};
