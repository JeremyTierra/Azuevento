export const colors = {
    // Primary palette - Azul Cuenca (Cúpulas de la Catedral)
    primary: '#4A90E2',
    primaryLight: '#7FB3F0',
    primaryDark: '#357ABD',
    primaryGradient: ['#4A90E2', '#357ABD'] as const,

    // Secondary palette - Terracota Andina (Tejados coloniales)
    secondary: '#E07B39',
    secondaryLight: '#F0A066',
    secondaryDark: '#C96A2E',

    // Accent - Dorado Colonial (Detalles de iglesias)
    accent: '#F4B942',
    accentLight: '#F7CC6F',
    accentDark: '#E0A830',

    // Neutral palette
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceDark: '#1E293B',
    overlay: 'rgba(0, 0, 0, 0.5)',

    // Borders
    border: '#E2E8F0',
    borderLight: '#F1F5F9',

    // Text colors
    text: {
        primary: '#1E293B',
        secondary: '#64748B',
        disabled: '#94A3B8',
        inverse: '#FFFFFF',
        link: '#4A90E2', // Azul Cuenca para links
    },

    // Status colors
    success: '#2ECC71', // Verde Páramo
    successLight: '#D1FAE5',
    warning: '#F4B942', // Dorado Colonial (mismo que accent)
    warningLight: '#FEF3C7',
    error: '#E74C3C', // Rojo cálido
    info: '#3498DB', // Azul cielo
    infoLight: '#DBEAFE',
} as const;

export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
} as const;

export const borderRadius = {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 24,
    full: 9999,
} as const;

export const typography = {
    h1: {
        fontSize: 32,
        fontWeight: '700' as const,
        lineHeight: 40,
    },
    h2: {
        fontSize: 28,
        fontWeight: '700' as const,
        lineHeight: 36,
    },
    h3: {
        fontSize: 24,
        fontWeight: '600' as const,
        lineHeight: 32,
    },
    h4: {
        fontSize: 20,
        fontWeight: '600' as const,
        lineHeight: 28,
    },
    h5: {
        fontSize: 18,
        fontWeight: '600' as const,
        lineHeight: 24,
    },
    body: {
        fontSize: 16,
        lineHeight: 24,
    },
    bodySmall: {
        fontSize: 14,
        lineHeight: 20,
    },
    caption: {
        fontSize: 12,
        lineHeight: 16,
    },
    button: {
        fontSize: 16,
        fontWeight: '600' as const,
    },
} as const;

export const shadows = {
    none: {
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
    },
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
    },
    xl: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
        elevation: 12,
    },
} as const;
