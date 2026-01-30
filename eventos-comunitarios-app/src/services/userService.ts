import api from './api';
import { User } from '../types/models';

export interface UpdateProfileData {
    name: string;
    email: string;
}

export interface UpdatePasswordData {
    currentPassword: string;
    newPassword: string;
}

const userService = {
    async getUserProfile(): Promise<User> {
        const response = await api.get<User>('/users/me');
        return response.data;
    },

    async updateProfile(data: UpdateProfileData): Promise<User> {
        const response = await api.put<User>('/users/me', data);
        return response.data;
    },

    async updatePassword(data: UpdatePasswordData): Promise<void> {
        await api.put('/users/me/password', data);
    },

    async deleteAccount(): Promise<void> {
        await api.delete('/users/me');
    },
};

export default userService;
