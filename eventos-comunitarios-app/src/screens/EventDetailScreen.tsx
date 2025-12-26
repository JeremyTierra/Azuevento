import React, { useState, useEffect } from 'react';
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT = 320;

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

    useEffect(() => {
        loadEventDetail();
    }, [route.params.eventId]);

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

                    {/* Back Button */}
                    <TouchableOpacity
                        style={[styles.headerButton, styles.backButton, { top: insets.top + spacing.sm }]}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
                    </TouchableOpacity>

                    {/* Favorite Button */}
                    <TouchableOpacity
                        style={[styles.headerButton, styles.favoriteButton, { top: insets.top + spacing.sm }]}
                        onPress={handleToggleFavorite}
                    >
                        <Ionicons
                            name={isFavorite ? 'heart' : 'heart-outline'}
                            size={24}
                            color={isFavorite ? colors.error : colors.text.primary}
                        />
                    </TouchableOpacity>

                    {/* Title and Info on Hero */}
                    <View style={styles.heroContent}>
                        {/* Category Badge - more visible */}
                        <View style={styles.heroCategoryBadge}>
                            <Ionicons
                                name={getCategoryIcon(event.categoryName) as any}
                                size={14}
                                color={colors.text.inverse}
                            />
                            <Text style={styles.heroCategoryText}>{event.categoryName}</Text>
                        </View>

                        <Text style={styles.heroTitle} numberOfLines={2}>{event.title}</Text>

                        {/* Organizer - more visible with background */}
                        <View style={styles.organizerContainer}>
                            <View style={styles.organizerAvatar}>
                                <Ionicons name="person" size={16} color={colors.primary} />
                            </View>
                            <View>
                                <Text style={styles.organizerLabel}>Organizado por</Text>
                                <Text style={styles.organizerName}>{event.organizerName}</Text>
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Quick Stats Row */}
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <View style={[styles.statIcon, { backgroundColor: colors.primary + '15' }]}>
                            <Ionicons name="people" size={20} color={colors.primary} />
                        </View>
                        <Text style={styles.statValue}>{event.participantCount}</Text>
                        <Text style={styles.statLabel}>Asistentes</Text>
                    </View>

                    <View style={styles.statDivider} />

                    <View style={styles.statItem}>
                        <View style={[styles.statIcon, { backgroundColor: colors.warning + '15' }]}>
                            <Ionicons name="star" size={20} color={colors.warning} />
                        </View>
                        <Text style={styles.statValue}>
                            {event.averageRating ? event.averageRating.toFixed(1) : '-'}
                        </Text>
                        <Text style={styles.statLabel}>
                            {event.ratingCount ? `${event.ratingCount} reseñas` : 'Sin reseñas'}
                        </Text>
                    </View>

                    <View style={styles.statDivider} />

                    <View style={styles.statItem}>
                        <View style={[styles.statIcon, { backgroundColor: colors.error + '15' }]}>
                            <Ionicons name="heart" size={20} color={colors.error} />
                        </View>
                        <Text style={styles.statValue}>{event.favoriteCount || 0}</Text>
                        <Text style={styles.statLabel}>Favoritos</Text>
                    </View>
                </View>

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

                    {/* Location Card */}
                    <TouchableOpacity
                        style={styles.infoCard}
                        activeOpacity={0.8}
                        onPress={handleNavigateToMap}
                    >
                        <View style={[styles.cardIconContainer, { backgroundColor: colors.success + '12' }]}>
                            <Ionicons name="location" size={24} color={colors.success} />
                        </View>
                        <View style={styles.cardContent}>
                            <Text style={styles.cardLabel}>Ubicación</Text>
                            <Text style={styles.cardValue} numberOfLines={2}>{event.location}</Text>
                            {(event.latitude && event.longitude) && (
                                <View style={styles.directionsHint}>
                                    <Ionicons name="map" size={14} color={colors.primary} />
                                    <Text style={styles.directionsText}>Ver en mapa</Text>
                                </View>
                            )}
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.text.disabled} />
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

                {/* Action Buttons Row */}
                <View style={styles.actionButtonsRow}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => navigation.navigate('Comments', {
                            eventId: event.id,
                            eventTitle: event.title
                        })}
                    >
                        <View style={[styles.actionButtonIcon, { backgroundColor: colors.primary + '12' }]}>
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
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => setShowRatingModal(true)}
                        >
                            <View style={[styles.actionButtonIcon, { backgroundColor: colors.warning + '12' }]}>
                                <Ionicons name="star-outline" size={22} color={colors.warning} />
                            </View>
                            <Text style={styles.actionButtonText}>Calificar</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity style={styles.actionButton} onPress={handleNavigateToMap}>
                        <View style={[styles.actionButtonIcon, { backgroundColor: colors.success + '12' }]}>
                            <Ionicons name="map-outline" size={22} color={colors.success} />
                        </View>
                        <Text style={styles.actionButtonText}>Ver en mapa</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton} onPress={handleOpenExternalMaps}>
                        <View style={[styles.actionButtonIcon, { backgroundColor: colors.secondary + '12' }]}>
                            <Ionicons name="navigate-outline" size={22} color={colors.secondary} />
                        </View>
                        <Text style={styles.actionButtonText}>Abrir Maps</Text>
                    </TouchableOpacity>
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
                animationType="fade"
                onRequestClose={() => setShowRatingModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Califica este evento</Text>
                            <TouchableOpacity onPress={() => setShowRatingModal(false)}>
                                <Ionicons name="close" size={24} color={colors.text.secondary} />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.modalSubtitle}>¿Cómo fue tu experiencia?</Text>

                        <View style={styles.modalRatingContainer}>
                            <RatingStars
                                value={userRating}
                                size={48}
                                editable
                                onChange={setUserRating}
                            />
                            <Text style={styles.ratingLabel}>
                                {userRating === 0 && 'Toca para calificar'}
                                {userRating === 1 && 'Muy malo'}
                                {userRating === 2 && 'Malo'}
                                {userRating === 3 && 'Regular'}
                                {userRating === 4 && 'Bueno'}
                                {userRating === 5 && '¡Excelente!'}
                            </Text>
                        </View>

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
                                <Text style={styles.modalButtonTextConfirm}>Enviar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Fixed Bottom Action */}
            {canAttend && (
                <View style={[styles.bottomAction, { paddingBottom: insets.bottom + spacing.md }]}>
                    <View style={styles.bottomActionContent}>
                        <View style={styles.priceSection}>
                            <Text style={styles.priceLabel}>Entrada</Text>
                            <Text style={styles.priceValue}>Gratis</Text>
                        </View>
                        <Button
                            title={event.hasUserRegistered ? 'Cancelar' : 'Asistir'}
                            variant={event.hasUserRegistered ? 'outline' : 'primary'}
                            onPress={handleAttendance}
                            loading={actionLoading}
                            style={styles.attendButton}
                        />
                    </View>
                </View>
            )}

            {isOrganizer && (
                <View style={[styles.bottomAction, styles.organizerBanner, { paddingBottom: insets.bottom + spacing.md }]}>
                    <Ionicons name="ribbon" size={20} color={colors.primary} />
                    <Text style={styles.organizerBannerText}>Eres el organizador de este evento</Text>
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
    backButton: {
        left: spacing.md,
    },
    favoriteButton: {
        right: spacing.md,
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
    organizerLabel: {
        fontSize: typography.caption.fontSize,
        color: colors.text.secondary,
    },
    organizerName: {
        fontSize: typography.body.fontSize,
        fontWeight: '700',
        color: colors.text.primary,
    },

    // Stats Row
    statsRow: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
        marginHorizontal: spacing.lg,
        marginTop: -spacing.xl,
        borderRadius: borderRadius.xl,
        padding: spacing.md,
        ...shadows.lg,
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
    actionButtonsRow: {
        flexDirection: 'row',
        paddingHorizontal: spacing.lg,
        gap: spacing.md,
        marginBottom: spacing.md,
    },
    actionButton: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        ...shadows.sm,
    },
    actionButtonIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    actionButtonText: {
        fontSize: typography.caption.fontSize,
        fontWeight: '500',
        color: colors.text.primary,
    },
    actionButtonBadge: {
        position: 'absolute',
        top: spacing.sm,
        right: spacing.sm,
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
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        ...shadows.lg,
    },
    bottomActionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.lg,
    },
    priceSection: {
        flex: 1,
    },
    priceLabel: {
        fontSize: typography.caption.fontSize,
        color: colors.text.secondary,
    },
    priceValue: {
        fontSize: typography.h3.fontSize,
        fontWeight: '700',
        color: colors.success,
    },
    attendButton: {
        flex: 2,
    },
    organizerBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        backgroundColor: colors.primaryLight,
    },
    organizerBannerText: {
        fontSize: typography.body.fontSize,
        color: colors.primary,
        fontWeight: '500',
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    modalContent: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        width: '100%',
        maxWidth: 400,
        ...shadows.lg,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    modalTitle: {
        fontSize: typography.h3.fontSize,
        fontWeight: '700',
        color: colors.text.primary,
    },
    modalSubtitle: {
        fontSize: typography.body.fontSize,
        color: colors.text.secondary,
        marginBottom: spacing.lg,
    },
    modalRatingContainer: {
        alignItems: 'center',
        paddingVertical: spacing.lg,
        backgroundColor: colors.background,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.lg,
    },
    ratingLabel: {
        marginTop: spacing.md,
        fontSize: typography.body.fontSize,
        color: colors.text.secondary,
        fontWeight: '500',
    },
    modalButtons: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    modalButton: {
        flex: 1,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
    },
    modalButtonCancel: {
        backgroundColor: colors.background,
    },
    modalButtonConfirm: {
        backgroundColor: colors.primary,
    },
    modalButtonDisabled: {
        backgroundColor: colors.text.disabled,
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
