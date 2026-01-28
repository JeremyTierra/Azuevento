import api from './api';
import type { Rating } from '../types/models';

export const ratingService = {
    // Get all ratings for an event
    async getRatings(eventId: number): Promise<Rating[]> {
        const response = await api.get(`/events/${eventId}/ratings`);
        return response.data;
    },

    // Add or update rating for an event
    async addRating(eventId: number, score: number): Promise<Rating> {
        const response = await api.post(`/events/${eventId}/ratings`, { score });
        return response.data;
    },

    // Get average rating for an event
    async getAverageRating(eventId: number): Promise<number> {
        const ratings = await this.getRatings(eventId);
        if (ratings.length === 0) return 0;
        const sum = ratings.reduce((acc, rating) => acc + rating.score, 0);
        return sum / ratings.length;
    },
};
