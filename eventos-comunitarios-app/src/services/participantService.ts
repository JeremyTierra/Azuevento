import api from './api';
import { ENDPOINTS } from '../constants/api';
import type { AttendanceRequest } from '../types/models';

export const participantService = {
    /**
     * Register attendance for an event
     */
    async registerAttendance(eventId: number, status: AttendanceRequest['status'] = 'CONFIRMED') {
        await api.post(ENDPOINTS.ATTENDANCE(eventId), { status });
    },

    /**
     * Update attendance status
     */
    async updateAttendance(eventId: number, status: AttendanceRequest['status']) {
        await api.put(ENDPOINTS.ATTENDANCE(eventId), { status });
    },

    /**
     * Cancel attendance
     */
    async cancelAttendance(eventId: number) {
        await api.delete(ENDPOINTS.ATTENDANCE(eventId));
    },

    // ==================== QR Check-in Methods ====================

    /**
     * Get user's ticket (QR data) for an event
     */
    async getMyTicket(eventId: number) {
        const response = await api.get(ENDPOINTS.MY_TICKET(eventId));
        return response.data;
    },

    /**
     * Check-in a participant by QR token (organizer only)
     */
    async checkinParticipant(eventId: number, token: string) {
        const response = await api.post(ENDPOINTS.CHECKIN(eventId), { token });
        return response.data;
    },

    /**
     * Get attendance list for an event (organizer only)
     */
    async getAttendanceList(eventId: number) {
        const response = await api.get(ENDPOINTS.ATTENDANCE_LIST(eventId));
        return response.data;
    },
};
