import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ViewStyle,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { Event } from '../types/models';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';
import { formatDate, formatTime, getCategoryIcon } from '../utils/formatters';
import { LinearGradient } from 'expo-linear-gradient';
import { favoriteService } from '../services/favoriteService';

interface EventCardProps {
    event: Event;
    onPress: () => void;
    style?: ViewStyle;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onPress, style }) => {
    const [isFavorite, setIsFavorite] = useState(false);
    const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

    useEffect(() => {
        const loadFavoriteStatus = async () => {
            try {
                const status = await favoriteService.checkIsFavorite(event.id);
                setIsFavorite(status);
            } catch (error) {
                console.error('Error checking favorite status:', error);
            }
        };
        loadFavoriteStatus();
    }, [event.id]);

    const handleToggleFavorite = async (e: any) => {
        e.stopPropagation(); // Evitar que se active onPress del card
        if (isTogglingFavorite) return;

        setIsTogglingFavorite(true);
        try {
            await favoriteService.toggleFavorite(event.id, isFavorite);
            setIsFavorite(!isFavorite);
        } catch (error) {
            console.error('Error toggling favorite:', error);
        } finally {
            setIsTogglingFavorite(false);
        }
    };

    return (
        <TouchableOpacity style={[styles.card, style]} onPress={onPress} activeOpacity={0.95}>
            {/* Cover Image with Gradient Overlay */}
            <View style={styles.imageContainer}>
                {event.coverImage ? (
                    <Image source={{ uri: event.coverImage }} style={styles.image} />
                ) : (
                    <LinearGradient
                        colors={colors.primaryGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.imagePlaceholder}
                    >
                        <Ionicons name="calendar" size={48} color={colors.text.inverse} />
                    </LinearGradient>
                )}

                {/* Favorite Button */}
                <TouchableOpacity
                    style={styles.favoriteButton}
                    onPress={handleToggleFavorite}
                    activeOpacity={0.7}
                >
                    <Ionicons
                        name={isFavorite ? 'heart' : 'heart-outline'}
                        size={24}
                        color={isFavorite ? colors.error : colors.surface}
                    />
                </TouchableOpacity>

                {/* Category Badge */}
                <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{event.categoryName}</Text>
                </View>
            </View>

            {/* Content */}
            <View style={styles.content}>
                <Text style={styles.title} numberOfLines={2}>
                    {event.title}
                </Text>

                {/* Date & Time */}
                <View style={styles.infoRow}>
                    <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                    <Text style={styles.infoText}>
                        {formatDate(event.startDate, 'EEE, d MMM')} · {formatTime(event.startDate)}
                    </Text>
                </View>

                {/* Location */}
                <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={16} color={colors.primary} />
                    <Text style={styles.infoText} numberOfLines={1}>
                        {event.location}
                    </Text>
                </View>

                <View style={styles.footer}>
                    {/* Participants */}
                    <View style={styles.participantInfo}>
                        <View style={styles.avatarGroup}>
                            <View style={[styles.avatar, styles.avatar1]}>
                                <Ionicons name="person" size={12} color={colors.text.inverse} />
                            </View>
                            {event.participantCount > 1 && (
                                <View style={[styles.avatar, styles.avatar2]}>
                                    <Ionicons name="person" size={12} color={colors.text.inverse} />
                                </View>
                            )}
                            {event.participantCount > 2 && (
                                <View style={[styles.avatar, styles.avatar3]}>
                                    <Text style={styles.avatarText}>+{event.participantCount - 2}</Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.participantText}>
                            {event.participantCount} {event.participantCount === 1 ? 'asistente' : 'asistentes'}
                        </Text>
                    </View>

                    {/* Rating */}
                    {event.averageRating && event.averageRating > 0 && (
                        <View style={styles.ratingInfo}>
                            <Ionicons name="star" size={16} color={colors.warning} />
                            <Text style={styles.ratingText}>{event.averageRating.toFixed(1)}</Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xl,
        marginBottom: spacing.lg,
        overflow: 'hidden',
        ...shadows.md,
    },
    imageContainer: {
        position: 'relative',
        width: '100%',
        height: 200,
    },
    image: {
        width: '100%',
        height: '100%',
        backgroundColor: colors.surfaceDark,
    },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoryBadge: {
        position: 'absolute',
        top: spacing.md,
        right: spacing.md,
        backgroundColor: colors.surface,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
        ...shadows.sm,
    },
    categoryText: {
        fontSize: typography.caption.fontSize,
        fontWeight: '600',
        color: colors.primary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    favoriteButton: {
        position: 'absolute',
        top: spacing.md,
        left: spacing.md,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        ...shadows.md,
    },
    content: {
        padding: spacing.lg,
    },
    title: {
        fontSize: typography.h4.fontSize,
        fontWeight: typography.h4.fontWeight,
        color: colors.text.primary,
        marginBottom: spacing.md,
        lineHeight: 28,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
        gap: spacing.sm,
    },
    infoText: {
        fontSize: typography.bodySmall.fontSize,
        color: colors.text.secondary,
        flex: 1,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: spacing.md,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.borderLight,
    },
    participantInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    avatarGroup: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.surface,
    },
    avatar1: {
        backgroundColor: colors.primary,
        zIndex: 3,
    },
    avatar2: {
        backgroundColor: colors.secondary,
        marginLeft: -8,
        zIndex: 2,
    },
    avatar3: {
        backgroundColor: colors.info,
        marginLeft: -8,
        zIndex: 1,
    },
    avatarText: {
        fontSize: 10,
        fontWeight: '600',
        color: colors.text.inverse,
    },
    participantText: {
        fontSize: typography.caption.fontSize,
        color: colors.text.secondary,
        fontWeight: '500',
    },
    ratingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: colors.warningLight,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: borderRadius.md,
    },
    ratingText: {
        fontSize: typography.caption.fontSize,
        fontWeight: '600',
        color: colors.text.primary,
    },
});
