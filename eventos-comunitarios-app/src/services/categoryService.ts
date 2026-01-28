import api from './api';
import { ENDPOINTS } from '../constants/api';
import type { Category } from '../types/models';

export const categoryService = {
    /**
     * Get all categories
     */
    async getAll(): Promise<Category[]> {
        const response = await api.get<Category[]>(ENDPOINTS.CATEGORIES);
        return response.data;
    },
};
