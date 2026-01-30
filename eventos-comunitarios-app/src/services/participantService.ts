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
};
