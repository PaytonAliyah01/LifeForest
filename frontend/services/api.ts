// services/api.ts
import axios from "axios";
import { getToken } from '@/services/authStorage';

const BACKEND_URL_FROM_ENV = process.env.EXPO_PUBLIC_API_URL?.trim();

const defaultBackendUrl = (): string => "http://145.220.72.98:8080/api";

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