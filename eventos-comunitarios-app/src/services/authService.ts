import api from './api';
import { ENDPOINTS } from '../constants/api';
import type { AuthResponse, LoginRequest, RegisterRequest } from '../types/models';

export const authService = {
    /**
     * Register a new user
     */
    async register(data: RegisterRequest): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>(ENDPOINTS.REGISTER, data);
        return response.data;
    },

    /**
     * Login with email and password
     */
    async login(data: LoginRequest): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>(ENDPOINTS.LOGIN, data);
        return response.data;
    },
};
