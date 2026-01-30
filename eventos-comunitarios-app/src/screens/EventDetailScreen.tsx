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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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
            // Reload event to get updated average
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
                // Cancel attendance
                await participantService.cancelAttendance(event.id);
                Alert.alert('Éxito', 'Has cancelado tu asistencia');
            } else {
                // Register attendance
                await participantService.registerAttendance(event.id, 'CONFIRMED');
                Alert.alert('Éxito', '¡Te has registrado exitosamente!');
            }
            // Reload event to update status
            await loadEventDetail();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'No se pudo procesar la acción');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading || !event) {
        return <Loading message="Cargando evento..." />;
    }

    const isOrganizer = event.isOrganizer;
    const canAttend = event.status === 'PUBLISHED' && !isOrganizer;

    return (
        <View style={styles.container}>
            {/* Favorite Button - Absolute Position */}
            <TouchableOpacity
                style={[styles.favoriteHeaderButton, { top: spacing.md + insets.top }]}
                onPress={handleToggleFavorite}
                activeOpacity={0.7}
            >
                <View style={styles.favoriteButtonCircle}>
                    <Ionicons
                        name={isFavorite ? 'heart' : 'heart-outline'}
                        size={24}
                        color={isFavorite ? colors.error : colors.text.primary}
                    />
                </View>
            </TouchableOpacity>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Cover Image */}
                {event.coverImage ? (
                    <Image source={{ uri: event.coverImage }} style={styles.coverImage} />
                ) : (
                    <View style={styles.coverPlaceholder}>
                        <Ionicons name="calendar" size={64} color={colors.text.inverse} />
                    </View>
                )}

                {/* Content */}
                <View style={styles.content}>
                    {/* Category Badge */}
                    <View style={styles.categoryBadge}>
                        <Ionicons
                            name={getCategoryIcon(event.categoryName) as any}
                            size={16}
                            color={colors.primary}
                        />
                        <Text style={styles.categoryText}>{event.categoryName}</Text>
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>{event.title}</Text>

                    {/* Organizer */}
                    <View style={styles.row}>
                        <Ionicons name="person-outline" size={20} color={colors.primary} />
                        <Text style={styles.organizerText}>
                            Organizado por <Text style={styles.organizerName}>{event.organizerName}</Text>
                        </Text>
                    </View>

                    {/* Date & Time */}
                    <View style={styles.infoSection}>
                        <View style={styles.row}>
                            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                            <View>
                                <Text style={styles.infoLabel}>Fecha y hora</Text>
                                <Text style={styles.infoValue}>
                                    {formatDate(event.startDate)} • {formatTime(event.startDate)}
                                </Text>
                                {event.endDate && (
                                    <Text style={styles.infoValue}>
                                        Termina: {formatDate(event.endDate)} • {formatTime(event.endDate)}
                                    </Text>
                                )}
                            </View>
                        </View>
                    </View>

                    {/* Location */}
                    <View style={styles.infoSection}>
                        <View style={styles.row}>
                            <Ionicons name="location-outline" size={20} color={colors.primary} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.infoLabel}>Ubicación</Text>
                                <Text style={styles.infoValue}>{event.location}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Participants */}
                    <View style={styles.infoSection}>
                        <View style={styles.row}>
                            <Ionicons name="people-outline" size={20} color={colors.primary} />
                            <View>
                                <Text style={styles.infoLabel}>Participantes</Text>
                                <Text style={styles.infoValue}>
                                    {event.participantCount} {event.participantCount === 1 ? 'persona' : 'personas'} confirmadas
                                    {event.maxCapacity && ` de ${event.maxCapacity}`}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Rating Section - Enhanced */}
                    <View style={styles.infoSection}>
                        <View style={styles.row}>
                            <Ionicons name="star" size={20} color={colors.warning} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.infoLabel}>Calificación</Text>
                                {event.averageRating && event.averageRating > 0 ? (
                                    <View style={styles.ratingRow}>
                                        <RatingStars value={event.averageRating} size={20} editable={false} />
                                        <Text style={styles.ratingValue}>
                                            {event.averageRating.toFixed(1)} ({event.ratingCount} {event.ratingCount === 1 ? 'valoración' : 'valoraciones'})
                                        </Text>
                                    </View>
                                ) : (
                                    <Text style={styles.infoValue}>Sin calificaciones aún</Text>
                                )}
                            </View>
                        </View>
                        {/* Rate Button - Only if user attended */}
                        {event.hasUserRegistered && (
                            <TouchableOpacity
                                style={styles.rateButton}
                                onPress={() => setShowRatingModal(true)}
                            >
                                <Ionicons name="star-outline" size={18} color={colors.primary} />
                                <Text style={styles.rateButtonText}>Calificar evento</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Comments Button */}
                    <TouchableOpacity
                        style={styles.commentsButton}
                        onPress={() => navigation.navigate('Comments', {
                            eventId: event.id,
                            eventTitle: event.title
                        })}
                    >
                        <Ionicons name="chatbubble-outline" size={20} color={colors.primary} />
                        <Text style={styles.commentsButtonText}>Ver comentarios</Text>
                        <Ionicons name="chevron-forward" size={20} color={colors.text.disabled} />
                    </TouchableOpacity>

                    {/* Description */}
                    <View style={styles.descriptionSection}>
                        <Text style={styles.sectionTitle}>Descripción</Text>
                        <Text style={styles.description}>{event.description}</Text>
                    </View>

                    {/* Status Badge */}
                    {event.status !== 'PUBLISHED' && (
                        <View style={[styles.statusBadge, getStatusBadgeStyle(event.status)]}>
                            <Text style={styles.statusText}>{getStatusText(event.status)}</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Rating Modal */}
            <Modal
                visible={showRatingModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowRatingModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Califica este evento</Text>
                        <Text style={styles.modalSubtitle}>¿Cómo fue tu experiencia?</Text>

                        <View style={styles.modalRatingContainer}>
                            <RatingStars
                                value={userRating}
                                size={48}
                                editable
                                onChange={setUserRating}
                            />
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonCancel]}
                                onPress={() => setShowRatingModal(false)}
                            >
                                <Text style={styles.modalButtonTextCancel}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonConfirm]}
                                onPress={() => handleRateEvent(userRating)}
                                disabled={userRating === 0}
                            >
                                <Text style={styles.modalButtonTextConfirm}>Enviar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Action Button */}
            {canAttend && (
                <View style={[styles.footer, { paddingBottom: spacing.lg + insets.bottom }]}>
                    <Button
                        title={event.hasUserRegistered ? 'Cancelar Asistencia' : 'Confirmar Asistencia'}
                        variant={event.hasUserRegistered ? 'outline' : 'primary'}
                        onPress={handleAttendance}
                        loading={actionLoading}
                        fullWidth
                    />
                </View>
            )}

            {isOrganizer && (
                <View style={[styles.footer, { paddingBottom: spacing.lg + insets.bottom }]}>
                    <Text style={styles.organizerNote}>Eres el organizador de este evento</Text>
                </View>
            )}
        </View>
    );
};

