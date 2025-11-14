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
        // Deportes y actividades físicas
        'Deportes': 'football-outline',
        'Fútbol': 'football-outline',
        'Baloncesto': 'basketball-outline',
        'Tenis': 'tennisball-outline',
        'Natación': 'water-outline',
        'Ciclismo': 'bicycle-outline',
        'Running': 'walk-outline',
        'Fitness': 'barbell-outline',

        // Arte y cultura
        'Música': 'musical-notes-outline',
        'Conciertos': 'musical-notes-outline',
        'Arte': 'color-palette-outline',
        'Teatro': 'film-outline',
        'Danza': 'body-outline',
        'Cine': 'videocam-outline',
        'Fotografía': 'camera-outline',
        'Literatura': 'book-outline',
        'Cultura': 'library-outline',

        // Tecnología y educación
        'Tecnología': 'laptop-outline',
        'Programación': 'code-slash-outline',
        'Gaming': 'game-controller-outline',
        'Educación': 'school-outline',
        'Talleres': 'construct-outline',
        'Conferencias': 'mic-outline',

        // Gastronomía y social
        'Gastronomía': 'restaurant-outline',
        'Comida': 'fast-food-outline',
        'Bebidas': 'beer-outline',
        'Café': 'cafe-outline',
        'Social': 'people-outline',
        'Networking': 'git-network-outline',
        'Fiestas': 'sparkles-outline',

        // Negocios y profesional
        'Negocios': 'briefcase-outline',
        'Emprendimiento': 'rocket-outline',
        'Marketing': 'megaphone-outline',
        'Finanzas': 'cash-outline',

        // Salud y bienestar
        'Salud': 'heart-outline',
        'Bienestar': 'leaf-outline',
        'Yoga': 'flower-outline',
        'Meditación': 'happy-outline',

        // Naturaleza y aire libre
        'Naturaleza': 'leaf-outline',
        'Senderismo': 'trail-sign-outline',
        'Camping': 'bonfire-outline',
        'Viajes': 'airplane-outline',

        // Otros
        'Entretenimiento': 'game-controller-outline',
        'Religión': 'globe-outline',
        'Caridad': 'hand-left-outline',
        'Voluntariado': 'heart-outline',
        'Mascotas': 'paw-outline',
        'Niños': 'balloon-outline',
        'Familia': 'home-outline',
        'Otro': 'apps-outline',
    };

    // Buscar coincidencia exacta primero
    if (icons[categoryName]) {
        return icons[categoryName];
    }

    // Buscar coincidencia parcial (case insensitive)
    const lowerName = categoryName.toLowerCase();
    for (const [key, value] of Object.entries(icons)) {
        if (key.toLowerCase().includes(lowerName) || lowerName.includes(key.toLowerCase())) {
            return value;
        }
    }

    return 'calendar-outline';
};
