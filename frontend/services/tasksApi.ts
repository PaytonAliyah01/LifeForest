import { api } from '@/services/api';

export type TaskCategory = 'GENERAL' | 'WORK' | 'STUDY' | 'HEALTH' | 'CREATIVE';
export type TaskType = 'ONE_TIME' | 'REPEATING';
export type RepeatDay =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export type Task = {
  id: number;
  routineId: number;
  title: string;
  description: string | null;
  duration: number | null;
  category: TaskCategory;
  taskType: TaskType;
  repeatDays: RepeatDay[];
  preferredTime: string | null;
  completed: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type CreateTaskPayload = {
  routineId: number;
  task: {
    title: string;
    description: string | null;
    duration: number | null;
    category: TaskCategory;
    taskType: TaskType;
    repeatDays: RepeatDay[];
    preferredTime: string | null;
  };
};

type UpdateTaskPayload = {
  title: string;
  description: string | null;
  duration: number | null;
  category: TaskCategory;
  taskType: TaskType;
  repeatDays: RepeatDay[];
  preferredTime: string | null;
  completed: boolean;
};

export const getTasksByRoutine = async (routineId: number): Promise<Task[]> => {
  const response = await api.get<Task[]>(`/routines/${routineId}/tasks`);
  return response.data;
};

export const createTask = async (payload: CreateTaskPayload): Promise<Task> => {
  const response = await api.post<Task>('/tasks', payload);
  return response.data;
};

export const updateTaskById = async (
  routineId: number,
  taskId: number,
  payload: UpdateTaskPayload,
): Promise<Task> => {
  const response = await api.put<Task>(`/routines/${routineId}/tasks/${taskId}`, payload);
  return response.data;
};

export const deleteTaskById = async (routineId: number, taskId: number): Promise<void> => {
  await api.delete(`/routines/${routineId}/tasks/${taskId}`);
};
