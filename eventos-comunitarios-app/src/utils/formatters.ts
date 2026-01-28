import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Format a date string to a readable format
 * @param dateString ISO date string
 * @param formatString Format pattern (default: 'd MMM yyyy')
 * @returns Formatted date string
 */
export const formatDate = (dateString: string, formatString: string = 'd MMM yyyy'): string => {
    try {
        const date = parseISO(dateString);
        return format(date, formatString, { locale: es });
    } catch (error) {
        return dateString;
    }
};

/**
 * Format a date string to time only
 * @param dateString ISO date string
 * @returns Time string (e.g., "14:30")
 */
export const formatTime = (dateString: string): string => {
    try {
        const date = parseISO(dateString);
        return format(date, 'HH:mm', { locale: es });
    } catch (error) {
        return dateString;
    }
};

/**
 * Format a date string to a full datetime
 * @param dateString ISO date string
 * @returns Full datetime string (e.g., "15 Ene 2024, 14:30")
 */
export const formatDateTime = (dateString: string): string => {
    try {
        const date = parseISO(dateString);
        return format(date, "d MMM yyyy, HH:mm", { locale: es });
    } catch (error) {
        return dateString;
    }
};

/**
 * Get category icon name (for Ionicons)
 * @param categoryName Category name
 * @returns Ionicons icon name
 */
export const getCategoryIcon = (categoryName: string): string => {
    const icons: Record<string, string> = {
        'Deportes': 'football',
        'Música': 'musical-notes',
        'Arte': 'color-palette',
        'Tecnología': 'laptop',
        'Educación': 'school',
        'Gastronomía': 'restaurant',
        'Cultura': 'theater',
        'Negocios': 'briefcase',
        'Salud': 'fitness',
        'Otro': 'ellipsis-horizontal',
    };
    return icons[categoryName] || 'ellipsis-horizontal';
};
