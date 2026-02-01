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
    Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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

// Función para obtener color según categoría
const getCategoryColor = (categoryName: string | undefined): string => {
    if (!categoryName) return '#7FB3F0'; // primaryLight por defecto
    
    const categoryColors: Record<string, string> = {
        // Colores que armonizan con el tema Azul Cuenca (#4A90E2), Terracota (#E07B39), Dorado (#F4B942)
        'Sports': '#F0A066',       // secondaryLight - Terracota claro
        'Music': '#A78BFA',        // Púrpura suave compatible
        'Culture': '#F0A066',      // secondaryLight - Terracota 
        'Technology': '#7FB3F0',   // primaryLight - Azul Cuenca claro
        'Education': '#7FB3F0',    // primaryLight - Azul Cuenca claro
        'Gastronomy': '#F7CC6F',   // accentLight - Dorado claro
        'Social': '#6BCF91',       // Verde suave compatible con success
        'Business': '#94A3B8',     // text.disabled - Gris neutro
        'Health': '#6BCF91',       // Verde suave
        'Nature': '#6BCF91',       // Verde suave
        'Entertainment': '#C96A2E', // secondaryDark - Terracota oscuro
        'Other': '#94A3B8',        // text.disabled - Gris neutro
        
        // Español (por si acaso)
        'Deportes': '#F0A066',
        'Música': '#A78BFA',
        'Cultura': '#F0A066',
        'Tecnología': '#7FB3F0',
        'Educación': '#7FB3F0',
        'Gastronomía': '#F7CC6F',
        'Social': '#6BCF91',
        'Negocios': '#94A3B8',
        'Salud': '#6BCF91',
        'Naturaleza': '#6BCF91',
        'Entretenimiento': '#C96A2E',
        'Otro': '#94A3B8',
    };
    
    // Buscar coincidencia exacta
    if (categoryColors[categoryName]) {
        return categoryColors[categoryName];
    }
    
    // Buscar coincidencia parcial
    const lowerName = categoryName.toLowerCase();
    for (const [key, value] of Object.entries(categoryColors)) {
        if (key.toLowerCase().includes(lowerName) || lowerName.includes(key.toLowerCase())) {
            return value;
        }
    }
    
    return '#7FB3F0'; // primaryLight por defecto
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

    // Category filter
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    // Card minimized state
    const [isCardMinimized, setIsCardMinimized] = useState(false);

    // Animations
    const cardSlideAnim = useRef(new Animated.Value(100)).current;

    // Animate card when event selected
    useEffect(() => {
        if (selectedEvent) {
            setIsCardMinimized(false);
            Animated.spring(cardSlideAnim, {
                toValue: 0,
                useNativeDriver: true,
                friction: 8,
                tension: 40,
            }).start();
        } else {
            cardSlideAnim.setValue(100);
        }
    }, [selectedEvent]);

    // Toggle card minimize
    const toggleCardMinimize = () => {
        setIsCardMinimized(!isCardMinimized);
    };

    // Get unique categories
    const categories = useMemo(() => {
        const uniqueCategories = [...new Set(events.map(e => e.categoryName))];
        return uniqueCategories.sort();
    }, [events]);

    // Filtered events based on search and category
    const filteredEvents = useMemo(() => {
        let result = events;

        // Filter by category
        if (selectedCategory) {
            result = result.filter(event => event.categoryName === selectedCategory);
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(event =>
                (event.title && event.title.toLowerCase().includes(query)) ||
                (event.location && event.location.toLowerCase().includes(query)) ||
                (event.categoryName && event.categoryName.toLowerCase().includes(query))
            );
        }

        return result;
    }, [events, searchQuery, selectedCategory]);

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
            // Log para verificar categorías
            if (eventsWithLocation.length > 0) {
                console.log('📍 Categoría ejemplo:', eventsWithLocation[0].categoryName);
            }
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
                <View style={styles.loadingContent}>
                    <View style={styles.loadingIconContainer}>
                        <Ionicons name="map" size={32} color={colors.primary} />
                    </View>
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.md }} />
                    <Text style={styles.loadingText}>Cargando mapa...</Text>
                    <Text style={styles.loadingSubtext}>Buscando eventos cerca de ti</Text>
                </View>
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
                {filteredEvents.map((event) => {
                    const isSelected = selectedEvent?.id === event.id;
                    const categoryColor = getCategoryColor(event.categoryName);
                    const markerColor = isSelected ? '#22c55e' : categoryColor;
                    
                    return (
                        <Marker
                            key={`${event.id}-${markerColor}`}
                            coordinate={{
                                latitude: event.latitude!,
                                longitude: event.longitude!,
                            }}
                            onPress={() => handleMarkerPress(event)}
                            pinColor={markerColor}
                        />
                    );
                })}

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
                            color={colors.text.inverse}
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

                {/* Category Filter Chips */}
                {!showSearchResults && categories.length > 0 && (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.categoryScroll}
                        contentContainerStyle={styles.categoryContainer}
                    >
                        <TouchableOpacity
                            style={[
                                styles.categoryChip,
                                !selectedCategory && styles.categoryChipActive,
                            ]}
                            onPress={() => setSelectedCategory(null)}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name="apps"
                                size={14}
                                color={!selectedCategory ? colors.text.inverse : colors.text.secondary}
                            />
                            <Text style={[
                                styles.categoryChipText,
                                !selectedCategory && styles.categoryChipTextActive,
                            ]}>
                                Todos
                            </Text>
                        </TouchableOpacity>
                        {categories.map((category) => (
                            <TouchableOpacity
                                key={category}
                                style={[
                                    styles.categoryChip,
                                    selectedCategory === category && styles.categoryChipActive,
                                ]}
                                onPress={() => setSelectedCategory(
                                    selectedCategory === category ? null : category
                                )}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name={getCategoryIcon(category) as any}
                                    size={14}
                                    color={selectedCategory === category ? colors.text.inverse : colors.text.secondary}
                                />
                                <Text style={[
                                    styles.categoryChipText,
                                    selectedCategory === category && styles.categoryChipTextActive,
                                ]}>
                                    {category}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}
            </View>

            {/* Map Controls */}
            {!showDirections && (
                <View style={[styles.mapControls, { top: insets.top + 140 }]}>
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
                    style={[styles.closeButton, { top: insets.top + 140 }]}
                    onPress={closeDirections}
                    activeOpacity={0.8}
                >
                    <Ionicons name="close" size={24} color={colors.text.primary} />
                </TouchableOpacity>
            )}

            {/* Empty State */}
            {filteredEvents.length === 0 && !loading && (
                <View style={styles.emptyState}>
                    <View style={styles.emptyStateIcon}>
                        <Ionicons name="location-outline" size={40} color={colors.primary} />
                    </View>
                    <Text style={styles.emptyTitle}>
                        {searchQuery || selectedCategory ? 'Sin resultados' : 'Sin eventos en el mapa'}
                    </Text>
                    <Text style={styles.emptyText}>
                        {searchQuery || selectedCategory
                            ? 'Intenta con otra búsqueda o categoría'
                            : 'Los eventos con ubicación aparecerán aquí'}
                    </Text>
                    {(searchQuery || selectedCategory) && (
                        <TouchableOpacity
                            style={styles.emptyButton}
                            onPress={() => {
                                setSearchQuery('');
                                setSelectedCategory(null);
                            }}
                        >
                            <Text style={styles.emptyButtonText}>Limpiar filtros</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* Directions Card */}
            {showDirections && selectedEvent && (
                <Animated.View style={[
                    styles.bottomCard,
                    {
                        paddingBottom: insets.bottom + spacing.md,
                        transform: [{ translateY: cardSlideAnim }]
                    }
                ]}>
                    {/* Handle indicator */}
                    <View style={styles.cardHandleContainer}>
                        <View style={styles.cardHandle} />
                    </View>

                    {/* Minimized Header - Touchable to toggle */}
                    <TouchableOpacity
                        style={styles.minimizedHeader}
                        onPress={toggleCardMinimize}
                        activeOpacity={0.7}
                    >
                        <View style={styles.minimizedEventInfo}>
                            <View style={[styles.minimizedIcon, { backgroundColor: colors.successLight }]}>
                                <Ionicons name="navigate" size={16} color={colors.success} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.minimizedTitle} numberOfLines={1}>
                                    {selectedEvent.title}
                                </Text>
                                {routeInfo && (
                                    <Text style={styles.minimizedSubtitle}>
                                        {formatRouteDuration(routeInfo.duration)} • {formatRouteDistance(routeInfo.distance)}
                                    </Text>
                                )}
                            </View>
                        </View>
                        <View style={styles.minimizedToggle}>
                            <Ionicons
                                name={isCardMinimized ? 'chevron-up' : 'chevron-down'}
                                size={20}
                                color={colors.text.secondary}
                            />
                        </View>
                        <TouchableOpacity
                            style={styles.minimizedCloseButton}
                            onPress={closeDirections}
                        >
                            <Ionicons name="close" size={18} color={colors.text.secondary} />
                        </TouchableOpacity>
                    </TouchableOpacity>

                    {/* Expandable Content */}
                    {!isCardMinimized && (
                        <>
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
                                <View style={styles.routeInfoIconContainer}>
                                    <Ionicons name="time-outline" size={18} color={colors.primary} />
                                </View>
                                <Text style={styles.routeInfoValue}>{formatRouteDuration(routeInfo.duration)}</Text>
                                <Text style={styles.routeInfoLabel}>tiempo estimado</Text>
                            </View>
                            <View style={styles.routeInfoDivider} />
                            <View style={styles.routeInfoItem}>
                                <View style={styles.routeInfoIconContainer}>
                                    <Ionicons name="speedometer-outline" size={18} color={colors.success} />
                                </View>
                                <Text style={[styles.routeInfoValue, { color: colors.success }]}>{formatRouteDistance(routeInfo.distance)}</Text>
                                <Text style={styles.routeInfoLabel}>distancia</Text>
                            </View>
                        </View>
                    )}

                    {loadingLocation && (
                        <View style={styles.loadingRoute}>
                            <ActivityIndicator size="small" color={colors.primary} />
                            <Text style={styles.loadingRouteText}>Calculando ruta...</Text>
                        </View>
                    )}

                    {/* Destination */}
                    <View style={styles.destination}>
                        <View style={styles.destinationIconPulse}>
                            <View style={styles.destinationIcon}>
                                <Ionicons name="location" size={18} color={colors.primary} />
                            </View>
                        </View>
                        <View style={styles.destinationText}>
                            <Text style={styles.destinationLabel}>Destino</Text>
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
                            <Text style={styles.primaryButtonText}>Iniciar navegación</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={() => handleEventPress(selectedEvent.id)}
                        >
                            <Text style={styles.secondaryButtonText}>Ver evento</Text>
                            <Ionicons name="chevron-forward" size={16} color={colors.text.primary} />
                        </TouchableOpacity>
                    </View>
                        </>
                    )}
                </Animated.View>
            )}

            {/* Selected Event Card */}
            {selectedEvent && !showDirections && (
                <Animated.View style={[
                    styles.bottomCard,
                    {
                        paddingBottom: insets.bottom + spacing.md,
                        transform: [{ translateY: cardSlideAnim }]
                    }
                ]}>
                    {/* Handle indicator */}
                    <View style={styles.cardHandleContainer}>
                        <View style={styles.cardHandle} />
                    </View>

                    {/* Minimized Header - Touchable to toggle */}
                    <TouchableOpacity
                        style={styles.minimizedHeader}
                        onPress={toggleCardMinimize}
                        activeOpacity={0.7}
                    >
                        <View style={styles.minimizedEventInfo}>
                            <View style={styles.minimizedIcon}>
                                <Ionicons
                                    name={getCategoryIcon(selectedEvent.categoryName) as any}
                                    size={16}
                                    color={colors.primary}
                                />
                            </View>
                            <Text style={styles.minimizedTitle} numberOfLines={1}>
                                {selectedEvent.title}
                            </Text>
                        </View>
                        <View style={styles.minimizedToggle}>
                            <Ionicons
                                name={isCardMinimized ? 'chevron-up' : 'chevron-down'}
                                size={20}
                                color={colors.text.secondary}
                            />
                        </View>
                        <TouchableOpacity
                            style={styles.minimizedCloseButton}
                            onPress={() => setSelectedEvent(null)}
                        >
                            <Ionicons name="close" size={18} color={colors.text.secondary} />
                        </TouchableOpacity>
                    </TouchableOpacity>

                    {/* Expandable Content */}
                    {!isCardMinimized && (
                        <>
                            {/* Event content with image */}
                            <View style={styles.eventContent}>
                        {/* Image or placeholder */}
                        <View style={styles.eventImageContainer}>
                            {selectedEvent.coverImage ? (
                                <Image
                                    source={{ uri: selectedEvent.coverImage }}
                                    style={styles.eventImage}
                                    resizeMode="cover"
                                />
                            ) : (
                                <LinearGradient
                                    colors={[colors.primary, colors.primaryDark]}
                                    style={styles.eventImagePlaceholder}
                                >
                                    <Ionicons
                                        name={getCategoryIcon(selectedEvent.categoryName) as any}
                                        size={28}
                                        color={colors.text.inverse}
                                    />
                                </LinearGradient>
                            )}
                            {/* Participant count overlay */}
                            <View style={styles.participantOverlay}>
                                <Ionicons name="people" size={12} color={colors.text.inverse} />
                                <Text style={styles.participantCount}>{selectedEvent.participantCount}</Text>
                            </View>
                        </View>

                        {/* Event details */}
                        <View style={styles.eventDetails}>
                            <View style={styles.eventHeaderRow}>
                                <View style={styles.categoryBadge}>
                                    <Ionicons
                                        name={getCategoryIcon(selectedEvent.categoryName) as any}
                                        size={10}
                                        color={colors.primary}
                                    />
                                    <Text style={styles.categoryText}>{selectedEvent.categoryName}</Text>
                                </View>
                                {selectedEvent.averageRating && selectedEvent.averageRating > 0 && (
                                    <View style={styles.ratingBadge}>
                                        <Ionicons name="star" size={10} color={colors.warning} />
                                        <Text style={styles.ratingText}>{selectedEvent.averageRating.toFixed(1)}</Text>
                                    </View>
                                )}
                            </View>

                            <Text style={styles.eventTitle} numberOfLines={2}>{selectedEvent.title}</Text>

                            <View style={styles.eventInfo}>
                                <Ionicons name="calendar-outline" size={14} color={colors.text.secondary} />
                                <Text style={styles.eventInfoText}>
                                    {formatDate(selectedEvent.startDate)} · {formatTime(selectedEvent.startDate)}
                                </Text>
                            </View>

                            <View style={styles.eventInfo}>
                                <Ionicons name="location-outline" size={14} color={colors.primary} />
                                <Text style={[styles.eventInfoText, { color: colors.primary }]} numberOfLines={1}>
                                    {selectedEvent.location}
                                </Text>
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
                            <Ionicons name="chevron-forward" size={16} color={colors.text.primary} />
                        </TouchableOpacity>
                    </View>
                        </>
                    )}
                </Animated.View>
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
    loadingContent: {
        alignItems: 'center',
    },
    loadingIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: typography.body.fontSize,
        fontWeight: '600',
        color: colors.text.primary,
        marginTop: spacing.lg,
    },
    loadingSubtext: {
        fontSize: typography.caption.fontSize,
        color: colors.text.secondary,
        marginTop: spacing.xs,
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
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: borderRadius.full,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.sm,
        gap: spacing.sm,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.8)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 10,
    },
    searchBarFocused: {
        borderColor: colors.primary,
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        shadowOpacity: 0.2,
    },
    searchIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
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
    // Category Filter
    categoryScroll: {
        marginTop: spacing.sm,
        marginHorizontal: -spacing.md,
    },
    categoryContainer: {
        paddingHorizontal: spacing.md,
        gap: spacing.sm,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderWidth: 1,
        borderColor: colors.border,
        gap: spacing.xs,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    categoryChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    categoryChipText: {
        fontSize: typography.caption.fontSize,
        fontWeight: '600',
        color: colors.text.secondary,
    },
    categoryChipTextActive: {
        color: colors.text.inverse,
    },
    // Map Controls
    mapControls: {
        position: 'absolute',
        right: spacing.md,
        gap: spacing.sm,
    },
    mapButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.8)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
    closeButton: {
        position: 'absolute',
        right: spacing.md,
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.8)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
    // Custom map marker
    markerContainer: {
        alignItems: 'center',
        width: 40,
        height: 50,
    },
    markerBubble: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    markerTriangle: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 5,
        borderRightWidth: 5,
        borderTopWidth: 8,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        marginTop: -1,
    },
    // Empty State
    emptyState: {
        position: 'absolute',
        top: '45%',
        left: spacing.xl,
        right: spacing.xl,
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: borderRadius.xxl,
        padding: spacing.xl,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    emptyStateIcon: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    emptyTitle: {
        fontSize: typography.h5.fontSize,
        fontWeight: '700',
        color: colors.text.primary,
        marginBottom: spacing.xs,
    },
    emptyText: {
        fontSize: typography.body.fontSize,
        color: colors.text.secondary,
        textAlign: 'center',
    },
    emptyButton: {
        marginTop: spacing.lg,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        backgroundColor: colors.primary,
        borderRadius: borderRadius.full,
    },
    emptyButtonText: {
        fontSize: typography.body.fontSize,
        fontWeight: '600',
        color: colors.text.inverse,
    },
    // Bottom Card
    bottomCard: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.surface,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.lg,
        paddingTop: spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 20,
    },
    cardHandleContainer: {
        alignItems: 'center',
        paddingVertical: spacing.xs,
        marginBottom: spacing.sm,
    },
    cardHandle: {
        width: 48,
        height: 5,
        backgroundColor: colors.border,
        borderRadius: 3,
    },
    minimizedHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
    },
    minimizedEventInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: spacing.sm,
    },
    minimizedIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    minimizedTitle: {
        fontSize: typography.body.fontSize,
        fontWeight: '600',
        color: colors.text.primary,
    },
    minimizedSubtitle: {
        fontSize: typography.caption.fontSize,
        color: colors.text.secondary,
        marginTop: 2,
    },
    minimizedToggle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    minimizedCloseButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: spacing.sm,
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
        backgroundColor: colors.background,
        borderRadius: borderRadius.xl,
        padding: spacing.md,
        marginBottom: spacing.md,
    },
    routeInfoItem: {
        flex: 1,
        alignItems: 'center',
    },
    routeInfoIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    routeInfoValue: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.primary,
    },
    routeInfoLabel: {
        fontSize: typography.caption.fontSize,
        color: colors.text.secondary,
        marginTop: 2,
    },
    routeInfoDivider: {
        width: 1,
        height: 50,
        backgroundColor: colors.border,
        marginHorizontal: spacing.sm,
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
        backgroundColor: colors.primary + '08',
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.primary + '15',
    },
    destinationIconPulse: {
        marginRight: spacing.md,
    },
    destinationIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    destinationText: {
        flex: 1,
    },
    destinationLabel: {
        fontSize: typography.caption.fontSize,
        color: colors.text.secondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    destinationTitle: {
        fontSize: typography.body.fontSize,
        fontWeight: '600',
        color: colors.text.primary,
    },
    destinationSubtitle: {
        fontSize: typography.caption.fontSize,
        color: colors.text.secondary,
        marginTop: 2,
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
    eventImageContainer: {
        position: 'relative',
    },
    eventImage: {
        width: 110,
        height: 110,
        borderRadius: 20,
        backgroundColor: colors.background,
    },
    eventImagePlaceholder: {
        width: 110,
        height: 110,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    participantOverlay: {
        position: 'absolute',
        bottom: spacing.xs,
        right: spacing.xs,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.full,
        gap: 4,
    },
    participantCount: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.text.inverse,
    },
    eventDetails: {
        flex: 1,
        paddingRight: spacing.lg,
    },
    eventHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.xs,
    },
    categoryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary + '12',
        paddingHorizontal: spacing.sm,
        paddingVertical: 3,
        borderRadius: borderRadius.full,
        gap: 4,
    },
    categoryText: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.primary,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.warning + '15',
        paddingHorizontal: spacing.sm,
        paddingVertical: 3,
        borderRadius: borderRadius.full,
        gap: 3,
    },
    ratingText: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.warning,
    },
    eventTitle: {
        fontSize: typography.body.fontSize,
        fontWeight: '700',
        color: colors.text.primary,
        marginBottom: spacing.sm,
        lineHeight: 22,
    },
    eventInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        marginBottom: spacing.xs,
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
        paddingVertical: spacing.md + 4,
        borderRadius: borderRadius.full,
        gap: spacing.sm,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 6,
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
        backgroundColor: colors.background,
        paddingVertical: spacing.md + 4,
        borderRadius: borderRadius.full,
        borderWidth: 1.5,
        borderColor: colors.border,
        gap: spacing.xs,
    },
    secondaryButtonText: {
        fontSize: typography.body.fontSize,
        fontWeight: '600',
        color: colors.text.primary,
    },
});
