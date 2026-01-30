import api from './api';
import { ENDPOINTS } from '../constants/api';
import type { Event, EventRequest } from '../types/models';

export const eventService = {
    /**
     * Get all public published events
     */
    async getAll(): Promise<Event[]> {
        const response = await api.get<Event[]>(ENDPOINTS.EVENTS);
        return response.data;
    },

    /**
     * Get event by ID
     */
    async getById(id: number): Promise<Event> {
        const response = await api.get<Event>(ENDPOINTS.EVENT_DETAIL(id));
        return response.data;
    },

    /**
     * Search events with filters
     */
    async search(params: {
        query?: string;
        categoryId?: number;
        startDate?: string;
        endDate?: string;
    }): Promise<Event[]> {
        const response = await api.get<Event[]>(ENDPOINTS.EVENT_SEARCH, { params });
        return response.data;
    },

    /**
     * Get events organized by current user
     */
    async getMyEvents(): Promise<Event[]> {
        const response = await api.get<Event[]>(ENDPOINTS.MY_EVENTS);
        return response.data;
    },

    /**
     * Get events the user is attending (registered as participant)
     */
    async getAttendingEvents(): Promise<Event[]> {
        const response = await api.get<Event[]>(ENDPOINTS.ATTENDING_EVENTS);
        return response.data;
    },

    /**
     * Create a new event
     */
    async create(data: EventRequest): Promise<Event> {
        const response = await api.post<Event>(ENDPOINTS.EVENTS, data);
        return response.data;
    },

    /**
     * Update an existing event
     */
    async update(id: number, data: Partial<EventRequest>): Promise<Event> {
        const response = await api.put<Event>(ENDPOINTS.EVENT_DETAIL(id), data);
        return response.data;
    },

    /**
     * Delete an event (soft delete)
     */
    async delete(id: number): Promise<void> {
        await api.delete(ENDPOINTS.EVENT_DETAIL(id));
    },

    /**
     * Publish a draft event
     */
    async publish(id: number): Promise<Event> {
        const response = await api.post<Event>(ENDPOINTS.EVENT_PUBLISH(id));
        return response.data;
    },

    /**
     * Cancel an event
     */
    async cancel(id: number): Promise<Event> {
        const response = await api.post<Event>(ENDPOINTS.EVENT_CANCEL(id));
        return response.data;
    },

    /**
     * Archive an event
     */
    async archive(id: number): Promise<Event> {
        const response = await api.post<Event>(ENDPOINTS.EVENT_ARCHIVE(id));
        return response.data;
    },
};
