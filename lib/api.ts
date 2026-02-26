import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse, AuthResponse } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://renata-probeable-iesha.ngrok-free.dev/pos-api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
    },
    timeout: 15000,
});

// ── Request interceptor: attach JWT ──
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('accessToken');
            if (token && config.headers) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error),
);

// ── Response interceptor: auto-refresh on 401 ──
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
    refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
    refreshSubscribers.forEach((cb) => cb(token));
    refreshSubscribers = [];
}

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve) => {
                    subscribeTokenRefresh((token: string) => {
                        if (originalRequest.headers) {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                        }
                        resolve(api(originalRequest));
                    });
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (!refreshToken) throw new Error('No refresh token');

                const { data } = await axios.post<ApiResponse<AuthResponse>>(
                    `${API_BASE_URL}/api/auth/refresh`,
                    { refreshToken },
                );

                const newToken = data.payload.accessToken;
                localStorage.setItem('accessToken', newToken);
                localStorage.setItem('refreshToken', data.payload.refreshToken);

                onRefreshed(newToken);
                isRefreshing = false;

                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                }
                return api(originalRequest);
            } catch {
                isRefreshing = false;
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                if (typeof window !== 'undefined') {
                    window.location.href = '/login';
                }
                return Promise.reject(error);
            }
        }

        return Promise.reject(error);
    },
);

export default api;
