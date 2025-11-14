// Type definitions for Azuevento backend API

export interface User {
    id: number;
    name: string;
    email: string;
    role: 'USER' | 'ADMIN';
    phone?: string;
    profilePicture?: string;
    description?: string;
    registrationDate: string;
    active: boolean;
}

export interface AuthResponse {
    token: string;
    userId: number;
    name: string;
    email: string;
    role: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    name: string;
    email: string;
    password: string;
}

export interface Event {
    id: number;
    title: string;
    description: string;
    categoryId: number;
    categoryName: string;
    organizerId: number;
    organizerName: string;
    startDate: string;
    endDate: string;
    location: string;
    latitude?: number;
    longitude?: number;
    maxCapacity?: number;
    coverImage?: string;
    visibility: 'PUBLIC' | 'PRIVATE';
    status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'ARCHIVED';
    createdAt: string;
    updatedAt: string;
    deletedAt?: string;
    participantCount: number;
    commentCount: number;
    averageRating?: number;
    ratingCount: number;
    favoriteCount: number;
    isOrganizer: boolean;
    hasUserRegistered: boolean;
    isFavorite: boolean;
}

export interface EventRequest {
    title: string;
    description: string;
    categoryId: number;
    startDate: string;
    endDate: string;
    location: string;
    latitude?: number;
    longitude?: number;
    maxCapacity?: number;
    coverImage?: string;
    visibility: 'PUBLIC' | 'PRIVATE';
}

export interface Category {
    id: number;
    name: string;
    description?: string;
    icon?: string;
}

export interface Comment {
    id: number;
    eventId: number;
    userId: number;
    userName: string;
    userProfilePicture?: string;
    content: string;
    createdAt: string;
    isOwner: boolean;
}

export interface CommentRequest {
    content: string;
}

export interface Rating {
    id: number;
    eventId: number;
    userId: number;
    userName: string;
    score: number;
    comment?: string;
    createdAt: string;
}

export interface RatingRequest {
    score: number;
    comment?: string;
}

export interface AttendanceRequest {
    status: 'CONFIRMED' | 'CANCELLED' | 'ATTENDED' | 'NOT_ATTENDED';
}

export interface ApiError {
    timestamp: string;
    status: number;
    error: string;
    message: string;
    path: string;
}
