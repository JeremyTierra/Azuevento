import api from './api';
import type { Comment } from '../types/models';

export const commentService = {
    // Get all comments for an event
    async getComments(eventId: number): Promise<Comment[]> {
        const response = await api.get(`/events/${eventId}/comments`);
        return response.data;
    },

    // Add a new comment to an event
    async addComment(eventId: number, content: string): Promise<Comment> {
        const response = await api.post(`/events/${eventId}/comments`, { content });
        return response.data;
    },

    // Delete a comment (only if user is the author)
    async deleteComment(commentId: number): Promise<void> {
        await api.delete(`/comments/${commentId}`);
    },
};
