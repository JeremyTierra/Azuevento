import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { MainStackParamList } from '../navigation/AppNavigator';
import type { Comment } from '../types/models';
import { commentService } from '../services/commentService';
import { CommentItem } from '../components/CommentItem';
import { Button } from '../components/Button';
import { Loading } from '../components/Loading';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, typography, borderRadius } from '../theme';

type CommentsRouteProp = RouteProp<MainStackParamList, 'Comments'>;

export const CommentsScreen: React.FC = () => {
    const route = useRoute<CommentsRouteProp>();
    const navigation = useNavigation();
    const { user } = useAuth();
    const { eventId, eventTitle } = route.params;

    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [newComment, setNewComment] = useState('');

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
            Alert.alert('Éxito', 'Comentario agregado');
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
            Alert.alert('Éxito', 'Comentario eliminado');
        } catch (error: any) {
            console.error('Error deleting comment:', error);
            Alert.alert('Error', 'No se pudo eliminar el comentario');
        }
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <Text style={styles.eventTitle}>{eventTitle}</Text>
            <Text style={styles.commentsCount}>
                {comments.length} {comments.length === 1 ? 'comentario' : 'comentarios'}
            </Text>
        </View>
    );

    const renderEmpty = () => (
        <View style={styles.emptyState}>
            <Ionicons name="chatbubble-outline" size={64} color={colors.text.disabled} />
            <Text style={styles.emptyTitle}>No hay comentarios</Text>
            <Text style={styles.emptyText}>Sé el primero en comentar sobre este evento</Text>
        </View>
    );

    if (loading) {
        return <Loading message="Cargando comentarios..." />;
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.screenHeader}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.screenTitle}>Comentarios</Text>
                <View style={styles.headerSpacer} />
            </View>

            <KeyboardAvoidingView
                style={styles.keyboardContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={100}
            >
                <FlatList
                    data={comments}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <CommentItem
                            comment={item}
                            canDelete={item.isOwner}
                            onDelete={() => handleDeleteComment(item.id)}
                        />
                    )}
                    ListHeaderComponent={renderHeader}
                    ListEmptyComponent={renderEmpty}
                    contentContainerStyle={styles.listContent}
                />

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Escribe un comentario..."
                        placeholderTextColor={colors.text.disabled}
                        value={newComment}
                        onChangeText={setNewComment}
                        multiline
                        maxLength={500}
                    />
                    <TouchableOpacity
                        onPress={handleAddComment}
                        disabled={submitting || !newComment.trim()}
                        style={[
                            styles.sendButton,
                            (!newComment.trim() || submitting) && styles.sendButtonDisabled
                        ]}
                    >
                        <Ionicons
                            name="send"
                            size={24}
                            color={newComment.trim() && !submitting ? colors.primary : colors.text.disabled}
                        />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    screenHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backButton: {
        padding: spacing.xs,
    },
    screenTitle: {
        flex: 1,
        fontSize: typography.h3.fontSize,
        fontWeight: typography.h3.fontWeight,
        color: colors.text.primary,
        textAlign: 'center',
    },
    headerSpacer: {
        width: 32,
    },
    keyboardContainer: {
        flex: 1,
    },
    listContent: {
        padding: spacing.lg,
    },
    header: {
        marginBottom: spacing.lg,
    },
    eventTitle: {
        fontSize: typography.h3.fontSize,
        fontWeight: typography.h3.fontWeight,
        color: colors.text.primary,
        marginBottom: spacing.xs,
    },
    commentsCount: {
        fontSize: typography.body.fontSize,
        color: colors.text.secondary,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: spacing.xxl,
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
    inputContainer: {
        flexDirection: 'row',
        padding: spacing.md,
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        alignItems: 'center',
        gap: spacing.sm,
    },
    input: {
        flex: 1,
        backgroundColor: colors.background,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        fontSize: typography.body.fontSize,
        color: colors.text.primary,
        maxHeight: 100,
    },
    sendButton: {
        padding: spacing.sm,
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
});
