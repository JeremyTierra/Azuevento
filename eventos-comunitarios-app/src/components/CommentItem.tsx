import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Comment } from '../types/models';
import { colors, spacing, typography, borderRadius, shadows } from '../theme';
import { formatDate, formatTime } from '../utils/formatters';

interface CommentItemProps {
    comment: Comment;
    canDelete: boolean;
    onDelete: () => void;
    isFirst?: boolean;
}

// Generate a consistent color based on username
const getAvatarColor = (name: string): string => {
    const avatarColors = [
        colors.primary,
        colors.secondary,
        colors.success,
        '#9C27B0', // purple
        '#FF9800', // orange
        '#00BCD4', // cyan
        '#E91E63', // pink
        '#3F51B5', // indigo
    ];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return avatarColors[index % avatarColors.length];
};

// Get initials from name
const getInitials = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

export const CommentItem: React.FC<CommentItemProps> = ({
    comment,
    canDelete,
    onDelete,
    isFirst = false,
}) => {
    const handleDelete = () => {
        Alert.alert(
            'Eliminar comentario',
            '¿Estás seguro de que quieres eliminar este comentario?',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Eliminar', style: 'destructive', onPress: onDelete },
            ]
        );
    };

    const avatarColor = getAvatarColor(comment.userName);
    const initials = getInitials(comment.userName);

    return (
        <View style={[styles.container, isFirst && styles.containerFirst]}>
            {/* Avatar */}
            <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
                <Text style={styles.avatarText}>{initials}</Text>
            </View>

            {/* Content */}
            <View style={styles.contentContainer}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>{comment.userName}</Text>
                        <View style={styles.dateContainer}>
                            <Ionicons name="time-outline" size={12} color={colors.text.disabled} />
                            <Text style={styles.date}>
                                {formatDate(comment.createdAt)} · {formatTime(comment.createdAt)}
                            </Text>
                        </View>
                    </View>
                    {canDelete && (
                        <TouchableOpacity
                            onPress={handleDelete}
                            style={styles.deleteButton}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="trash-outline" size={18} color={colors.error} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Comment text */}
                <Text style={styles.content}>{comment.content}</Text>

                {/* Owner badge */}
                {comment.isOwner && (
                    <View style={styles.ownerBadge}>
                        <Ionicons name="person" size={10} color={colors.primary} />
                        <Text style={styles.ownerBadgeText}>Tu comentario</Text>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.md,
        gap: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    containerFirst: {
        borderColor: colors.primary + '30',
        backgroundColor: colors.primary + '05',
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: typography.body.fontSize,
        fontWeight: '700',
        color: colors.text.inverse,
    },
    contentContainer: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: spacing.sm,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: typography.body.fontSize,
        fontWeight: '700',
        color: colors.text.primary,
        marginBottom: 2,
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    date: {
        fontSize: typography.caption.fontSize,
        color: colors.text.disabled,
    },
    deleteButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.error + '10',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        fontSize: typography.body.fontSize,
        color: colors.text.primary,
        lineHeight: 22,
    },
    ownerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 4,
        marginTop: spacing.sm,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        backgroundColor: colors.primaryLight,
        borderRadius: borderRadius.full,
    },
    ownerBadgeText: {
        fontSize: typography.caption.fontSize,
        fontWeight: '500',
        color: colors.primary,
    },
});
