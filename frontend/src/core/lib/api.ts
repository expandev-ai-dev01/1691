import axios, { AxiosInstance } from 'axios';

export const apiConfig = {
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  version: import.meta.env.VITE_API_VERSION || 'v1',
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),

  get externalUrl(): string {
    return `${this.baseUrl}/api/${this.version}/external`;
  },

  get internalUrl(): string {
    return `${this.baseUrl}/api/${this.version}/internal`;
  },
};

export const publicClient: AxiosInstance = axios.create({
  baseURL: apiConfig.externalUrl,
  timeout: apiConfig.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const authenticatedClient: AxiosInstance = axios.create({
  baseURL: apiConfig.internalUrl,
  timeout: apiConfig.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

authenticatedClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: unknown) => {
    return Promise.reject(error);
  }
);

authenticatedClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (typeof error === 'object' && error !== null && 'response' in error) {
      const axiosError = error as { response: { status: number } };
      if (axiosError.response?.status === 401) {
        localStorage.removeItem('auth_token');

        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);
