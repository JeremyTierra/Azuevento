import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    RefreshControl,
    ActivityIndicator,
    Alert,
    TouchableOpacity,
    AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ExploreStackParamList } from '../navigation/TabNavigator';
import { eventService } from '../services/eventService';
import { EventCard } from '../components/EventCard';
import type { Event } from '../types/models';
import { colors, spacing, typography, borderRadius, shadows } from '../theme';
import { Ionicons } from '@expo/vector-icons';

type HomeScreenNavigationProp = NativeStackNavigationProp<ExploreStackParamList, 'ExploreHome'>;

export const HomeScreen: React.FC = () => {
    const { user } = useAuth();
    const navigation = useNavigation<HomeScreenNavigationProp>();
    const insets = useSafeAreaInsets();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        try {
            const data = await eventService.getAll();
            setEvents(data);
        } catch (error: any) {
            console.error('Error loading events:', error);
            Alert.alert(
                'Error',
                error.message || 'No se pudieron cargar los eventos'
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadEvents();
    };

    const handleEventPress = (event: Event) => {
        navigation.navigate('EventDetail', { eventId: event.id });
    };

    const renderHeader = () => (
        <View style={[styles.header, { paddingTop: spacing.lg + insets.top }]}>
            <View style={styles.headerTop}>
                <View>
                    <Text style={styles.greeting}>Hola, {user?.name?.split(' ')[0]}!</Text>
                    <Text style={styles.subtitle}>
                        Descubre eventos increíbles
                    </Text>
                </View>
            </View>

            {events.length > 0 && (
                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <Ionicons name="calendar" size={20} color={colors.primary} />
                        <Text style={styles.statNumber}>{events.length}</Text>
                        <Text style={styles.statLabel}>Eventos</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Ionicons name="people" size={20} color={colors.secondary} />
                        <Text style={styles.statNumber}>
                            {events.reduce((sum, e) => sum + e.participantCount, 0)}
                        </Text>
                        <Text style={styles.statLabel}>Asistentes</Text>
                    </View>
                </View>
            )}
        </View>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color={colors.text.disabled} />
            <Text style={styles.emptyTitle}>No hay eventos</Text>
            <Text style={styles.emptyText}>
                Aún no se han publicado eventos. ¡Sé el primero en crear uno!
            </Text>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Cargando eventos...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={events}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <EventCard event={item} onPress={() => handleEventPress(item)} />
                )}
                ListHeaderComponent={renderHeader}
                ListEmptyComponent={renderEmptyState}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                    />
                }
            />

            {/* FAB - Create Event Button */}
            <TouchableOpacity
                style={[styles.fab, { bottom: spacing.lg + insets.bottom }]}
                onPress={() => navigation.navigate('CreateEvent')}
                activeOpacity={0.8}
            >
                <Ionicons name="add" size={32} color={colors.text.inverse} />
            </TouchableOpacity>

            {/* My Events Button */}
            <TouchableOpacity
                style={[styles.myEventsButton, { bottom: spacing.lg + insets.bottom }]}
                onPress={() => navigation.navigate('MyEvents')}
                activeOpacity={0.8}
            >
                <Ionicons name="list" size={24} color={colors.text.inverse} />
            </TouchableOpacity>
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
    loadingText: {
        marginTop: spacing.md,
        fontSize: typography.body.fontSize,
        color: colors.text.secondary,
    },
    listContent: {
        padding: spacing.md,
    },
    header: {
        marginBottom: spacing.xl,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.lg,
    },
    greeting: {
        fontSize: typography.h2.fontSize,
        fontWeight: typography.h2.fontWeight,
        color: colors.text.primary,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: typography.bodySmall.fontSize,
        color: colors.text.secondary,
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        ...shadows.sm,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
        gap: spacing.xs,
    },
    statDivider: {
        width: 1,
        backgroundColor: colors.border,
        marginHorizontal: spacing.md,
    },
    statNumber: {
        fontSize: typography.h3.fontSize,
        fontWeight: typography.h3.fontWeight,
        color: colors.text.primary,
    },
    statLabel: {
        fontSize: typography.caption.fontSize,
        color: colors.text.secondary,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xxl,
    },
    emptyEmoji: {
        fontSize: 64,
        marginBottom: spacing.md,
    },
    emptyTitle: {
        fontSize: typography.h3.fontSize,
        fontWeight: typography.h3.fontWeight,
        color: colors.text.primary,
        marginBottom: spacing.xs,
    },
    emptyText: {
        fontSize: typography.body.fontSize,
        color: colors.text.secondary,
        textAlign: 'center',
        paddingHorizontal: spacing.xl,
    },
    fab: {
        position: 'absolute',
        bottom: spacing.lg,
        right: spacing.lg,
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    myEventsButton: {
        position: 'absolute',
        bottom: spacing.lg,
        left: spacing.lg,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.secondary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
    },
});
