import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

const AUTH_TOKEN_KEY = 'lifeforest_auth_token';

type AuthTokenPayload = {
  userId?: number;
};

export const saveToken = async (token: string): Promise<void> => {
  await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
};

export const getToken = async (): Promise<string | null> => {
  return AsyncStorage.getItem(AUTH_TOKEN_KEY);
};

export const getUserIdFromToken = async (): Promise<number | null> => {
  const token = await getToken();

  if (!token) {
    return null;
  }

  try {
    const decoded = jwtDecode<AuthTokenPayload>(token);
    const userId = decoded.userId;

    if (typeof userId !== 'number' || !Number.isInteger(userId) || userId <= 0) {
      return null;
    }

    return userId;
  } catch {
    return null;
  }
};

export const clearToken = async (): Promise<void> => {
  await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
};