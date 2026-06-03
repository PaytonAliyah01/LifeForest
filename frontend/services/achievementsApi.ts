import { api } from '@/services/api';

export type Achievement = {
  code: string;
  category: string;
  title: string;
  description: string;
  currentValue: number;
  targetValue: number;
  unlocked: boolean;
  progressPercentage: number;
};

export type AchievementsSummary = {
  userId: number;
  unlockedCount: number;
  totalCount: number;
  achievements: Achievement[];
};

export const getAchievementsByUser = async (userId: number): Promise<AchievementsSummary> => {
  const response = await api.get<AchievementsSummary>('/achievements', {
    params: { userId },
  });

  return response.data;
};
