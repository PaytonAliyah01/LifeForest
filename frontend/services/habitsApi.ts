import { api } from '@/services/api';
import type { RepeatDay, TaskCategory } from '@/services/tasksApi';

export type TodayHabit = {
  taskId: number;
  routineId: number;
  routineTitle: string;
  title: string;
  description: string | null;
  duration: number | null;
  category: TaskCategory;
  repeatDays: RepeatDay[];
  preferredTime: string | null;
  completedToday: boolean;
  currentStreak: number;
  weeklyCompletionCount: number;
  recentCompletedDates: string[];
};

export const getTodayHabitsByUser = async (userId: number): Promise<TodayHabit[]> => {
  const response = await api.get<TodayHabit[]>('/habits/today', {
    params: { userId },
  });

  return response.data;
};

export const completeHabitToday = async (userId: number, taskId: number): Promise<TodayHabit> => {
  const response = await api.post<TodayHabit>(`/habits/${taskId}/today`, undefined, {
    params: { userId },
  });

  return response.data;
};

export const uncompleteHabitToday = async (userId: number, taskId: number): Promise<TodayHabit> => {
  const response = await api.delete<TodayHabit>(`/habits/${taskId}/today`, {
    params: { userId },
  });

  return response.data;
};
