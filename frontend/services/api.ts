// services/api.ts
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import axios from "axios";
import { getToken } from '@/services/authStorage';

const BACKEND_URL_FROM_ENV = process.env.EXPO_PUBLIC_API_URL?.trim() || undefined;

const getExpoHost = (): string | null => {
  const hostUri = Constants.expoConfig?.hostUri?.trim();

  if (!hostUri) {
    try {
      const linkingUrl = Linking.createURL('');
      const parsedUrl = new URL(linkingUrl);
      return parsedUrl.hostname || null;
    } catch {
      return null;
    }
  }

  try {
    return new URL(hostUri.includes('://') ? hostUri : `http://${hostUri}`).hostname;
  } catch {
    return null;
  }
};

const defaultBackendUrl = (): string => {
  const expoHost = getExpoHost();

  if (expoHost && expoHost !== 'localhost') {
    return `http://${expoHost}:8080/api`;
  }

  return 'http://localhost:8080/api';
};

const getBackendURL = (): string => {
  return BACKEND_URL_FROM_ENV ?? defaultBackendUrl();
};

export const api = axios.create({
  baseURL: getBackendURL(),
  timeout: 5000,
});

api.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);