import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Alert,
    TouchableOpacity,
    Linking,
    Platform,
    ActivityIndicator,
    ScrollView,
    TextInput,
    Keyboard,
    Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, Callout, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MapStackParamList } from '../navigation/TabNavigator';

type MapScreenRouteProp = RouteProp<MapStackParamList, 'MapMain'>;
import * as Location from 'expo-location';
import { eventService } from '../services/eventService';
import {
    routingService,
    TRANSPORT_MODES,
    formatRouteDistance,
    formatRouteDuration,
    type TransportMode,
    type RouteInfo,
    type Coordinate,
} from '../services/routingService';
import type { Event } from '../types/models';
import { colors, spacing, typography, borderRadius, shadows } from '../theme';
import { formatDate, formatTime, getCategoryIcon } from '../utils/formatters';

const DEFAULT_REGION = {
    latitude: -2.9001,
    longitude: -79.0059,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
};

type MapScreenNavigationProp = NativeStackNavigationProp<MapStackParamList, 'MapMain'>;

export const MapScreen: React.FC = () => {
    const navigation = useNavigation<MapScreenNavigationProp>();
    const route = useRoute<MapScreenRouteProp>();
    const insets = useSafeAreaInsets();
    const mapRef = useRef<MapView>(null);

    // Get focusEventId from navigation params
    const focusEventId = route.params?.focusEventId;

    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastFocusedEventId, setLastFocusedEventId] = useState<number | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [userLocation, setUserLocation] = useState<Coordinate | null>(null);
    const [showDirections, setShowDirections] = useState(false);
    const [loadingLocation, setLoadingLocation] = useState(false);
    const [transportMode, setTransportMode] = useState<TransportMode>('driving-car');
    const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
    const [routeCoordinates, setRouteCoordinates] = useState<Coordinate[]>([]);

    // Search
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [showSearchResults, setShowSearchResults] = useState(false);

    // Filtered events based on search
    const filteredEvents = useMemo(() => {
        if (!searchQuery.trim()) return events;
        const query = searchQuery.toLowerCase();
        return events.filter(event =>
            event.title.toLowerCase().includes(query) ||
            event.location.toLowerCase().includes(query) ||
            event.categoryName.toLowerCase().includes(query)
        );
    }, [events, searchQuery]);

    // Reload events when screen gains focus (e.g., after creating an event)
    useFocusEffect(
        useCallback(() => {
            loadEvents();
        }, [])
    );

    useEffect(() => {
        requestLocationPermission();
    }, []);

    // Handle focus on specific event when navigating from EventDetail
    useEffect(() => {
        // Only process if we have a new focusEventId that differs from the last one
        if (focusEventId && events.length > 0 && focusEventId !== lastFocusedEventId) {
            const eventToFocus = events.find(e => e.id === focusEventId);
            if (eventToFocus) {
                setSelectedEvent(eventToFocus);
                setLastFocusedEventId(focusEventId);

                // Center map on the event
                if (mapRef.current && eventToFocus.latitude && eventToFocus.longitude) {
                    setTimeout(() => {
                        mapRef.current?.animateToRegion({
                            latitude: eventToFocus.latitude!,
                            longitude: eventToFocus.longitude!,
                            latitudeDelta: 0.01,
                            longitudeDelta: 0.01,
                        }, 500);

                        // Automatically start directions after centering
                        setTimeout(() => {
                            handleGetDirections(eventToFocus);
                        }, 600);
                    }, 300);
                }
            }
        }
    }, [focusEventId, events, lastFocusedEventId]);

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
        } finally {
            setLoading(false);
        }
    };

    const handleMarkerPress = (event: Event) => {
        setSelectedEvent(event);
        setShowDirections(false);
        setShowSearchResults(false);
        Keyboard.dismiss();

        // Center map on selected event
        if (mapRef.current && event.latitude && event.longitude) {
            mapRef.current.animateToRegion({
                latitude: event.latitude,
                longitude: event.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            }, 300);
        }
    };

    const handleEventPress = (eventId: number) => {
        navigation.navigate('EventDetail', { eventId });
    };

    const handleGetDirections = async (event: Event, mode: TransportMode = transportMode) => {
        if (!event.latitude || !event.longitude) {
            Alert.alert('Error', 'Este evento no tiene coordenadas');
            return;
        }

        setLoadingLocation(true);

        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Permiso requerido',
                    'Necesitamos tu ubicación para las direcciones',
                    [
                        { text: 'Cancelar', style: 'cancel' },
                        { text: 'Abrir Maps', onPress: () => openExternalMaps(event) }
                    ]
                );
                setLoadingLocation(false);
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            const newUserLocation: Coordinate = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            };
            setUserLocation(newUserLocation);

            const destination: Coordinate = {
                latitude: event.latitude,
                longitude: event.longitude,
            };

            if (!routingService.isConfigured()) {
                setRouteCoordinates([newUserLocation, destination]);
                setRouteInfo(null);
                setShowDirections(true);

                if (mapRef.current) {
                    mapRef.current.fitToCoordinates([newUserLocation, destination], {
                        edgePadding: { top: 120, right: 50, bottom: 300, left: 50 },
                        animated: true,
                    });
                }
                return;
            }

            try {
                const route = await routingService.getRoute(newUserLocation, destination, mode);
                setRouteInfo(route);
                setRouteCoordinates(route.coordinates);
                setShowDirections(true);

                if (mapRef.current && route.coordinates.length > 0) {
                    mapRef.current.fitToCoordinates(route.coordinates, {
                        edgePadding: { top: 120, right: 50, bottom: 350, left: 50 },
                        animated: true,
                    });
                }
            } catch (routeError: any) {
                setRouteCoordinates([newUserLocation, destination]);
                setRouteInfo(null);
                setShowDirections(true);

                if (mapRef.current) {
                    mapRef.current.fitToCoordinates([newUserLocation, destination], {
                        edgePadding: { top: 120, right: 50, bottom: 300, left: 50 },
                        animated: true,
                    });
                }
            }
        } catch (error) {
            Alert.alert('Error', 'No se pudo obtener tu ubicación', [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Abrir Maps', onPress: () => openExternalMaps(event) }
            ]);
        } finally {
            setLoadingLocation(false);
        }
    };

    const handleTransportModeChange = async (mode: TransportMode) => {
        setTransportMode(mode);
        if (showDirections && selectedEvent && userLocation) {
            setLoadingLocation(true);
            try {
                const destination: Coordinate = {
                    latitude: selectedEvent.latitude!,
                    longitude: selectedEvent.longitude!,
                };

                if (routingService.isConfigured()) {
                    const route = await routingService.getRoute(userLocation, destination, mode);
                    setRouteInfo(route);
                    setRouteCoordinates(route.coordinates);

                    if (mapRef.current && route.coordinates.length > 0) {
                        mapRef.current.fitToCoordinates(route.coordinates, {
                            edgePadding: { top: 120, right: 50, bottom: 350, left: 50 },
                            animated: true,
                        });
                    }
                }
            } catch (error) {
                console.error('Error changing transport mode:', error);
            } finally {
                setLoadingLocation(false);
            }
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
                .then((supported) => supported ? Linking.openURL(url) : Linking.openURL(googleMapsUrl))
                .catch(() => Linking.openURL(googleMapsUrl));
        } else {
            Linking.openURL(googleMapsUrl);
        }
    };

    const closeDirections = () => {
        setShowDirections(false);
        setRouteInfo(null);
        setRouteCoordinates([]);
        centerOnEvents();
    };

    const centerOnEvents = () => {
        if (filteredEvents.length > 0 && mapRef.current) {
            const coordinates = filteredEvents.map((e) => ({
                latitude: e.latitude!,
                longitude: e.longitude!,
            }));
            mapRef.current.fitToCoordinates(coordinates, {
                edgePadding: { top: 120, right: 50, bottom: 100, left: 50 },
                animated: true,
            });
        }
    };

    const centerOnUser = async () => {
        if (userLocation && mapRef.current) {
            mapRef.current.animateToRegion({
                ...userLocation,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
            }, 300);
        } else {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const location = await Location.getCurrentPositionAsync({});
                const newLocation = {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                };
                setUserLocation(newLocation);
                mapRef.current?.animateToRegion({
                    ...newLocation,
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.02,
                }, 300);
            }
        }
    };

    const clearSearch = () => {
        setSearchQuery('');
        setShowSearchResults(false);
        Keyboard.dismiss();
    };

    const handleSearchResultPress = (event: Event) => {
        setSelectedEvent(event);
        setShowSearchResults(false);
        setSearchQuery('');
        Keyboard.dismiss();

        // Center map on selected event
        if (mapRef.current && event.latitude && event.longitude) {
            mapRef.current.animateToRegion({
                latitude: event.latitude,
                longitude: event.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            }, 300);
        }
    };

    const handleSearchChange = (text: string) => {
        setSearchQuery(text);
        setShowSearchResults(text.trim().length > 0);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Map */}
            <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={DEFAULT_REGION}
                showsUserLocation
                showsMyLocationButton={false}
                onPress={() => {
                    if (!showDirections) setSelectedEvent(null);
                    setShowSearchResults(false);
                    Keyboard.dismiss();
                }}
            >
                {filteredEvents.map((event) => (
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
                                selectedEvent?.id === event.id && styles.markerSelected
                            ]}>
                                <Ionicons
                                    name={getCategoryIcon(event.categoryName) as any}
                                    size={selectedEvent?.id === event.id ? 20 : 16}
                                    color={colors.text.inverse}
                                />
                            </View>
                            <View style={[
                                styles.markerTail,
                                selectedEvent?.id === event.id && styles.markerTailSelected
                            ]} />
                        </View>
                    </Marker>
                ))}

                {showDirections && routeCoordinates.length > 0 && (
                    <Polyline
                        coordinates={routeCoordinates}
                        strokeColor={colors.primary}
                        strokeWidth={4}
                        lineCap="round"
                        lineJoin="round"
                    />
                )}
            </MapView>

            {/* Search Bar */}
            <View style={[styles.searchContainer, { top: insets.top + spacing.md }]}>
                <View style={[styles.searchBar, isSearchFocused && styles.searchBarFocused]}>
                    <View style={styles.searchIconContainer}>
                        <Ionicons
                            name="search"
                            size={18}
                            color={isSearchFocused ? colors.text.inverse : colors.primary}
                        />
                    </View>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar eventos en el mapa..."
                        placeholderTextColor={colors.text.disabled}
                        value={searchQuery}
                        onChangeText={handleSearchChange}
                        onFocus={() => {
                            setIsSearchFocused(true);
                            if (searchQuery.trim()) setShowSearchResults(true);
                        }}
                        onBlur={() => setIsSearchFocused(false)}
                        returnKeyType="search"
                    />
                    {searchQuery.length > 0 ? (
                        <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                            <Ionicons name="close-circle" size={20} color={colors.text.secondary} />
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.eventCountBadge}>
                            <Text style={styles.eventCountText}>{filteredEvents.length}</Text>
                        </View>
                    )}
                </View>

                {/* Search Results Dropdown */}
                {showSearchResults && searchQuery.trim() && (
                    <View style={styles.searchResultsDropdown}>
                        {/* Results header */}
                        <View style={styles.searchResultsHeader}>
                            <Text style={styles.searchResultsCount}>
                                {filteredEvents.length} {filteredEvents.length === 1 ? 'resultado' : 'resultados'}
                            </Text>
                            <TouchableOpacity onPress={() => setShowSearchResults(false)}>
                                <Ionicons name="chevron-up" size={20} color={colors.text.secondary} />
                            </TouchableOpacity>
                        </View>

                        {/* Results list */}
                        {filteredEvents.length > 0 ? (
                            <ScrollView
                                style={styles.searchResultsList}
                                keyboardShouldPersistTaps="handled"
                                showsVerticalScrollIndicator={true}
                            >
                                {filteredEvents.slice(0, 5).map((event) => (
                                    <TouchableOpacity
                                        key={event.id}
                                        style={styles.searchResultItem}
                                        onPress={() => handleSearchResultPress(event)}
                                        activeOpacity={0.7}
                                    >
                                        {/* Event thumbnail or icon */}
                                        {event.coverImage ? (
                                            <Image
                                                source={{ uri: event.coverImage }}
                                                style={styles.searchResultImage}
                                                resizeMode="cover"
                                            />
                                        ) : (
                                            <View style={styles.searchResultIconContainer}>
                                                <Ionicons
                                                    name={getCategoryIcon(event.categoryName) as any}
                                                    size={18}
                                                    color={colors.primary}
                                                />
                                            </View>
                                        )}

                                        {/* Event info */}
                                        <View style={styles.searchResultInfo}>
                                            <Text style={styles.searchResultTitle} numberOfLines={1}>
                                                {event.title}
                                            </Text>
                                            <View style={styles.searchResultMeta}>
                                                <Ionicons name="location-outline" size={12} color={colors.text.disabled} />
                                                <Text style={styles.searchResultLocation} numberOfLines={1}>
                                                    {event.location}
                                                </Text>
                                            </View>
                                        </View>

                                        {/* Arrow */}
                                        <Ionicons name="chevron-forward" size={18} color={colors.text.disabled} />
                                    </TouchableOpacity>
                                ))}

                                {/* Show more indicator */}
                                {filteredEvents.length > 5 && (
                                    <View style={styles.moreResultsHint}>
                                        <Text style={styles.moreResultsText}>
                                            +{filteredEvents.length - 5} más
                                        </Text>
                                    </View>
                                )}
                            </ScrollView>
                        ) : (
                            <View style={styles.noResultsContainer}>
                                <Ionicons name="search-outline" size={24} color={colors.text.disabled} />
                                <Text style={styles.noResultsText}>Sin resultados</Text>
                            </View>
                        )}
                    </View>
                )}
            </View>

            {/* Map Controls */}
            {!showDirections && (
                <View style={[styles.mapControls, { top: insets.top + 90 }]}>
                    <TouchableOpacity
                        style={styles.mapButton}
                        onPress={centerOnUser}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="navigate" size={20} color={colors.primary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.mapButton}
                        onPress={centerOnEvents}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="scan" size={20} color={colors.primary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.mapButton}
                        onPress={loadEvents}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="refresh-outline" size={20} color={colors.primary} />
                    </TouchableOpacity>
                </View>
            )}

            {/* Close Directions Button */}
            {showDirections && (
                <TouchableOpacity
                    style={[styles.closeButton, { top: insets.top + 80 }]}
                    onPress={closeDirections}
                    activeOpacity={0.8}
                >
                    <Ionicons name="close" size={24} color={colors.text.primary} />
                </TouchableOpacity>
            )}

            {/* Empty State */}
            {filteredEvents.length === 0 && !loading && (
                <View style={styles.emptyState}>
                    <Ionicons name="location-outline" size={48} color={colors.text.disabled} />
                    <Text style={styles.emptyText}>
                        {searchQuery ? 'Sin resultados' : 'No hay eventos con ubicación'}
                    </Text>
                </View>
            )}

            {/* Directions Card */}
            {showDirections && selectedEvent && (
                <View style={[styles.bottomCard, { paddingBottom: insets.bottom + spacing.md }]}>
                    {/* Transport Modes */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.transportScroll}
                        contentContainerStyle={styles.transportContainer}
                    >
                        {TRANSPORT_MODES.map((mode) => (
                            <TouchableOpacity
                                key={mode.id}
                                style={[
                                    styles.transportChip,
                                    transportMode === mode.id && styles.transportChipActive,
                                ]}
                                onPress={() => handleTransportModeChange(mode.id)}
                                disabled={loadingLocation}
                            >
                                <Ionicons
                                    name={mode.icon as any}
                                    size={18}
                                    color={transportMode === mode.id ? colors.text.inverse : colors.text.secondary}
                                />
                                <Text style={[
                                    styles.transportChipText,
                                    transportMode === mode.id && styles.transportChipTextActive,
                                ]}>
                                    {mode.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Route Info */}
                    {routeInfo && (
                        <View style={styles.routeInfo}>
                            <View style={styles.routeInfoItem}>
                                <Text style={styles.routeInfoValue}>{formatRouteDuration(routeInfo.duration)}</Text>
                                <Text style={styles.routeInfoLabel}>tiempo</Text>
                            </View>
                            <View style={styles.routeInfoDivider} />
                            <View style={styles.routeInfoItem}>
                                <Text style={styles.routeInfoValue}>{formatRouteDistance(routeInfo.distance)}</Text>
                                <Text style={styles.routeInfoLabel}>distancia</Text>
                            </View>
                        </View>
                    )}

                    {loadingLocation && (
                        <View style={styles.loadingRoute}>
                            <ActivityIndicator size="small" color={colors.primary} />
                            <Text style={styles.loadingRouteText}>Calculando...</Text>
                        </View>
                    )}

                    {/* Destination */}
                    <View style={styles.destination}>
                        <View style={styles.destinationIcon}>
                            <Ionicons name="location" size={18} color={colors.primary} />
                        </View>
                        <View style={styles.destinationText}>
                            <Text style={styles.destinationTitle} numberOfLines={1}>{selectedEvent.title}</Text>
                            <Text style={styles.destinationSubtitle} numberOfLines={1}>{selectedEvent.location}</Text>
                        </View>
                    </View>

                    {/* Actions */}
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={() => openExternalMaps(selectedEvent)}
                        >
                            <Ionicons name="navigate" size={18} color={colors.text.inverse} />
                            <Text style={styles.primaryButtonText}>Abrir en Maps</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={() => handleEventPress(selectedEvent.id)}
                        >
                            <Text style={styles.secondaryButtonText}>Ver evento</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Selected Event Card */}
            {selectedEvent && !showDirections && (
                <View style={[styles.bottomCard, { paddingBottom: insets.bottom + spacing.md }]}>
                    {/* Close button */}
                    <TouchableOpacity
                        style={styles.cardCloseButton}
                        onPress={() => setSelectedEvent(null)}
                    >
                        <Ionicons name="close" size={20} color={colors.text.secondary} />
                    </TouchableOpacity>

                    {/* Event content with image */}
                    <View style={styles.eventContent}>
                        {/* Image or placeholder */}
                        {selectedEvent.coverImage ? (
                            <Image
                                source={{ uri: selectedEvent.coverImage }}
                                style={styles.eventImage}
                                resizeMode="cover"
                            />
                        ) : (
                            <View style={styles.eventImagePlaceholder}>
                                <Ionicons
                                    name={getCategoryIcon(selectedEvent.categoryName) as any}
                                    size={28}
                                    color={colors.primary}
                                />
                            </View>
                        )}

                        {/* Event details */}
                        <View style={styles.eventDetails}>
                            <View style={styles.categoryBadge}>
                                <Text style={styles.categoryText}>{selectedEvent.categoryName}</Text>
                            </View>

                            <Text style={styles.eventTitle} numberOfLines={2}>{selectedEvent.title}</Text>

                            <View style={styles.eventInfo}>
                                <Ionicons name="calendar-outline" size={14} color={colors.text.secondary} />
                                <Text style={styles.eventInfoText}>
                                    {formatDate(selectedEvent.startDate)} · {formatTime(selectedEvent.startDate)}
                                </Text>
                            </View>

                            <View style={styles.eventInfo}>
                                <Ionicons name="location-outline" size={14} color={colors.text.secondary} />
                                <Text style={styles.eventInfoText} numberOfLines={1}>{selectedEvent.location}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Actions */}
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={() => handleGetDirections(selectedEvent)}
                            disabled={loadingLocation}
                        >
                            {loadingLocation ? (
                                <ActivityIndicator size="small" color={colors.text.inverse} />
                            ) : (
                                <>
                                    <Ionicons name="navigate" size={18} color={colors.text.inverse} />
                                    <Text style={styles.primaryButtonText}>Cómo llegar</Text>
                                </>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={() => handleEventPress(selectedEvent.id)}
                        >
                            <Text style={styles.secondaryButtonText}>Ver detalles</Text>
                            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    map: {
        flex: 1,
    },
    // Search
    searchContainer: {
        position: 'absolute',
        left: spacing.md,
        right: spacing.md,
        zIndex: 10,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.full,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        gap: spacing.sm,
        borderWidth: 1.5,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    searchBarFocused: {
        borderColor: colors.primary,
        backgroundColor: colors.surface,
    },
    searchIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchInput: {
        flex: 1,
        fontSize: typography.body.fontSize,
        color: colors.text.primary,
        paddingVertical: spacing.xs,
    },
    clearButton: {
        padding: spacing.xs,
    },
    eventCountBadge: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
        marginRight: spacing.xs,
    },
    eventCountText: {
        fontSize: typography.caption.fontSize,
        fontWeight: '700',
        color: colors.text.inverse,
    },
    // Search Results Dropdown
    searchResultsDropdown: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xl,
        marginTop: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
        overflow: 'hidden',
    },
    searchResultsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    searchResultsCount: {
        fontSize: typography.caption.fontSize,
        fontWeight: '600',
        color: colors.text.secondary,
    },
    searchResultsList: {
        maxHeight: 250,
    },
    searchResultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        gap: spacing.sm,
    },
    searchResultImage: {
        width: 40,
        height: 40,
        borderRadius: borderRadius.sm,
        backgroundColor: colors.background,
    },
    searchResultIconContainer: {
        width: 40,
        height: 40,
        borderRadius: borderRadius.sm,
        backgroundColor: colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchResultInfo: {
        flex: 1,
    },
    searchResultTitle: {
        fontSize: typography.body.fontSize,
        fontWeight: '500',
        color: colors.text.primary,
        marginBottom: 2,
    },
    searchResultMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    searchResultLocation: {
        fontSize: typography.caption.fontSize,
        color: colors.text.disabled,
        flex: 1,
    },
    moreResultsHint: {
        paddingVertical: spacing.sm,
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    moreResultsText: {
        fontSize: typography.caption.fontSize,
        color: colors.text.secondary,
        fontWeight: '500',
    },
    noResultsContainer: {
        padding: spacing.lg,
        alignItems: 'center',
        gap: spacing.xs,
    },
    noResultsText: {
        fontSize: typography.body.fontSize,
        color: colors.text.disabled,
    },
    // Map Controls
    mapControls: {
        position: 'absolute',
        right: spacing.md,
        gap: spacing.sm,
    },
    mapButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    closeButton: {
        position: 'absolute',
        right: spacing.md,
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    // Markers
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
        borderWidth: 3,
        borderColor: colors.surface,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 8,
    },
    markerSelected: {
        backgroundColor: colors.success,
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 4,
        shadowColor: colors.success,
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
        marginTop: -4,
    },
    markerTailSelected: {
        borderTopColor: colors.success,
        borderLeftWidth: 10,
        borderRightWidth: 10,
        borderTopWidth: 12,
    },
    // Empty State
    emptyState: {
        position: 'absolute',
        top: '50%',
        left: 0,
        right: 0,
        alignItems: 'center',
        marginTop: -50,
    },
    emptyText: {
        fontSize: typography.body.fontSize,
        color: colors.text.secondary,
        marginTop: spacing.sm,
    },
    // Bottom Card
    bottomCard: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: spacing.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 12,
    },
    // Transport
    transportScroll: {
        marginHorizontal: -spacing.lg,
        marginBottom: spacing.md,
    },
    transportContainer: {
        paddingHorizontal: spacing.lg,
        gap: spacing.sm,
    },
    transportChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm + 2,
        borderRadius: borderRadius.full,
        backgroundColor: colors.background,
        borderWidth: 1.5,
        borderColor: colors.border,
        gap: spacing.xs,
    },
    transportChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    transportChipText: {
        fontSize: typography.bodySmall.fontSize,
        fontWeight: '600',
        color: colors.text.secondary,
    },
    transportChipTextActive: {
        color: colors.text.inverse,
    },
    // Route Info
    routeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary + '10',
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.primary + '20',
    },
    routeInfoItem: {
        flex: 1,
        alignItems: 'center',
    },
    routeInfoValue: {
        fontSize: 22,
        fontWeight: '700',
        color: colors.primary,
    },
    routeInfoLabel: {
        fontSize: typography.caption.fontSize,
        color: colors.text.secondary,
        marginTop: 2,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    routeInfoDivider: {
        width: 1,
        height: 36,
        backgroundColor: colors.primary + '30',
    },
    loadingRoute: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.sm,
        gap: spacing.sm,
    },
    loadingRouteText: {
        fontSize: typography.bodySmall.fontSize,
        color: colors.text.secondary,
    },
    // Destination
    destination: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.md,
    },
    destinationIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.sm,
    },
    destinationText: {
        flex: 1,
    },
    destinationTitle: {
        fontSize: typography.body.fontSize,
        fontWeight: '600',
        color: colors.text.primary,
    },
    destinationSubtitle: {
        fontSize: typography.caption.fontSize,
        color: colors.text.secondary,
    },
    // Event Card
    cardCloseButton: {
        position: 'absolute',
        top: spacing.sm,
        right: spacing.sm,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    eventContent: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    eventImage: {
        width: 90,
        height: 90,
        borderRadius: borderRadius.lg,
        backgroundColor: colors.background,
    },
    eventImagePlaceholder: {
        width: 90,
        height: 90,
        borderRadius: borderRadius.lg,
        backgroundColor: colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    eventDetails: {
        flex: 1,
        paddingRight: spacing.lg,
    },
    categoryBadge: {
        alignSelf: 'flex-start',
        backgroundColor: colors.primaryLight,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.full,
        marginBottom: spacing.xs,
    },
    categoryText: {
        fontSize: typography.caption.fontSize,
        fontWeight: '600',
        color: colors.primary,
    },
    eventTitle: {
        fontSize: typography.body.fontSize,
        fontWeight: '600',
        color: colors.text.primary,
        marginBottom: spacing.xs,
    },
    eventInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        marginBottom: 2,
    },
    eventInfoText: {
        fontSize: typography.caption.fontSize,
        color: colors.text.secondary,
        flex: 1,
    },
    // Actions
    actions: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginTop: spacing.lg,
    },
    primaryButton: {
        flex: 1.2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        paddingVertical: spacing.md + 2,
        borderRadius: borderRadius.lg,
        gap: spacing.sm,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryButtonText: {
        fontSize: typography.body.fontSize,
        fontWeight: '700',
        color: colors.text.inverse,
    },
    secondaryButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.surface,
        paddingVertical: spacing.md + 2,
        borderRadius: borderRadius.lg,
        borderWidth: 1.5,
        borderColor: colors.primary,
        gap: spacing.xs,
    },
    secondaryButtonText: {
        fontSize: typography.body.fontSize,
        fontWeight: '600',
        color: colors.primary,
    },
});
