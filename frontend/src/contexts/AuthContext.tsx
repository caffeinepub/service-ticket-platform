import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { UserRole } from '../backend';

export interface AuthUser {
    name: string;
    email: string;
    role: UserRole;
}

interface AuthContextType {
    user: AuthUser | null;
    login: (user: AuthUser) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(() => {
        try {
            const stored = sessionStorage.getItem('auth_user');
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });

    const login = useCallback((authUser: AuthUser) => {
        setUser(authUser);
        sessionStorage.setItem('auth_user', JSON.stringify(authUser));
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        sessionStorage.removeItem('auth_user');
    }, []);

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
