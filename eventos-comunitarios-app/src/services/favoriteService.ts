import api from './api';
import type { Event } from '../types/models';

export const favoriteService = {
    // Get all favorite events for the current user
    async getUserFavorites(): Promise<Event[]> {
        const response = await api.get('/users/favorites');
        return response.data;
    },

    // Check if an event is favorite for the current user
    async checkIsFavorite(eventId: number): Promise<boolean> {
        const response = await api.get(`/events/${eventId}/favorite/check`);
        return response.data.isFavorite;
    },

    // Add event to favorites
    async addFavorite(eventId: number): Promise<void> {
        await api.post(`/events/${eventId}/favorite`);
    },

    // Remove event from favorites
    async removeFavorite(eventId: number): Promise<void> {
        await api.delete(`/events/${eventId}/favorite`);
    },

    // Toggle favorite status
    async toggleFavorite(eventId: number, currentlyFavorite: boolean): Promise<void> {
        if (currentlyFavorite) {
            await this.removeFavorite(eventId);
        } else {
            await this.addFavorite(eventId);
        }
    },
};
