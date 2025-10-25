import { Platform } from 'react-native';

// API Base URL configuration
// IMPORTANTE: Estás usando DISPOSITIVO REAL (no emulator)
// Tu máquina y celular deben estar en la MISMA RED WiFi
export const getApiUrl = () => {
    if (__DEV__) {
        // Development
        // REEMPLAZA CON TU IP LOCAL (ipconfig en Windows)
        const LOCAL_IP = '192.168.18.203'; // ⚠️ Cambia esto si tu IP es diferente

        // Para DISPOSITIVO REAL (Android y iOS)
        return `http://${LOCAL_IP}:8080/api`;

        // Para Android EMULATOR, descomentar:
        // if (Platform.OS === 'android') {
        //     return 'http://10.0.2.2:8080/api';
        // }
        // Para iOS SIMULATOR, descomentar:
        // return 'http://localhost:8080/api';
    }
    // Production - reemplazar con URL real
    return 'https://api.azuevento.com/api';
};

export const API_URL = getApiUrl();

// AsyncStorage keys
export const STORAGE_KEYS = {
    TOKEN: '@azuevento:token',
    USER: '@azuevento:user',
} as const;

// API Endpoints
export const ENDPOINTS = {
    // Auth
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',

    // Events
    EVENTS: '/events',
    EVENT_DETAIL: (id: number) => `/events/${id}`,
    EVENT_PUBLISH: (id: number) => `/events/${id}/publish`,
    EVENT_CANCEL: (id: number) => `/events/${id}/cancel`,
    EVENT_ARCHIVE: (id: number) => `/events/${id}/archive`,
    EVENT_SEARCH: '/events/search',
    MY_EVENTS: '/events/my-events',

    // Categories
    CATEGORIES: '/categories',

    // Participants
    ATTENDANCE: (eventId: number) => `/events/${eventId}/attendance`,

    // Comments
    COMMENTS: (eventId: number) => `/events/${eventId}/comments`,
    COMMENT_DETAIL: (eventId: number, commentId: number) =>
        `/events/${eventId}/comments/${commentId}`,

    // Ratings
    RATINGS: (eventId: number) => `/events/${eventId}/ratings`,
    RATING_AVERAGE: (eventId: number) => `/events/${eventId}/ratings/average`,

    // Favorites
    FAVORITE: (eventId: number) => `/events/${eventId}/favorite`,
    MY_FAVORITES: '/users/favorites',
    IS_FAVORITE: (eventId: number) => `/events/${eventId}/favorite/status`,
} as const;
