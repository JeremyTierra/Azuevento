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

// Request interceptor to add auth token and log requests
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

        // Log request for debugging
        if (__DEV__) {
            console.log(`🚀 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
            if (config.data) {
                console.log('📦 Request Body:', JSON.stringify(config.data, null, 2));
            }
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for logging and error handling
api.interceptors.response.use(
    (response) => {
        // Log successful response
        if (__DEV__) {
            console.log(`✅ ${response.status} ${response.config.url}`);
        }
        return response;
    },
    async (error: AxiosError<ApiError>) => {
        // Log error response
        if (__DEV__) {
            console.log(`❌ ${error.response?.status || 'Network Error'} ${error.config?.url}`);
            if (error.response?.data) {
                console.log('📛 Error:', JSON.stringify(error.response.data, null, 2));
            }
        }
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
