import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Image,
    Alert,
    TouchableOpacity,
    Modal,
    Dimensions,
    Linking,
    Platform,
    StatusBar,
    Animated,
    Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ExploreStackParamList } from '../navigation/TabNavigator';
import { eventService } from '../services/eventService';
import { participantService } from '../services/participantService';
import { favoriteService } from '../services/favoriteService';
import { ratingService } from '../services/ratingService';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import { Loading } from '../components/Loading';
import { RatingStars } from '../components/RatingStars';
import type { Event } from '../types/models';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';
import { formatDate, formatTime, getCategoryIcon } from '../utils/formatters';
import MapView, { Marker } from 'react-native-maps';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT = 380; // Increased for Stitch design

type EventDetailRouteProp = RouteProp<{ EventDetail: { eventId: number } }, 'EventDetail'>;
type EventDetailNavigationProp = NativeStackNavigationProp<ExploreStackParamList, 'EventDetail'>;

export const EventDetailScreen: React.FC = () => {
    const route = useRoute<EventDetailRouteProp>();
    const navigation = useNavigation<EventDetailNavigationProp>();
    const { user } = useAuth();
    const insets = useSafeAreaInsets();
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [userRating, setUserRating] = useState(0);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        loadEventDetail();
    }, [route.params.eventId]);

    // Animate content when loaded
    useEffect(() => {
        if (event) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 400,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [event]);

    const loadEventDetail = async () => {
        try {
            const [eventData, favoriteStatus] = await Promise.all([
                eventService.getById(route.params.eventId),
                favoriteService.checkIsFavorite(route.params.eventId)
            ]);
            setEvent(eventData);
            setIsFavorite(favoriteStatus);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'No se pudo cargar el evento');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const handleToggleFavorite = async () => {
        if (!event) return;
        try {
            await favoriteService.toggleFavorite(event.id, isFavorite);
            setIsFavorite(!isFavorite);
        } catch (error) {
            console.error('Error toggling favorite:', error);
        }
    };

    const handleRateEvent = async (rating: number) => {
        if (!event) return;
        try {
            await ratingService.addRating(event.id, rating);
            setUserRating(rating);
            setShowRatingModal(false);
            loadEventDetail();
            Alert.alert('¡Gracias!', 'Tu calificación ha sido guardada.');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'No se pudo guardar la calificación');
        }
    };

    const handleAttendance = async () => {
        if (!event) return;

        setActionLoading(true);
        try {
            if (event.hasUserRegistered) {
                await participantService.cancelAttendance(event.id);
                Alert.alert('Éxito', 'Has cancelado tu asistencia');
            } else {
                await participantService.registerAttendance(event.id, 'CONFIRMED');
                Alert.alert('Éxito', '¡Te has registrado exitosamente!');
            }
            await loadEventDetail();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'No se pudo procesar la acción');
        } finally {
            setActionLoading(false);
        }
    };

    // Navigate to our internal MapScreen with directions
    const handleNavigateToMap = () => {
        if (!event) return;

        if (event.latitude && event.longitude) {
            // Navigate to Map tab with focusEventId
            navigation.getParent()?.navigate('Map', {
                screen: 'MapMain',
                params: { focusEventId: event.id }
            });
        } else {
            Alert.alert(
                'Sin ubicación',
                'Este evento no tiene coordenadas en el mapa',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Buscar en Google', onPress: () => handleOpenExternalMaps() }
                ]
            );
        }
    };

    // Open external maps app
    const handleOpenExternalMaps = () => {
        if (!event) return;

        if (event.latitude && event.longitude) {
            const url = Platform.select({
                ios: `maps:?daddr=${event.latitude},${event.longitude}`,
                android: `geo:${event.latitude},${event.longitude}?q=${event.latitude},${event.longitude}(${encodeURIComponent(event.title)})`,
            });

            if (url) {
                Linking.openURL(url).catch(() => {
                    // Fallback to Google Maps
                    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`);
                });
            }
        } else {
            const query = encodeURIComponent(event.location);
            Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
        }
    };

    // Share event
    const handleShare = async () => {
        if (!event) return;
        try {
            await Share.share({
                title: event.title,
                message: `¡Mira este evento! 🎉\n\n${event.title}\n📍 ${event.location}\n📅 ${formatDate(event.startDate)} a las ${formatTime(event.startDate)}\n\n${event.description?.substring(0, 100)}...`,
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    if (loading || !event) {
        return <Loading message="Cargando evento..." />;
    }

    const isOrganizer = event.isOrganizer;
    const canAttend = event.status === 'PUBLISHED' && !isOrganizer;

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero Section */}
                <TouchableOpacity
                    style={styles.heroSection}
                    activeOpacity={0.95}
                    onPress={() => event.coverImage && setShowImageModal(true)}
                >
                    {event.coverImage ? (
                        <>
                            <Image source={{ uri: event.coverImage }} style={styles.heroImage} />
                            {/* View Image Hint */}
                            <View style={[styles.viewImageHint, { top: insets.top + spacing.sm }]}>
                                <Ionicons name="expand-outline" size={16} color={colors.text.inverse} />
                                <Text style={styles.viewImageHintText}>Ver imagen</Text>
                            </View>
                        </>
                    ) : (
                        <View style={styles.heroPlaceholder}>
                            <Ionicons
                                name={getCategoryIcon(event.categoryName) as any}
                                size={80}
                                color={colors.text.inverse + '40'}
                            />
                        </View>
                    )}

                    {/* Gradient Overlay - stronger for better text visibility */}
                    <LinearGradient
                        colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.8)']}
                        locations={[0, 0.3, 1]}
                        style={styles.heroGradient}
                    />

                    {/* Back Button - Stitch style with dark blur */}
                    <TouchableOpacity
                        style={[styles.headerButtonBlur, { top: insets.top + spacing.sm, left: spacing.md }]}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={22} color={colors.text.inverse} />
                    </TouchableOpacity>

                    {/* Header Right Buttons - Stitch style */}
                    <View style={[styles.headerRightButtons, { top: insets.top + spacing.sm }]}>
                        <TouchableOpacity
                            style={styles.headerButtonBlurInline}
                            onPress={handleShare}
                        >
                            <Ionicons name="share-outline" size={20} color={colors.text.inverse} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.headerButtonBlurInline}
                            onPress={handleToggleFavorite}
                        >
                            <Ionicons
                                name={isFavorite ? 'heart' : 'heart-outline'}
                                size={22}
                                color={isFavorite ? '#FF6B6B' : colors.text.inverse}
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Organizer Info on Hero */}
                    <View style={styles.heroContent}>
                        <View style={styles.organizerContainer}>
                            <View style={styles.organizerAvatar}>
                                <Ionicons name="person" size={16} color={colors.primary} />
                            </View>
                            <View style={styles.organizerInfo}>
                                <Text style={styles.organizerLabel}>Organizado por</Text>
                                <Text style={styles.organizerName}>{event.organizerName}</Text>
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Content Section - Overlaps Hero (Stitch style) */}
                <Animated.View
                    style={[
                        styles.contentSection,
                        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
                    ]}
                >
                    {/* Category Badge */}
                    <View style={styles.categoryBadgeContainer}>
                        <View style={styles.categoryBadge}>
                            <Ionicons
                                name={getCategoryIcon(event.categoryName) as any}
                                size={14}
                                color={colors.primary}
                            />
                            <Text style={styles.categoryBadgeText}>{event.categoryName?.toUpperCase()}</Text>
                        </View>
                    </View>

                    {/* Event Title in Content */}
                    <Text style={styles.contentTitle}>{event.title}</Text>

                    {/* Quick Stats Row */}
                    <View style={styles.statsRow}>
                        <TouchableOpacity style={styles.statItem} activeOpacity={0.7}>
                            <View style={[styles.statIcon, { backgroundColor: colors.primary + '15' }]}>
                                <Ionicons name="people" size={20} color={colors.primary} />
                            </View>
                            <Text style={styles.statValue}>{event.participantCount}</Text>
                            <Text style={styles.statLabel}>Asistentes</Text>
                        </TouchableOpacity>

                        <View style={styles.statDivider} />

                        <TouchableOpacity
                            style={styles.statItem}
                            activeOpacity={0.7}
                            onPress={() => event.hasUserRegistered && setShowRatingModal(true)}
                        >
                            <View style={[styles.statIcon, { backgroundColor: colors.warning + '15' }]}>
                                <Ionicons name="star" size={20} color={colors.warning} />
                            </View>
                            <Text style={styles.statValue}>
                                {event.averageRating ? event.averageRating.toFixed(1) : '-'}
                            </Text>
                            <Text style={styles.statLabel}>
                                {event.ratingCount ? `${event.ratingCount} reseñas` : 'Sin reseñas'}
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.statDivider} />

                        <TouchableOpacity
                            style={styles.statItem}
                            activeOpacity={0.7}
                            onPress={handleToggleFavorite}
                        >
                            <View style={[styles.statIcon, { backgroundColor: colors.error + '15' }]}>
                                <Ionicons
                                    name={isFavorite ? 'heart' : 'heart-outline'}
                                    size={20}
                                    color={colors.error}
                                />
                            </View>
                            <Text style={styles.statValue}>{event.favoriteCount || 0}</Text>
                            <Text style={styles.statLabel}>Favoritos</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>

                {/* Attendees Section (Stitch style - overlapping avatars) */}
                {event.participantCount > 0 && (
                    <View style={styles.attendeesSection}>
                        <View style={styles.attendeesAvatars}>
                            {/* Simulated overlapping avatars */}
                            {[...Array(Math.min(event.participantCount, 4))].map((_, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.attendeeAvatar,
                                        { marginLeft: index > 0 ? -12 : 0, zIndex: 4 - index }
                                    ]}
                                >
                                    <Ionicons name="person" size={16} color={colors.primary} />
                                </View>
                            ))}
                            {event.participantCount > 4 && (
                                <View style={[styles.attendeeAvatarMore, { marginLeft: -12 }]}>
                                    <Text style={styles.attendeeAvatarMoreText}>
                                        +{event.participantCount - 4}
                                    </Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.attendeesText}>
                            {event.participantCount} {event.participantCount === 1 ? 'persona asistirá' : 'personas asistirán'}
                        </Text>
                    </View>
                )}

                {/* Info Cards */}
                <View style={styles.cardsContainer}>
                    {/* Date Card */}
                    <TouchableOpacity style={styles.infoCard} activeOpacity={0.8}>
                        <View style={[styles.cardIconContainer, { backgroundColor: colors.primary + '12' }]}>
                            <Ionicons name="calendar" size={24} color={colors.primary} />
                        </View>
                        <View style={styles.cardContent}>
                            <Text style={styles.cardLabel}>Fecha y hora</Text>
                            <Text style={styles.cardValue}>{formatDate(event.startDate)}</Text>
                            <Text style={styles.cardSubvalue}>{formatTime(event.startDate)}</Text>
                            {event.endDate && (
                                <Text style={styles.cardHint}>
                                    Hasta {formatDate(event.endDate)} • {formatTime(event.endDate)}
                                </Text>
                            )}
                        </View>
                    </TouchableOpacity>

                    {/* Location Card with Map Preview (Stitch style) */}
                    <TouchableOpacity
                        style={styles.locationCard}
                        activeOpacity={0.8}
                        onPress={handleNavigateToMap}
                    >
                        <View style={styles.locationCardHeader}>
                            <View style={[styles.cardIconContainer, { backgroundColor: colors.success + '12' }]}>
                                <Ionicons name="location" size={24} color={colors.success} />
                            </View>
                            <View style={styles.cardContent}>
                                <Text style={styles.cardLabel}>Ubicación</Text>
                                <Text style={styles.cardValue} numberOfLines={2}>{event.location}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={colors.text.disabled} />
                        </View>
                        {/* Mini Map Preview */}
                        {(event.latitude && event.longitude) && (
                            <View style={styles.miniMapContainer}>
                                <MapView
                                    style={styles.miniMap}
                                    initialRegion={{
                                        latitude: event.latitude,
                                        longitude: event.longitude,
                                        latitudeDelta: 0.005,
                                        longitudeDelta: 0.005,
                                    }}
                                    scrollEnabled={false}
                                    zoomEnabled={false}
                                    rotateEnabled={false}
                                    pitchEnabled={false}
                                >
                                    <Marker
                                        coordinate={{
                                            latitude: event.latitude,
                                            longitude: event.longitude,
                                        }}
                                    />
                                </MapView>
                                <View style={styles.miniMapOverlay}>
                                    <View style={styles.miniMapButton}>
                                        <Ionicons name="navigate" size={16} color={colors.text.inverse} />
                                        <Text style={styles.miniMapButtonText}>Cómo llegar</Text>
                                    </View>
                                </View>
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* Capacity Card (if max capacity set) */}
                    {event.maxCapacity && (
                        <View style={styles.infoCard}>
                            <View style={[styles.cardIconContainer, { backgroundColor: colors.secondary + '12' }]}>
                                <Ionicons name="ticket" size={24} color={colors.secondary} />
                            </View>
                            <View style={styles.cardContent}>
                                <Text style={styles.cardLabel}>Capacidad</Text>
                                <Text style={styles.cardValue}>
                                    {event.participantCount} / {event.maxCapacity}
                                </Text>
                                <View style={styles.capacityBar}>
                                    <View
                                        style={[
                                            styles.capacityFill,
                                            {
                                                width: `${Math.min((event.participantCount / event.maxCapacity) * 100, 100)}%`,
                                                backgroundColor: event.participantCount >= event.maxCapacity
                                                    ? colors.error
                                                    : colors.success
                                            }
                                        ]}
                                    />
                                </View>
                                <Text style={styles.cardHint}>
                                    {event.maxCapacity - event.participantCount > 0
                                        ? `${event.maxCapacity - event.participantCount} lugares disponibles`
                                        : 'Evento lleno'}
                                </Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* Action Buttons - Horizontal Scroll */}
                <View style={styles.actionButtonsSection}>
                    <Text style={styles.actionSectionTitle}>Acciones rápidas</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.actionButtonsScroll}
                    >
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => navigation.navigate('Comments', {
                                eventId: event.id,
                                eventTitle: event.title
                            })}
                        >
                            <View style={[styles.actionButtonIcon, { backgroundColor: colors.primary + '15' }]}>
                                <Ionicons name="chatbubble-outline" size={22} color={colors.primary} />
                            </View>
                            <Text style={styles.actionButtonText}>Comentarios</Text>
                            {event.commentCount > 0 && (
                                <View style={styles.actionButtonBadge}>
                                    <Text style={styles.actionButtonBadgeText}>{event.commentCount}</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        {event.hasUserRegistered && (
                            <>
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() => setShowRatingModal(true)}
                                >
                                    <View style={[styles.actionButtonIcon, { backgroundColor: colors.warning + '15' }]}>
                                        <Ionicons name="star-outline" size={22} color={colors.warning} />
                                    </View>
                                    <Text style={styles.actionButtonText}>Calificar</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.actionButton, styles.actionButtonHighlight]}
                                    onPress={() => navigation.navigate('MyTicket', {
                                        eventId: event.id,
                                        eventTitle: event.title
                                    })}
                                >
                                    <View style={[styles.actionButtonIcon, { backgroundColor: colors.accent + '20' }]}>
                                        <Ionicons name="qr-code" size={22} color={colors.accent} />
                                    </View>
                                    <Text style={[styles.actionButtonText, { color: colors.accent }]}>Mi Entrada</Text>
                                </TouchableOpacity>
                            </>
                        )}

                        {isOrganizer && (
                            <TouchableOpacity
                                style={[styles.actionButton, styles.actionButtonHighlight]}
                                onPress={() => navigation.navigate('Scanner' as any, {
                                    eventId: event.id,
                                    eventTitle: event.title
                                })}
                            >
                                <View style={[styles.actionButtonIcon, { backgroundColor: colors.secondary + '20' }]}>
                                    <Ionicons name="scan" size={22} color={colors.secondary} />
                                </View>
                                <Text style={[styles.actionButtonText, { color: colors.secondary }]}>Escanear</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity style={styles.actionButton} onPress={handleNavigateToMap}>
                            <View style={[styles.actionButtonIcon, { backgroundColor: colors.success + '15' }]}>
                                <Ionicons name="map-outline" size={22} color={colors.success} />
                            </View>
                            <Text style={styles.actionButtonText}>Ver mapa</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton} onPress={handleOpenExternalMaps}>
                            <View style={[styles.actionButtonIcon, { backgroundColor: colors.info + '15' }]}>
                                <Ionicons name="navigate-outline" size={22} color={colors.info} />
                            </View>
                            <Text style={styles.actionButtonText}>Cómo llegar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                            <View style={[styles.actionButtonIcon, { backgroundColor: colors.text.secondary + '15' }]}>
                                <Ionicons name="share-social-outline" size={22} color={colors.text.secondary} />
                            </View>
                            <Text style={styles.actionButtonText}>Compartir</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>

                {/* Description Section */}
                <View style={styles.descriptionSection}>
                    <Text style={styles.sectionTitle}>Acerca del evento</Text>
                    <Text style={styles.description}>{event.description}</Text>
                </View>

                {/* Status Badge (if not published) */}
                {event.status !== 'PUBLISHED' && (
                    <View style={[styles.statusBanner, getStatusBannerStyle(event.status)]}>
                        <Ionicons
                            name={getStatusIcon(event.status) as any}
                            size={20}
                            color={getStatusColor(event.status)}
                        />
                        <Text style={[styles.statusBannerText, { color: getStatusColor(event.status) }]}>
                            {getStatusText(event.status)}
                        </Text>
                    </View>
                )}

                {/* Bottom Spacing for fixed action bar */}
                <View style={{ height: 180 }} />
            </ScrollView>

            {/* Full Image Modal */}
            <Modal
                visible={showImageModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowImageModal(false)}
                statusBarTranslucent
            >
                <View style={styles.imageModalOverlay}>
                    <StatusBar barStyle="light-content" />
                    <TouchableOpacity
                        style={[styles.imageModalCloseButton, { top: insets.top + spacing.md }]}
                        onPress={() => setShowImageModal(false)}
                    >
                        <Ionicons name="close" size={28} color={colors.text.inverse} />
                    </TouchableOpacity>

                    {event.coverImage && (
                        <Image
                            source={{ uri: event.coverImage }}
                            style={styles.fullImage}
                            resizeMode="contain"
                        />
                    )}

                    {/* Image info at bottom */}
                    <View style={[styles.imageModalInfo, { paddingBottom: insets.bottom + spacing.lg }]}>
                        <Text style={styles.imageModalTitle}>{event.title}</Text>
                        <Text style={styles.imageModalHint}>Imagen de portada del evento</Text>
                    </View>
                </View>
            </Modal>

            {/* Rating Modal */}
            <Modal
                visible={showRatingModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowRatingModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {/* Handle indicator */}
                        <View style={styles.modalHandle} />

                        {/* Icon and Title */}
                        <View style={styles.modalIconContainer}>
                            <View style={styles.modalIconCircle}>
                                <Ionicons name="star" size={32} color={colors.warning} />
                            </View>
                        </View>

                        <Text style={styles.modalTitle}>¿Qué te pareció?</Text>
                        <Text style={styles.modalSubtitle}>Tu opinión ayuda a otros a descubrir eventos</Text>

                        {/* Rating Stars */}
                        <View style={styles.modalRatingContainer}>
                            <RatingStars
                                value={userRating}
                                size={48}
                                editable
                                onChange={setUserRating}
                            />
                            <View style={[
                                styles.ratingLabelContainer,
                                userRating > 0 && styles.ratingLabelContainerActive
                            ]}>
                                <Text style={[
                                    styles.ratingLabel,
                                    userRating > 0 && styles.ratingLabelActive
                                ]}>
                                    {userRating === 0 && 'Toca una estrella'}
                                    {userRating === 1 && 'Muy malo'}
                                    {userRating === 2 && 'Podría mejorar'}
                                    {userRating === 3 && 'Regular'}
                                    {userRating === 4 && '¡Muy bueno!'}
                                    {userRating === 5 && '¡Increíble!'}
                                </Text>
                            </View>
                        </View>

                        {/* Buttons */}
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonCancel]}
                                onPress={() => setShowRatingModal(false)}
                            >
                                <Text style={styles.modalButtonTextCancel}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.modalButton,
                                    styles.modalButtonConfirm,
                                    userRating === 0 && styles.modalButtonDisabled
                                ]}
                                onPress={() => handleRateEvent(userRating)}
                                disabled={userRating === 0}
                            >
                                <Ionicons
                                    name="send"
                                    size={18}
                                    color={colors.text.inverse}
                                    style={{ marginRight: spacing.xs }}
                                />
                                <Text style={styles.modalButtonTextConfirm}>Enviar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Fixed Bottom Action (Stitch style - two buttons) */}
            {canAttend && (
                <View style={[styles.bottomAction, { paddingBottom: insets.bottom + spacing.md }]}>
                    {/* Gradient fade at top */}
                    <LinearGradient
                        colors={['transparent', colors.surface]}
                        style={styles.bottomActionGradient}
                        pointerEvents="none"
                    />
                    <View style={styles.bottomActionContent}>
                        {/* Comments Button (Stitch style) */}
                        <TouchableOpacity
                            style={styles.bottomCommentsButton}
                            onPress={() => navigation.navigate('Comments', {
                                eventId: event.id,
                                eventTitle: event.title
                            })}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="chatbubble-outline" size={20} color={colors.text.primary} />
                            <Text style={styles.bottomCommentsButtonText}>Comentarios</Text>
                            {event.commentCount > 0 && (
                                <View style={styles.commentBadge}>
                                    <Text style={styles.commentBadgeText}>{event.commentCount}</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        {/* Registration Button (Stitch style) */}
                        <TouchableOpacity
                            style={[
                                styles.bottomMainButton,
                                event.hasUserRegistered ? styles.bottomMainButtonCancel : styles.bottomMainButtonPrimary
                            ]}
                            onPress={handleAttendance}
                            disabled={actionLoading}
                            activeOpacity={0.8}
                        >
                            {actionLoading ? (
                                <Text style={[
                                    styles.bottomMainButtonText,
                                    event.hasUserRegistered && styles.bottomMainButtonTextCancel
                                ]}>...</Text>
                            ) : (
                                <>
                                    <Ionicons
                                        name={event.hasUserRegistered ? 'close-circle' : 'ticket'}
                                        size={20}
                                        color={event.hasUserRegistered ? colors.error : colors.text.inverse}
                                    />
                                    <Text style={[
                                        styles.bottomMainButtonText,
                                        event.hasUserRegistered && styles.bottomMainButtonTextCancel
                                    ]}>
                                        {event.hasUserRegistered ? 'Cancelar' : 'Inscribirse'}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {isOrganizer && (
                <View style={[styles.bottomAction, styles.organizerBanner, { paddingBottom: insets.bottom + spacing.md }]}>
                    <View style={styles.organizerBannerIcon}>
                        <Ionicons name="ribbon" size={20} color={colors.primary} />
                    </View>
                    <View style={styles.organizerBannerContent}>
                        <Text style={styles.organizerBannerTitle}>Eres el organizador</Text>
                        <Text style={styles.organizerBannerText}>Gestiona tu evento desde Mis Eventos</Text>
                    </View>
                </View>
            )}
        </View>
    );
};

const getStatusText = (status: string): string => {
    const statusMap: Record<string, string> = {
        DRAFT: 'Este evento es un borrador',
        PUBLISHED: 'Publicado',
        CANCELLED: 'Este evento ha sido cancelado',
        ARCHIVED: 'Este evento ha sido archivado',
    };
    return statusMap[status] || status;
};

const getStatusIcon = (status: string): string => {
    const iconMap: Record<string, string> = {
        DRAFT: 'create-outline',
        CANCELLED: 'close-circle-outline',
        ARCHIVED: 'archive-outline',
    };
    return iconMap[status] || 'information-circle-outline';
};

const getStatusColor = (status: string): string => {
    switch (status) {
        case 'DRAFT':
            return colors.warning;
        case 'CANCELLED':
            return colors.error;
        case 'ARCHIVED':
            return colors.text.secondary;
        default:
            return colors.text.primary;
    }
};

const getStatusBannerStyle = (status: string) => {
    switch (status) {
        case 'DRAFT':
            return { backgroundColor: colors.warning + '15' };
        case 'CANCELLED':
            return { backgroundColor: colors.error + '15' };
        case 'ARCHIVED':
            return { backgroundColor: colors.text.disabled + '15' };
        default:
            return {};
    }
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },

    // Hero Section
    heroSection: {
        height: HERO_HEIGHT,
        position: 'relative',
    },
    heroImage: {
        width: '100%',
        height: '100%',
        backgroundColor: colors.surfaceDark,
    },
    heroPlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroGradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    viewImageHint: {
        position: 'absolute',
        left: spacing.md + 52,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs + 2,
        borderRadius: borderRadius.full,
        gap: spacing.xs,
    },
    viewImageHintText: {
        fontSize: typography.caption.fontSize,
        color: colors.text.inverse,
        fontWeight: '500',
    },
    headerButton: {
        position: 'absolute',
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        ...shadows.md,
    },
    headerButtonBlur: {
        position: 'absolute',
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerButtonBlurInline: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backButton: {
        left: spacing.md,
    },
    headerRightButtons: {
        position: 'absolute',
        right: spacing.md,
        flexDirection: 'row',
        gap: spacing.sm,
    },
    headerButtonInline: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        ...shadows.md,
    },
    heroContent: {
        position: 'absolute',
        bottom: spacing.lg,
        left: spacing.lg,
        right: spacing.lg,
    },
    heroCategoryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs + 2,
        borderRadius: borderRadius.full,
        gap: spacing.xs,
        marginBottom: spacing.sm,
    },
    heroCategoryText: {
        fontSize: typography.bodySmall.fontSize,
        fontWeight: '700',
        color: colors.text.inverse,
    },
    heroTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: colors.text.inverse,
        marginBottom: spacing.md,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
        letterSpacing: -0.5,
    },
    organizerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.95)',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.lg,
        gap: spacing.sm,
        alignSelf: 'flex-start',
        ...shadows.md,
    },
    organizerAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    organizerInfo: {
        flex: 1,
    },
    organizerLabel: {
        fontSize: typography.caption.fontSize,
        color: colors.text.secondary,
    },
    organizerName: {
        fontSize: typography.body.fontSize,
        fontWeight: '700',
        color: colors.text.primary,
    },

    // Content Section (Stitch style - overlaps hero)
    contentSection: {
        backgroundColor: colors.surface,
        marginTop: -24,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: spacing.lg,
        paddingHorizontal: spacing.lg,
    },
    categoryBadgeContainer: {
        marginBottom: spacing.sm,
    },
    categoryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: colors.primary + '15',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs + 2,
        borderRadius: borderRadius.full,
        gap: spacing.xs,
    },
    categoryBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.primary,
        letterSpacing: 0.5,
    },
    contentTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.text.primary,
        marginBottom: spacing.md,
        letterSpacing: -0.5,
    },

    // Stats Row
    statsRow: {
        flexDirection: 'row',
        backgroundColor: colors.background,
        borderRadius: borderRadius.xl,
        padding: spacing.md,
        marginBottom: spacing.md,
    },

    // Attendees Section (Stitch style)
    attendeesSection: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        backgroundColor: colors.surface,
        gap: spacing.md,
    },
    attendeesAvatars: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    attendeeAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.surface,
    },
    attendeeAvatarMore: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.surface,
    },
    attendeeAvatarMoreText: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.text.inverse,
    },
    attendeesText: {
        flex: 1,
        fontSize: typography.bodySmall.fontSize,
        color: colors.text.secondary,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    statValue: {
        fontSize: typography.h4.fontSize,
        fontWeight: '700',
        color: colors.text.primary,
    },
    statLabel: {
        fontSize: typography.caption.fontSize,
        color: colors.text.secondary,
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        backgroundColor: colors.border,
        marginVertical: spacing.sm,
    },

    // Info Cards
    cardsContainer: {
        padding: spacing.lg,
        gap: spacing.md,
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        ...shadows.sm,
    },
    // Location Card with Map (Stitch style)
    locationCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xl,
        overflow: 'hidden',
        ...shadows.sm,
    },
    locationCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
    },
    miniMapContainer: {
        height: 120,
        position: 'relative',
    },
    miniMap: {
        ...StyleSheet.absoluteFillObject,
    },
    miniMapOverlay: {
        position: 'absolute',
        bottom: spacing.sm,
        right: spacing.sm,
    },
    miniMapButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        gap: spacing.xs,
        ...shadows.md,
    },
    miniMapButtonText: {
        fontSize: typography.bodySmall.fontSize,
        fontWeight: '600',
        color: colors.text.inverse,
    },
    cardIconContainer: {
        width: 52,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    cardContent: {
        flex: 1,
    },
    cardLabel: {
        fontSize: typography.caption.fontSize,
        color: colors.text.secondary,
        marginBottom: 2,
    },
    cardValue: {
        fontSize: typography.body.fontSize,
        fontWeight: '600',
        color: colors.text.primary,
    },
    cardSubvalue: {
        fontSize: typography.bodySmall.fontSize,
        color: colors.text.secondary,
        marginTop: 2,
    },
    cardHint: {
        fontSize: typography.caption.fontSize,
        color: colors.text.disabled,
        marginTop: spacing.xs,
    },
    directionsHint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        marginTop: spacing.xs,
    },
    directionsText: {
        fontSize: typography.caption.fontSize,
        color: colors.primary,
        fontWeight: '500',
    },
    capacityBar: {
        height: 6,
        backgroundColor: colors.border,
        borderRadius: 3,
        marginTop: spacing.sm,
        overflow: 'hidden',
    },
    capacityFill: {
        height: '100%',
        borderRadius: 3,
    },

    // Action Buttons
    actionButtonsSection: {
        marginBottom: spacing.md,
    },
    actionSectionTitle: {
        fontSize: typography.caption.fontSize,
        fontWeight: '600',
        color: colors.text.secondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginLeft: spacing.lg,
        marginBottom: spacing.sm,
    },
    actionButtonsScroll: {
        paddingHorizontal: spacing.lg,
        gap: spacing.sm,
    },
    actionButton: {
        alignItems: 'center',
        backgroundColor: colors.surface,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.xl,
        minWidth: 90,
        borderWidth: 1,
        borderColor: colors.border,
    },
    actionButtonHighlight: {
        borderColor: colors.accent + '40',
        backgroundColor: colors.accent + '08',
    },
    actionButtonIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    actionButtonText: {
        fontSize: typography.caption.fontSize,
        fontWeight: '600',
        color: colors.text.primary,
    },
    actionButtonBadge: {
        position: 'absolute',
        top: spacing.xs,
        right: spacing.xs,
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.xs,
        paddingVertical: 2,
        borderRadius: borderRadius.full,
        minWidth: 20,
        alignItems: 'center',
    },
    actionButtonBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.text.inverse,
    },

    // Description
    descriptionSection: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
    },
    sectionTitle: {
        fontSize: typography.h4.fontSize,
        fontWeight: '700',
        color: colors.text.primary,
        marginBottom: spacing.md,
    },
    description: {
        fontSize: typography.body.fontSize,
        color: colors.text.secondary,
        lineHeight: 24,
    },

    // Status Banner
    statusBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: spacing.lg,
        marginTop: spacing.lg,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        gap: spacing.sm,
    },
    statusBannerText: {
        fontSize: typography.body.fontSize,
        fontWeight: '600',
    },

    // Bottom Action
    bottomAction: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.surface,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        borderTopLeftRadius: borderRadius.xxl,
        borderTopRightRadius: borderRadius.xxl,
        ...shadows.xl,
    },
    bottomActionGradient: {
        position: 'absolute',
        top: -24,
        left: 0,
        right: 0,
        height: 24,
    },
    bottomActionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    priceSection: {
        flex: 1,
    },
    priceLabel: {
        fontSize: typography.caption.fontSize,
        color: colors.text.secondary,
        marginBottom: 2,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    priceValue: {
        fontSize: typography.h3.fontSize,
        fontWeight: '700',
        color: colors.success,
    },
    freeBadge: {
        marginLeft: spacing.xs,
    },
    attendButton: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.md + 2,
        borderRadius: borderRadius.lg,
        gap: spacing.sm,
    },
    attendButtonPrimary: {
        backgroundColor: colors.primary,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    attendButtonCancel: {
        backgroundColor: colors.error + '10',
        borderWidth: 1.5,
        borderColor: colors.error + '30',
    },
    attendButtonText: {
        fontSize: typography.body.fontSize,
        fontWeight: '700',
        color: colors.text.inverse,
    },
    attendButtonTextCancel: {
        color: colors.error,
    },
    // Stitch style bottom buttons
    bottomCommentsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.lg,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        gap: spacing.sm,
    },
    bottomCommentsButtonText: {
        fontSize: typography.bodySmall.fontSize,
        fontWeight: '600',
        color: colors.text.primary,
    },
    commentBadge: {
        backgroundColor: colors.primary,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        minWidth: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    commentBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.text.inverse,
    },
    bottomMainButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        gap: spacing.sm,
    },
    bottomMainButtonPrimary: {
        backgroundColor: colors.primary,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    bottomMainButtonCancel: {
        backgroundColor: colors.error + '10',
        borderWidth: 1.5,
        borderColor: colors.error + '30',
    },
    bottomMainButtonText: {
        fontSize: typography.body.fontSize,
        fontWeight: '700',
        color: colors.text.inverse,
    },
    bottomMainButtonTextCancel: {
        color: colors.error,
    },
    organizerBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        backgroundColor: colors.primary + '08',
        borderWidth: 1,
        borderColor: colors.primary + '20',
    },
    organizerBannerIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    organizerBannerContent: {
        flex: 1,
    },
    organizerBannerTitle: {
        fontSize: typography.body.fontSize,
        fontWeight: '700',
        color: colors.primary,
    },
    organizerBannerText: {
        fontSize: typography.caption.fontSize,
        color: colors.text.secondary,
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: borderRadius.xxl,
        borderTopRightRadius: borderRadius.xxl,
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing.xl,
        paddingTop: spacing.md,
        ...shadows.xl,
    },
    modalHandle: {
        width: 40,
        height: 4,
        backgroundColor: colors.border,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: spacing.lg,
    },
    modalIconContainer: {
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    modalIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.warning + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: typography.h3.fontSize,
        fontWeight: '700',
        color: colors.text.primary,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: typography.body.fontSize,
        color: colors.text.secondary,
        textAlign: 'center',
        marginTop: spacing.xs,
        marginBottom: spacing.lg,
    },
    modalRatingContainer: {
        alignItems: 'center',
        paddingVertical: spacing.xl,
        backgroundColor: colors.background,
        borderRadius: borderRadius.xl,
        marginBottom: spacing.lg,
    },
    ratingLabelContainer: {
        marginTop: spacing.md,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        backgroundColor: 'transparent',
    },
    ratingLabelContainerActive: {
        backgroundColor: colors.warning + '15',
    },
    ratingLabel: {
        fontSize: typography.body.fontSize,
        color: colors.text.secondary,
        fontWeight: '500',
    },
    ratingLabelActive: {
        color: colors.warning,
        fontWeight: '600',
    },
    modalButtons: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    modalButton: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: spacing.md + 2,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalButtonCancel: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
    },
    modalButtonConfirm: {
        backgroundColor: colors.primary,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    modalButtonDisabled: {
        backgroundColor: colors.text.disabled,
        shadowOpacity: 0,
    },
    modalButtonTextCancel: {
        fontSize: typography.body.fontSize,
        fontWeight: '600',
        color: colors.text.secondary,
    },
    modalButtonTextConfirm: {
        fontSize: typography.body.fontSize,
        fontWeight: '600',
        color: colors.text.inverse,
    },

    // Image Modal
    imageModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageModalCloseButton: {
        position: 'absolute',
        right: spacing.md,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    fullImage: {
        width: SCREEN_WIDTH,
        height: SCREEN_WIDTH * 0.75,
    },
    imageModalInfo: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: spacing.lg,
        backgroundColor: 'rgba(0,0,0,0.7)',
    },
    imageModalTitle: {
        fontSize: typography.h4.fontSize,
        fontWeight: '700',
        color: colors.text.inverse,
        marginBottom: spacing.xs,
    },
    imageModalHint: {
        fontSize: typography.bodySmall.fontSize,
        color: colors.text.inverse,
        opacity: 0.7,
    },
});
