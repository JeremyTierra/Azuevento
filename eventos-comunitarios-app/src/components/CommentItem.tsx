import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Comment } from '../types/models';
import { colors, spacing, typography, borderRadius } from '../theme';
import { formatDate } from '../utils/formatters';

interface CommentItemProps {
    comment: Comment;
    canDelete: boolean;
    onDelete: () => void;
}

export const CommentItem: React.FC<CommentItemProps> = ({
    comment,
    canDelete,
    onDelete,
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

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.avatar}>
                    <Ionicons name="person" size={20} color={colors.text.inverse} />
                </View>
                <View style={styles.userInfo}>
                    <Text style={styles.userName}>{comment.userName}</Text>
                    <Text style={styles.date}>{formatDate(comment.createdAt)}</Text>
                </View>
                {canDelete && (
                    <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
                        <Ionicons name="trash-outline" size={20} color={colors.error} />
                    </TouchableOpacity>
                )}
            </View>
            <Text style={styles.content}>{comment.content}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.md,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    userInfo: {
        flex: 1,
        marginLeft: spacing.sm,
    },
    userName: {
        fontSize: typography.body.fontSize,
        fontWeight: '600',
        color: colors.text.primary,
    },
    date: {
        fontSize: typography.caption.fontSize,
        color: colors.text.secondary,
    },
    deleteButton: {
        padding: spacing.xs,
    },
    content: {
        fontSize: typography.body.fontSize,
        color: colors.text.primary,
        lineHeight: 20,
    },
});
