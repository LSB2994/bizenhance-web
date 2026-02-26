'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import type { AuthUserDTO, ApiResponse, AuthResponse, CurrentUserDTO } from '@/lib/types';

interface AuthContextType {
    user: AuthUserDTO | null;
    currentUser: CurrentUserDTO | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshCurrentUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUserDTO | null>(null);
    const [currentUser, setCurrentUser] = useState<CurrentUserDTO | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    const refreshCurrentUser = useCallback(async () => {
        try {
            const { data } = await api.get<ApiResponse<CurrentUserDTO>>('/api/auth/profile');
            setCurrentUser(data.payload);
        } catch {
            // silently fail
        }
    }, []);

    // Hydrate auth state from localStorage
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
            try {
                setUser(JSON.parse(storedUser));
                refreshCurrentUser();
            } catch {
                localStorage.clear();
            }
        }
        setIsLoading(false);
    }, [refreshCurrentUser]);

    const login = async (username: string, password: string) => {
        const { data } = await api.post<ApiResponse<AuthResponse>>('/api/auth/login', {
            username,
            password,
        });

        const { accessToken, refreshToken, user: authUser } = data.payload;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(authUser));
        setUser(authUser);

        await refreshCurrentUser();
        router.push('/dashboard');
    };

    const logout = async () => {
        try {
            await api.post('/api/auth/logout');
        } catch {
            // ignore error, clear anyway
        } finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            setUser(null);
            setCurrentUser(null);
            router.push('/login');
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                currentUser,
                isLoading,
                isAuthenticated: !!user,
                login,
                logout,
                refreshCurrentUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
