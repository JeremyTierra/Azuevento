import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, STORAGE_KEYS } from '../constants/api';
import type { ApiError } from '../types/models';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    async (config) => {
        try {
            const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
            if (token && config.headers) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('Error getting token from storage:', error);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for  error handling  
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ApiError>) => {
        // Handle 401 Unauthorized (token expired/invalid)
        if (error.response?.status === 401) {
            // Clear stored auth data
            await AsyncStorage.multiRemove([STORAGE_KEYS.TOKEN, STORAGE_KEYS.USER]);
            // TODO: Navigate to login screen
            // This will be handled by AuthContext
        }

        // Format error message
        const errorMessage = error.response?.data?.message || error.message || 'An error occurred';

        return Promise.reject({
            message: errorMessage,
            status: error.response?.status,
            data: error.response?.data,
        });
    }
);

export default api;
