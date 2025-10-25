import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, Linking, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Callout, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MapStackParamList } from '../navigation/TabNavigator';
import * as Location from 'expo-location';
import { eventService } from '../services/eventService';
import { Loading } from '../components/Loading';
import type { Event } from '../types/models';
import { colors, spacing, typography, borderRadius } from '../theme';
import { formatDate, formatTime, getCategoryIcon } from '../utils/formatters';

// Default location: Cuenca, Ecuador
const DEFAULT_REGION = {
    latitude: -2.9001,
    longitude: -79.0059,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
};

type MapScreenNavigationProp = NativeStackNavigationProp<MapStackParamList, 'MapMain'>;

type UserLocation = {
    latitude: number;
    longitude: number;
};

// Calculate distance between two coordinates in km
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// Format distance for display
const formatDistance = (km: number): string => {
    if (km < 1) {
        return `${Math.round(km * 1000)} m`;
    }
    return `${km.toFixed(1)} km`;
};

export const MapScreen: React.FC = () => {
    const navigation = useNavigation<MapScreenNavigationProp>();
    const mapRef = useRef<MapView>(null);
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
    const [showDirections, setShowDirections] = useState(false);
    const [loadingLocation, setLoadingLocation] = useState(false);

    useEffect(() => {
        loadEvents();
        requestLocationPermission();
    }, []);

    const requestLocationPermission = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const location = await Location.getCurrentPositionAsync({});
                setUserLocation({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                });
            }
        } catch (error) {
            console.log('Error getting location:', error);
        }
    };

    const loadEvents = async () => {
        try {
            const data = await eventService.getAll();
            const eventsWithLocation = data.filter(
                (event) => event.latitude && event.longitude
            );
            setEvents(eventsWithLocation);
        } catch (error: any) {
            console.error('Error loading events:', error);
            Alert.alert('Error', 'No se pudieron cargar los eventos');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkerPress = (event: Event) => {
        setSelectedEvent(event);
        setShowDirections(false);
    };

    const handleEventPress = (eventId: number) => {
        navigation.navigate('EventDetail', { eventId });
    };

    const handleGetDirections = async (event: Event) => {
        if (!event.latitude || !event.longitude) {
            Alert.alert('Error', 'Este evento no tiene coordenadas disponibles');
            return;
        }

        setLoadingLocation(true);

        try {
            // Get current location
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Permiso requerido',
                    'Necesitamos acceso a tu ubicación para mostrarte las direcciones',
                    [
                        { text: 'Cancelar', style: 'cancel' },
                        { text: 'Abrir en Maps', onPress: () => openExternalMaps(event) }
                    ]
                );
                setLoadingLocation(false);
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            const newUserLocation = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            };
            setUserLocation(newUserLocation);
            setShowDirections(true);

            // Fit map to show both points
            if (mapRef.current) {
                mapRef.current.fitToCoordinates(
                    [
                        newUserLocation,
                        { latitude: event.latitude, longitude: event.longitude }
                    ],
                    {
                        edgePadding: { top: 100, right: 50, bottom: 250, left: 50 },
                        animated: true,
                    }
                );
            }
        } catch (error) {
            console.error('Error getting location:', error);
            Alert.alert(
                'Error',
                'No se pudo obtener tu ubicación',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Abrir en Maps', onPress: () => openExternalMaps(event) }
                ]
            );
        } finally {
            setLoadingLocation(false);
        }
    };

    const openExternalMaps = (event: Event) => {
        if (!event.latitude || !event.longitude) return;

        const lat = event.latitude;
        const lng = event.longitude;
        const label = encodeURIComponent(event.title);

        const url = Platform.select({
            ios: `maps:?daddr=${lat},${lng}&q=${label}`,
            android: `geo:${lat},${lng}?q=${lat},${lng}(${label})`,
        });

        const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

        if (url) {
            Linking.canOpenURL(url)
                .then((supported) => {
                    if (supported) {
                        return Linking.openURL(url);
                    } else {
                        return Linking.openURL(googleMapsUrl);
                    }
                })
                .catch(() => {
                    Linking.openURL(googleMapsUrl);
                });
        } else {
            Linking.openURL(googleMapsUrl);
        }
    };

    const closeDirections = () => {
        setShowDirections(false);
        centerOnEvents();
    };

    const centerOnEvents = () => {
        if (events.length > 0 && mapRef.current) {
            const coordinates = events.map((e) => ({
                latitude: e.latitude!,
                longitude: e.longitude!,
            }));
            mapRef.current.fitToCoordinates(coordinates, {
                edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
                animated: true,
            });
        }
    };

    const getDistance = (): string | null => {
        if (!userLocation || !selectedEvent?.latitude || !selectedEvent?.longitude) {
            return null;
        }
        const distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            selectedEvent.latitude,
            selectedEvent.longitude
        );
        return formatDistance(distance);
    };

    if (loading) {
        return <Loading message="Cargando mapa..." />;
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>
                    {showDirections ? 'Direcciones' : 'Mapa de Eventos'}
                </Text>
                <Text style={styles.headerSubtitle}>
                    {showDirections
                        ? `Ruta hacia ${selectedEvent?.title}`
                        : `${events.length} ${events.length === 1 ? 'evento' : 'eventos'} en el mapa`
                    }
                </Text>
            </View>

            {events.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="location-outline" size={64} color={colors.text.disabled} />
                    <Text style={styles.emptyTitle}>Sin eventos en el mapa</Text>
                    <Text style={styles.emptyText}>
                        No hay eventos con ubicación disponible
                    </Text>
                </View>
            ) : (
                <View style={styles.mapContainer}>
                    <MapView
                        ref={mapRef}
                        style={styles.map}
                        initialRegion={DEFAULT_REGION}
                        showsUserLocation
                        showsMyLocationButton={false}
                    >
                        {/* Event markers */}
                        {events.map((event) => (
                            <Marker
                                key={event.id}
                                coordinate={{
                                    latitude: event.latitude!,
                                    longitude: event.longitude!,
                                }}
                                onPress={() => handleMarkerPress(event)}
                            >
                                <View style={styles.markerContainer}>
                                    <View style={[
                                        styles.marker,
                                        selectedEvent?.id === event.id && showDirections && styles.markerSelected
                                    ]}>
                                        <Ionicons
                                            name={getCategoryIcon(event.categoryName) as any}
                                            size={20}
                                            color={colors.text.inverse}
                                        />
                                    </View>
                                    <View style={[
                                        styles.markerTail,
                                        selectedEvent?.id === event.id && showDirections && styles.markerTailSelected
                                    ]} />
                                </View>
                                <Callout
                                    tooltip
                                    onPress={() => handleEventPress(event.id)}
                                >
                                    <View style={styles.callout}>
                                        <Text style={styles.calloutTitle} numberOfLines={2}>
                                            {event.title}
                                        </Text>
                                        <View style={styles.calloutInfo}>
                                            <Ionicons
                                                name="calendar-outline"
                                                size={14}
                                                color={colors.primary}
                                            />
                                            <Text style={styles.calloutDate}>
                                                {formatDate(event.startDate, 'EEE, d MMM')}
                                            </Text>
                                        </View>
                                        <Text style={styles.calloutCta}>Toca para ver más</Text>
                                    </View>
                                </Callout>
                            </Marker>
                        ))}

                        {/* Direction line */}
                        {showDirections && userLocation && selectedEvent?.latitude && selectedEvent?.longitude && (
                            <Polyline
                                coordinates={[
                                    userLocation,
                                    { latitude: selectedEvent.latitude, longitude: selectedEvent.longitude }
                                ]}
                                strokeColor={colors.primary}
                                strokeWidth={4}
                                lineDashPattern={[10, 5]}
                            />
                        )}
                    </MapView>

                    {/* Map buttons */}
                    {!showDirections && (
                        <>
                            <TouchableOpacity
                                style={styles.centerButton}
                                onPress={centerOnEvents}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="locate" size={24} color={colors.primary} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.refreshButton}
                                onPress={loadEvents}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="refresh" size={24} color={colors.primary} />
                            </TouchableOpacity>
                        </>
                    )}

                    {/* Close directions button */}
                    {showDirections && (
                        <TouchableOpacity
                            style={styles.closeDirectionsButton}
                            onPress={closeDirections}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="close" size={24} color={colors.text.primary} />
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* Directions Card */}
            {showDirections && selectedEvent && (
                <View style={styles.directionsCard}>
                    <View style={styles.directionsCardContent}>
                        <View style={styles.directionsHeader}>
                            <View style={styles.directionsIconContainer}>
                                <Ionicons name="navigate" size={24} color={colors.primary} />
                            </View>
                            <View style={styles.directionsInfo}>
                                <Text style={styles.directionsTitle} numberOfLines={1}>
                                    {selectedEvent.title}
                                </Text>
                                <Text style={styles.directionsSubtitle}>
                                    {selectedEvent.location}
                                </Text>
                            </View>
                        </View>

                        {getDistance() && (
                            <View style={styles.distanceContainer}>
                                <Ionicons name="walk-outline" size={20} color={colors.text.secondary} />
                                <Text style={styles.distanceText}>
                                    Distancia aproximada: <Text style={styles.distanceBold}>{getDistance()}</Text>
                                </Text>
                            </View>
                        )}

                        <View style={styles.directionsActions}>
                            <TouchableOpacity
                                style={styles.openMapsButton}
                                onPress={() => openExternalMaps(selectedEvent)}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="map-outline" size={18} color={colors.text.inverse} />
                                <Text style={styles.openMapsButtonText}>Abrir en Maps</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.viewEventButton}
                                onPress={() => handleEventPress(selectedEvent.id)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.viewEventButtonText}>Ver evento</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}

            {/* Selected Event Card (when not in directions mode) */}
            {selectedEvent && !showDirections && (
                <View style={styles.eventCard}>
                    <View style={styles.eventCardContent}>
                        <View style={styles.eventCardHeader}>
                            <View style={styles.categoryBadge}>
                                <Text style={styles.categoryText}>
                                    {selectedEvent.categoryName}
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setSelectedEvent(null)}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Ionicons name="close" size={24} color={colors.text.secondary} />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.eventCardTitle} numberOfLines={2}>
                            {selectedEvent.title}
                        </Text>
                        <View style={styles.eventCardInfo}>
                            <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                            <Text style={styles.eventCardInfoText}>
                                {formatDate(selectedEvent.startDate)} · {formatTime(selectedEvent.startDate)}
                            </Text>
                        </View>
                        <View style={styles.eventCardInfo}>
                            <Ionicons name="location-outline" size={16} color={colors.primary} />
                            <Text style={styles.eventCardInfoText} numberOfLines={1}>
                                {selectedEvent.location}
                            </Text>
                        </View>
                        <View style={styles.eventCardFooter}>
                            <TouchableOpacity
                                style={styles.directionsButton}
                                onPress={() => handleGetDirections(selectedEvent)}
                                activeOpacity={0.7}
                                disabled={loadingLocation}
                            >
                                {loadingLocation ? (
                                    <ActivityIndicator size="small" color={colors.text.inverse} />
                                ) : (
                                    <>
                                        <Ionicons name="navigate" size={18} color={colors.text.inverse} />
                                        <Text style={styles.directionsButtonText}>Como llegar</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.viewButton}
                                onPress={() => handleEventPress(selectedEvent.id)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.viewButtonText}>Ver evento</Text>
                                <Ionicons
                                    name="chevron-forward"
                                    size={16}
                                    color={colors.primary}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
    },
    headerTitle: {
        fontSize: typography.h2.fontSize,
        fontWeight: typography.h2.fontWeight,
        color: colors.text.primary,
    },
    headerSubtitle: {
        fontSize: typography.bodySmall.fontSize,
        color: colors.text.secondary,
        marginTop: spacing.xs,
    },
    mapContainer: {
        flex: 1,
        position: 'relative',
    },
    map: {
        flex: 1,
    },
    markerContainer: {
        alignItems: 'center',
    },
    marker: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    markerSelected: {
        backgroundColor: colors.success,
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    markerTail: {
        width: 0,
        height: 0,
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderTopWidth: 10,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: colors.primary,
        marginTop: -2,
    },
    markerTailSelected: {
        borderTopColor: colors.success,
        borderLeftWidth: 10,
        borderRightWidth: 10,
        borderTopWidth: 12,
    },
    callout: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        minWidth: 200,
        maxWidth: 280,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    calloutTitle: {
        fontSize: typography.body.fontSize,
        fontWeight: '600',
        color: colors.text.primary,
        marginBottom: spacing.sm,
    },
    calloutInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        marginBottom: spacing.xs,
    },
    calloutDate: {
        fontSize: typography.bodySmall.fontSize,
        color: colors.text.secondary,
    },
    calloutCta: {
        fontSize: typography.caption.fontSize,
        color: colors.primary,
        fontWeight: '600',
        marginTop: spacing.sm,
        textAlign: 'center',
    },
    centerButton: {
        position: 'absolute',
        top: spacing.md,
        right: spacing.md,
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    refreshButton: {
        position: 'absolute',
        top: spacing.md + 56,
        right: spacing.md,
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    closeDirectionsButton: {
        position: 'absolute',
        top: spacing.md,
        right: spacing.md,
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    emptyTitle: {
        fontSize: typography.h3.fontSize,
        fontWeight: '600',
        color: colors.text.primary,
        marginTop: spacing.md,
    },
    emptyText: {
        fontSize: typography.body.fontSize,
        color: colors.text.secondary,
        textAlign: 'center',
        marginTop: spacing.xs,
    },
    // Directions Card
    directionsCard: {
        position: 'absolute',
        bottom: spacing.lg,
        left: spacing.md,
        right: spacing.md,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xl,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
    },
    directionsCardContent: {
        padding: spacing.lg,
    },
    directionsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    directionsIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    directionsInfo: {
        flex: 1,
    },
    directionsTitle: {
        fontSize: typography.body.fontSize,
        fontWeight: '600',
        color: colors.text.primary,
    },
    directionsSubtitle: {
        fontSize: typography.bodySmall.fontSize,
        color: colors.text.secondary,
        marginTop: 2,
    },
    distanceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.md,
        gap: spacing.sm,
    },
    distanceText: {
        fontSize: typography.body.fontSize,
        color: colors.text.secondary,
    },
    distanceBold: {
        fontWeight: '600',
        color: colors.text.primary,
    },
    directionsActions: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    openMapsButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
    },
    openMapsButtonText: {
        fontSize: typography.body.fontSize,
        fontWeight: '600',
        color: colors.text.inverse,
    },
    viewEventButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primaryLight,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
    },
    viewEventButtonText: {
        fontSize: typography.body.fontSize,
        fontWeight: '600',
        color: colors.primary,
    },
    // Event Card
    eventCard: {
        position: 'absolute',
        bottom: spacing.lg,
        left: spacing.md,
        right: spacing.md,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xl,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
    },
    eventCardContent: {
        padding: spacing.lg,
    },
    eventCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    categoryBadge: {
        backgroundColor: colors.primary + '15',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
    },
    categoryText: {
        fontSize: typography.caption.fontSize,
        fontWeight: '600',
        color: colors.primary,
        textTransform: 'uppercase',
    },
    eventCardTitle: {
        fontSize: typography.h4.fontSize,
        fontWeight: typography.h4.fontWeight,
        color: colors.text.primary,
        marginBottom: spacing.md,
    },
    eventCardInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.xs,
    },
    eventCardInfoText: {
        fontSize: typography.bodySmall.fontSize,
        color: colors.text.secondary,
        flex: 1,
    },
    eventCardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: spacing.md,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.borderLight,
        gap: spacing.sm,
    },
    directionsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        minWidth: 130,
    },
    directionsButtonText: {
        fontSize: typography.bodySmall.fontSize,
        fontWeight: '600',
        color: colors.text.inverse,
    },
    viewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        backgroundColor: colors.primaryLight,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
    },
    viewButtonText: {
        fontSize: typography.bodySmall.fontSize,
        fontWeight: '600',
        color: colors.primary,
    },
});