const getStatusText = (status: string): string => {
    const statusMap: Record<string, string> = {
        DRAFT: 'Borrador',
        PUBLISHED: 'Publicado',
        CANCELLED: 'Cancelado',
        ARCHIVED: 'Archivado',
    };
    return statusMap[status] || status;
};

const getStatusBadgeStyle = (status: string) => {
    switch (status) {
        case 'DRAFT':
            return { backgroundColor: colors.warning + '20', borderColor: colors.warning };
        case 'CANCELLED':
            return { backgroundColor: colors.error + '20', borderColor: colors.error };
        case 'ARCHIVED':
            return { backgroundColor: colors.text.disabled + '20', borderColor: colors.text.disabled };
        default:
            return {};
    }
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    coverImage: {
        width: '100%',
        height: 250,
        backgroundColor: colors.surfaceDark,
    },
    coverPlaceholder: {
        width: '100%',
        height: 250,
        backgroundColor: colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    coverEmoji: {
        fontSize: 80,
    },
    content: {
        padding: spacing.lg,
    },
    categoryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: colors.primary + '15',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
        marginBottom: spacing.md,
        gap: spacing.xs,
    },
    categoryText: {
        fontSize: typography.bodySmall.fontSize,
        fontWeight: '600',
        color: colors.primary,
    },
    title: {
        fontSize: typography.h2.fontSize,
        fontWeight: typography.h2.fontWeight,
        color: colors.text.primary,
        marginBottom: spacing.md,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    icon: {
        fontSize: 20,
        marginRight: spacing.sm,
        marginTop: 2,
    },
    organizerText: {
        fontSize: typography.body.fontSize,
        color: colors.text.secondary,
    },
    organizerName: {
        fontWeight: '600',
        color: colors.text.primary,
    },
    infoSection: {
        marginTop: spacing.lg,
    },
    infoLabel: {
        fontSize: typography.bodySmall.fontSize,
        color: colors.text.secondary,
        marginBottom: spacing.xs,
    },
    infoValue: {
        fontSize: typography.body.fontSize,
        color: colors.text.primary,
        fontWeight: '500',
    },
    descriptionSection: {
        marginTop: spacing.xl,
    },
    sectionTitle: {
        fontSize: typography.h4.fontSize,
        fontWeight: typography.h4.fontWeight,
        color: colors.text.primary,
        marginBottom: spacing.sm,
    },
    description: {
        fontSize: typography.body.fontSize,
        color: colors.text.secondary,
        lineHeight: 24,
    },
    statusBadge: {
        marginTop: spacing.lg,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1.5,
        alignSelf: 'flex-start',
    },
    statusText: {
        fontSize: typography.bodySmall.fontSize,
        fontWeight: '600',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.surface,
        padding: spacing.lg,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        ...shadows.lg,
    },
    organizerNote: {
        fontSize: typography.body.fontSize,
        color: colors.text.secondary,
        fontStyle: 'italic',
        textAlign: 'center',
    },
    favoriteHeaderButton: {
        position: 'absolute',
        right: spacing.md,
        zIndex: 10,
    },
    favoriteButtonCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        ...shadows.md,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginTop: spacing.xs,
    },
    ratingValue: {
        fontSize: typography.bodySmall.fontSize,
        color: colors.text.secondary,
        marginLeft: spacing.xs,
    },
    rateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        backgroundColor: colors.primaryLight,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        marginTop: spacing.md,
        alignSelf: 'flex-start',
    },
    rateButtonText: {
        fontSize: typography.bodySmall.fontSize,
        fontWeight: '600',
        color: colors.primary,
    },
    commentsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginTop: spacing.lg,
        gap: spacing.sm,
        ...shadows.sm,
    },
    commentsButtonText: {
        flex: 1,
        fontSize: typography.body.fontSize,
        fontWeight: '500',
        color: colors.text.primary,
    },
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
    modalTitle: {
        fontSize: typography.h3.fontSize,
        fontWeight: typography.h3.fontWeight,
        color: colors.text.primary,
        textAlign: 'center',
        marginBottom: spacing.xs,
    },
    modalSubtitle: {
        fontSize: typography.body.fontSize,
        color: colors.text.secondary,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    modalRatingContainer: {
        alignItems: 'center',
        paddingVertical: spacing.lg,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: spacing.md,
        marginTop: spacing.lg,
    },
    modalButton: {
        flex: 1,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: 'center',
    },
    modalButtonCancel: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
    },
    modalButtonConfirm: {
        backgroundColor: colors.primary,
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
});
