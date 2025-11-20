import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Alert,
    TouchableOpacity,
    Animated,
    ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { MainStackParamList } from '../navigation/AppNavigator';
import type { Comment } from '../types/models';
import { commentService } from '../services/commentService';
import { CommentItem } from '../components/CommentItem';
import { Loading } from '../components/Loading';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, typography, borderRadius, shadows } from '../theme';

type CommentsRouteProp = RouteProp<MainStackParamList, 'Comments'>;

export const CommentsScreen: React.FC = () => {
    const route = useRoute<CommentsRouteProp>();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const { eventId, eventTitle } = route.params;
    const inputRef = useRef<TextInput>(null);

    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [isInputFocused, setIsInputFocused] = useState(false);

    useEffect(() => {
        loadComments();
    }, []);

    const loadComments = async () => {
        try {
            const data = await commentService.getComments(eventId);
            setComments(data);
        } catch (error: any) {
            console.error('Error loading comments:', error);
            Alert.alert('Error', 'No se pudieron cargar los comentarios');
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) {
            Alert.alert('Error', 'El comentario no puede estar vacío');
            return;
        }

        if (newComment.length > 500) {
            Alert.alert('Error', 'El comentario no puede tener más de 500 caracteres');
            return;
        }

        try {
            setSubmitting(true);
            const comment = await commentService.addComment(eventId, newComment.trim());
            setComments([comment, ...comments]);
            setNewComment('');
        } catch (error: any) {
            console.error('Error adding comment:', error);
            Alert.alert('Error', error.message || 'No se pudo agregar el comentario');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteComment = async (commentId: number) => {
        try {
            await commentService.deleteComment(commentId);
            setComments(comments.filter(c => c.id !== commentId));
        } catch (error: any) {
            console.error('Error deleting comment:', error);
            Alert.alert('Error', 'No se pudo eliminar el comentario');
        }
    };

    const renderHeader = () => (
        <View style={styles.listHeader}>
            <View style={styles.eventInfoCard}>
                <View style={styles.eventIconContainer}>
                    <Ionicons name="calendar" size={24} color={colors.primary} />
                </View>
                <View style={styles.eventInfoText}>
                    <Text style={styles.eventLabel}>Evento</Text>
                    <Text style={styles.eventTitle} numberOfLines={2}>{eventTitle}</Text>
                </View>
            </View>

            <View style={styles.statsRow}>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{comments.length}</Text>
                    <Text style={styles.statLabel}>
                        {comments.length === 1 ? 'comentario' : 'comentarios'}
                    </Text>
                </View>
            </View>
        </View>
    );

    const renderEmpty = () => (
        <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
                <Ionicons name="chatbubbles-outline" size={48} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Sin comentarios</Text>
            <Text style={styles.emptyText}>
                Sé el primero en compartir tu opinión sobre este evento
            </Text>
            <TouchableOpacity
                style={styles.emptyAction}
                onPress={() => inputRef.current?.focus()}
            >
                <Ionicons name="create-outline" size={18} color={colors.primary} />
                <Text style={styles.emptyActionText}>Escribir comentario</Text>
            </TouchableOpacity>
        </View>
    );

    if (loading) {
        return <Loading message="Cargando comentarios..." />;
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Comentarios</Text>
                    {comments.length > 0 && (
                        <View style={styles.commentCountBadge}>
                            <Text style={styles.commentCountText}>{comments.length}</Text>
                        </View>
                    )}
                </View>
                <View style={styles.headerSpacer} />
            </View>

            <KeyboardAvoidingView
                style={styles.keyboardContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={0}
            >
                <FlatList
                    data={comments}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item, index }) => (
                        <CommentItem
                            comment={item}
                            canDelete={item.isOwner}
                            onDelete={() => handleDeleteComment(item.id)}
                            isFirst={index === 0}
                        />
                    )}
                    ListHeaderComponent={renderHeader}
                    ListEmptyComponent={renderEmpty}
                    contentContainerStyle={[
                        styles.listContent,
                        comments.length === 0 && styles.listContentEmpty
                    ]}
                    showsVerticalScrollIndicator={false}
                />

                {/* Input Container */}
                <View style={[
                    styles.inputContainer,
                    { paddingBottom: insets.bottom + spacing.sm },
                    isInputFocused && styles.inputContainerFocused
                ]}>
                    <View style={[
                        styles.inputWrapper,
                        isInputFocused && styles.inputWrapperFocused
                    ]}>
                        <TextInput
                            ref={inputRef}
                            style={styles.input}
                            placeholder="Escribe un comentario..."
                            placeholderTextColor={colors.text.disabled}
                            value={newComment}
                            onChangeText={setNewComment}
                            onFocus={() => setIsInputFocused(true)}
                            onBlur={() => setIsInputFocused(false)}
                            multiline
                            maxLength={500}
                        />
                        {newComment.length > 0 && (
                            <Text style={styles.charCount}>
                                {newComment.length}/500
                            </Text>
                        )}
                    </View>

                    <TouchableOpacity
                        onPress={handleAddComment}
                        disabled={submitting || !newComment.trim()}
                        style={[
                            styles.sendButton,
                            newComment.trim() && !submitting && styles.sendButtonActive
                        ]}
                    >
                        {submitting ? (
                            <ActivityIndicator size="small" color={colors.text.inverse} />
                        ) : (
                            <Ionicons
                                name="send"
                                size={20}
                                color={newComment.trim() ? colors.text.inverse : colors.text.disabled}
                            />
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.md,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
    },
    headerTitle: {
        fontSize: typography.h3.fontSize,
        fontWeight: '700',
        color: colors.text.primary,
    },
    commentCountBadge: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.full,
    },
    commentCountText: {
        fontSize: typography.caption.fontSize,
        fontWeight: '700',
        color: colors.text.inverse,
    },
    headerSpacer: {
        width: 40,
    },
    keyboardContainer: {
        flex: 1,
    },
    listContent: {
        padding: spacing.lg,
    },
    listContentEmpty: {
        flexGrow: 1,
    },
    // List Header
    listHeader: {
        marginBottom: spacing.lg,
    },
    eventInfoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        gap: spacing.md,
        marginBottom: spacing.md,
        ...shadows.sm,
    },
    eventIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    eventInfoText: {
        flex: 1,
    },
    eventLabel: {
        fontSize: typography.caption.fontSize,
        color: colors.text.secondary,
        marginBottom: 2,
    },
    eventTitle: {
        fontSize: typography.body.fontSize,
        fontWeight: '600',
        color: colors.text.primary,
    },
    statsRow: {
        flexDirection: 'row',
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: spacing.xs,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.primary,
    },
    statLabel: {
        fontSize: typography.body.fontSize,
        color: colors.text.secondary,
    },
    // Empty State
    emptyState: {
        alignItems: 'center',
        paddingVertical: spacing.xxl,
        paddingHorizontal: spacing.lg,
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    emptyTitle: {
        fontSize: typography.h3.fontSize,
        fontWeight: '700',
        color: colors.text.primary,
        marginBottom: spacing.xs,
    },
    emptyText: {
        fontSize: typography.body.fontSize,
        color: colors.text.secondary,
        textAlign: 'center',
        marginBottom: spacing.lg,
        lineHeight: 22,
    },
    emptyAction: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        backgroundColor: colors.primaryLight,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
    },
    emptyActionText: {
        fontSize: typography.body.fontSize,
        fontWeight: '600',
        color: colors.primary,
    },
    // Input
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: spacing.md,
        paddingTop: spacing.md,
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        gap: spacing.sm,
    },
    inputContainerFocused: {
        borderTopColor: colors.primary,
    },
    inputWrapper: {
        flex: 1,
        backgroundColor: colors.background,
        borderRadius: borderRadius.lg,
        borderWidth: 1.5,
        borderColor: colors.border,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    inputWrapperFocused: {
        borderColor: colors.primary,
        backgroundColor: colors.surface,
    },
    input: {
        fontSize: typography.body.fontSize,
        color: colors.text.primary,
        maxHeight: 100,
        minHeight: 24,
    },
    charCount: {
        fontSize: typography.caption.fontSize,
        color: colors.text.disabled,
        textAlign: 'right',
        marginTop: spacing.xs,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.text.disabled,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 2,
    },
    sendButtonActive: {
        backgroundColor: colors.primary,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
});
