/**
 * Routing Service using OpenRouteService API
 *
 * OpenRouteService is a free, open-source routing service that uses OpenStreetMap data.
 * Get your free API key at: https://openrouteservice.org/dev/#/signup
 *
 * Free tier includes 2000 requests/day which is plenty for a community app.
 */

// API key from environment variable (.env file)
const ORS_API_KEY = process.env.EXPO_PUBLIC_ORS_API_KEY || '';

const ORS_BASE_URL = 'https://api.openrouteservice.org/v2';

export type TransportMode = 'driving-car' | 'foot-walking' | 'cycling-regular';

export type TransportModeInfo = {
    id: TransportMode;
    label: string;
    icon: string;
    description: string;
};

export const TRANSPORT_MODES: TransportModeInfo[] = [
    {
        id: 'driving-car',
        label: 'Auto',
        icon: 'car',
        description: 'En automóvil',
    },
    {
        id: 'foot-walking',
        label: 'A pie',
        icon: 'walk',
        description: 'Caminando',
    },
    {
        id: 'cycling-regular',
        label: 'Bicicleta',
        icon: 'bicycle',
        description: 'En bicicleta',
    },
];

export type Coordinate = {
    latitude: number;
    longitude: number;
};

export type RouteInfo = {
    coordinates: Coordinate[];
    distance: number; // in meters
    duration: number; // in seconds
    instructions: RouteInstruction[];
};

export type RouteInstruction = {
    instruction: string;
    distance: number;
    duration: number;
    type: number;
};

// Format distance for display
export const formatRouteDistance = (meters: number): string => {
    if (meters < 1000) {
        return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
};

// Format duration for display
export const formatRouteDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
        return `${hours}h ${minutes}min`;
    }
    return `${minutes} min`;
};

// Decode polyline from OpenRouteService (uses standard polyline encoding)
const decodePolyline = (encoded: string): Coordinate[] => {
    const coordinates: Coordinate[] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
        let shift = 0;
        let result = 0;
        let byte: number;

        do {
            byte = encoded.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
        lat += deltaLat;

        shift = 0;
        result = 0;

        do {
            byte = encoded.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
        lng += deltaLng;

        coordinates.push({
            latitude: lat / 1e5,
            longitude: lng / 1e5,
        });
    }

    return coordinates;
};

class RoutingService {
    private apiKey: string;

    constructor(apiKey: string = ORS_API_KEY) {
        this.apiKey = apiKey;
    }

    /**
     * Set a custom API key (useful if user wants to use their own key)
     */
    setApiKey(key: string) {
        this.apiKey = key;
    }

    /**
     * Get route between two points
     */
    async getRoute(
        origin: Coordinate,
        destination: Coordinate,
        mode: TransportMode = 'driving-car'
    ): Promise<RouteInfo> {
        try {
            // OpenRouteService uses [longitude, latitude] format
            const start = `${origin.longitude},${origin.latitude}`;
            const end = `${destination.longitude},${destination.latitude}`;

            const url = `${ORS_BASE_URL}/directions/${mode}?api_key=${this.apiKey}&start=${start}&end=${end}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));

                if (response.status === 401 || response.status === 403) {
                    throw new Error('API key inválida. Configura tu clave de OpenRouteService.');
                }

                if (response.status === 404) {
                    throw new Error('No se encontró una ruta entre estos puntos.');
                }

                throw new Error(errorData.error?.message || 'Error al obtener la ruta');
            }

            const data = await response.json();

            if (!data.features || data.features.length === 0) {
                throw new Error('No se encontró una ruta disponible');
            }

            const feature = data.features[0];
            const geometry = feature.geometry;
            const properties = feature.properties;
            const segments = properties.segments[0];

            // GeoJSON coordinates are [longitude, latitude], we need to convert
            let coordinates: Coordinate[];

            if (geometry.type === 'LineString') {
                coordinates = geometry.coordinates.map((coord: number[]) => ({
                    latitude: coord[1],
                    longitude: coord[0],
                }));
            } else {
                // Fallback to direct line if geometry is unexpected
                coordinates = [origin, destination];
            }

            // Parse instructions
            const instructions: RouteInstruction[] = segments.steps.map((step: any) => ({
                instruction: step.instruction,
                distance: step.distance,
                duration: step.duration,
                type: step.type,
            }));

            return {
                coordinates,
                distance: segments.distance,
                duration: segments.duration,
                instructions,
            };
        } catch (error: any) {
            console.error('Routing error:', error);
            throw error;
        }
    }

    /**
     * Get route with POST request (for more complex routes or avoiding URL length limits)
     */
    async getRoutePost(
        origin: Coordinate,
        destination: Coordinate,
        mode: TransportMode = 'driving-car'
    ): Promise<RouteInfo> {
        try {
            const url = `${ORS_BASE_URL}/directions/${mode}/geojson`;

            const body = {
                coordinates: [
                    [origin.longitude, origin.latitude],
                    [destination.longitude, destination.latitude],
                ],
                instructions: true,
                language: 'es',
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.apiKey,
                    'Accept': 'application/json, application/geo+json',
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || 'Error al obtener la ruta');
            }

            const data = await response.json();

            if (!data.features || data.features.length === 0) {
                throw new Error('No se encontró una ruta disponible');
            }

            const feature = data.features[0];
            const geometry = feature.geometry;
            const properties = feature.properties;
            const segments = properties.segments[0];

            const coordinates: Coordinate[] = geometry.coordinates.map((coord: number[]) => ({
                latitude: coord[1],
                longitude: coord[0],
            }));

            const instructions: RouteInstruction[] = segments.steps.map((step: any) => ({
                instruction: step.instruction,
                distance: step.distance,
                duration: step.duration,
                type: step.type,
            }));

            return {
                coordinates,
                distance: segments.distance,
                duration: segments.duration,
                instructions,
            };
        } catch (error: any) {
            console.error('Routing error:', error);
            throw error;
        }
    }

    /**
     * Check if the API key is configured
     */
    isConfigured(): boolean {
        return Boolean(this.apiKey) && !this.apiKey.includes('YOUR_API_KEY_HERE');
    }
}

export const routingService = new RoutingService();
