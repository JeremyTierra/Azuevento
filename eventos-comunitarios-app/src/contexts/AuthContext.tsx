import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/authService';
import { STORAGE_KEYS } from '../constants/api';
import type { User, AuthResponse, LoginRequest, RegisterRequest } from '../types/models';

interface AuthContextData {
    user: User | null;
    token: string | null;
    loading: boolean;
    signIn: (data: LoginRequest) => Promise<void>;
    signUp: (data: RegisterRequest) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Load stored auth data on app start
    useEffect(() => {
        loadStoredAuth();
    }, []);

    const loadStoredAuth = async () => {
        try {
            const [storedToken, storedUser] = await AsyncStorage.multiGet([
                STORAGE_KEYS.TOKEN,
                STORAGE_KEYS.USER,
            ]);

            const tokenValue = storedToken[1];
            const userValue = storedUser[1];

            if (tokenValue && userValue) {
                setToken(tokenValue);
                setUser(JSON.parse(userValue));
            }
        } catch (error) {
            console.error('Error loading auth data:', error);
        } finally {
            setLoading(false);
        }
    };

    const signIn = async (data: LoginRequest) => {
        try {
            const authResponse: AuthResponse = await authService.login(data);

            // Create user object from auth response
            const userData: User = {
                id: authResponse.userId,
                name: authResponse.name,
                email: authResponse.email,
                role: authResponse.role as 'USER' | 'ADMIN',
                registrationDate: new Date().toISOString(),
                active: true,
            };

            // Store in state
            setToken(authResponse.token);
            setUser(userData);

            // Persist to storage
            await AsyncStorage.multiSet([
                [STORAGE_KEYS.TOKEN, authResponse.token],
                [STORAGE_KEYS.USER, JSON.stringify(userData)],
            ]);
        } catch (error) {
            console.error('Sign in error:', error);
            throw error;
        }
    };

    const signUp = async (data: RegisterRequest) => {
        try {
            const authResponse: AuthResponse = await authService.register(data);

            // Create user object from auth response
            const userData: User = {
                id: authResponse.userId,
                name: authResponse.name,
                email: authResponse.email,
                role: authResponse.role as 'USER' | 'ADMIN',
                registrationDate: new Date().toISOString(),
                active: true,
            };

            // Store in state
            setToken(authResponse.token);
            setUser(userData);

            // Persist to storage
            await AsyncStorage.multiSet([
                [STORAGE_KEYS.TOKEN, authResponse.token],
                [STORAGE_KEYS.USER, JSON.stringify(userData)],
            ]);
        } catch (error) {
            console.error('Sign up error:', error);
            throw error;
        }
    };

    const signOut = async () => {
        try {
            // Clear state
            setUser(null);
            setToken(null);

            // Clear storage
            await AsyncStorage.multiRemove([STORAGE_KEYS.TOKEN, STORAGE_KEYS.USER]);
        } catch (error) {
            console.error('Sign out error:', error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                loading,
                signIn,
                signUp,
                signOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
