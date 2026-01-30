import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    Alert,
    RefreshControl,
    ActivityIndicator,
    Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MyEventsStackParamList } from '../navigation/TabNavigator';
import { eventService } from '../services/eventService';
import { favoriteService } from '../services/favoriteService';
import { EventCard } from '../components/EventCard';
import { Button } from '../components/Button';
import type { Event } from '../types/models';
import { colors, spacing, typography, borderRadius, shadows } from '../theme';

type MyEventsNavigationProp = NativeStackNavigationProp<MyEventsStackParamList, 'MyEventsList'>;

type Tab = 'favorites' | 'organized' | 'attending';

interface TabConfig {
    id: Tab;
    label: string;
    icon: string;
    iconActive: string;
    emptyIcon: string;
    emptyTitle: string;
    emptyText: string;
    showCreateButton?: boolean;
}

const TAB_CONFIG: TabConfig[] = [
    {
        id: 'favorites',
        label: 'Favoritos',
        icon: 'heart-outline',
        iconActive: 'heart',
        emptyIcon: 'heart-outline',
        emptyTitle: 'Sin favoritos',
        emptyText: 'Los eventos que marques con ❤️ aparecerán aquí para acceso rápido',
    },
    {
        id: 'organized',
        label: 'Creados',
        icon: 'create-outline',
        iconActive: 'create',
        emptyIcon: 'add-circle-outline',
        emptyTitle: 'Crea tu primer evento',
        emptyText: 'Organiza eventos y compártelos con tu comunidad',
        showCreateButton: true,
    },
    {
        id: 'attending',
        label: 'Asistiendo',
        icon: 'ticket-outline',
        iconActive: 'ticket',
        emptyIcon: 'compass-outline',
        emptyTitle: 'Explora eventos',
        emptyText: 'Confirma tu asistencia a eventos para verlos aquí',
    },
];

export const MyEventsScreen: React.FC = () => {
    const navigation = useNavigation<MyEventsNavigationProp>();
    const insets = useSafeAreaInsets();

    // State
    const [activeTab, setActiveTab] = useState<Tab>('favorites');
    const [allOrganized, setAllOrganized] = useState<Event[]>([]);
    const [allFavorites, setAllFavorites] = useState<Event[]>([]);
    const [allAttending, setAllAttending] = useState<Event[]>([]);
    const [displayedEvents, setDisplayedEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Animation for FAB
    const fabScale = new Animated.Value(1);

    useFocusEffect(
        useCallback(() => {
            loadAllEvents();
        }, [])
    );

    useEffect(() => {
        filterEventsByTab();
    }, [activeTab, allOrganized, allFavorites, allAttending]);

    const loadAllEvents = async () => {
        try {
            const [organized, favorites, attending] = await Promise.all([
                eventService.getMyEvents(),
                favoriteService.getUserFavorites(),
                eventService.getAttendingEvents(),
            ]);

            setAllOrganized(organized);
            setAllFavorites(favorites);
            setAllAttending(attending);
        } catch (error: any) {
            console.error('Error loading events:', error);
            Alert.alert('Error', error.message || 'No se pudieron cargar los eventos');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const filterEventsByTab = useCallback(() => {
        let result: Event[] = [];

        if (activeTab === 'favorites') {
            result = allFavorites;
        } else if (activeTab === 'organized') {
            result = allOrganized;
        } else if (activeTab === 'attending') {
            result = allAttending;
        }

        setDisplayedEvents(result);
    }, [activeTab, allOrganized, allFavorites, allAttending]);

    const handleRefresh = () => {
        setRefreshing(true);
        loadAllEvents();
    };

    const handleEventPress = (event: Event) => {
        navigation.navigate('EventDetail', { eventId: event.id });
    };

    const handleCreateEvent = () => {
        // FAB animation
        Animated.sequence([
            Animated.spring(fabScale, { toValue: 0.9, useNativeDriver: true }),
            Animated.spring(fabScale, { toValue: 1, useNativeDriver: true }),
        ]).start();
        navigation.navigate('CreateEvent');
    };

    const handlePublish = async (eventId: number) => {
        try {
            await eventService.publish(eventId);
            Alert.alert('Éxito', 'Evento publicado correctamente');
            loadAllEvents();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'No se pudo publicar el evento');
        }
    };

    const handleCancel = async (eventId: number) => {
        Alert.alert(
            'Cancelar Evento',
            '¿Estás seguro de que quieres cancelar este evento? Los participantes serán notificados.',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Sí, cancelar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await eventService.cancel(eventId);
                            Alert.alert('Éxito', 'Evento cancelado');
                            loadAllEvents();
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'No se pudo cancelar el evento');
                        }
                    },
                },
            ]
        );
    };

    const getTabCount = (tab: Tab): number => {
        switch (tab) {
            case 'favorites': return allFavorites.length;
            case 'organized': return allOrganized.length;
            case 'attending': return allAttending.length;
            default: return 0;
        }
    };

    const renderEventItem = ({ item }: { item: Event }) => (
        <View style={styles.eventItemContainer}>
            <EventCard event={item} onPress={() => handleEventPress(item)} />

            {activeTab === 'organized' && item.status === 'DRAFT' && (
                <View style={styles.draftActions}>
                    <View style={styles.draftBadge}>
                        <Ionicons name="create-outline" size={14} color={colors.warning} />
                        <Text style={styles.draftBadgeText}>Borrador</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.publishButton}
                        onPress={() => handlePublish(item.id)}
                    >
                        <Ionicons name="send" size={16} color={colors.text.inverse} />
                        <Text style={styles.publishButtonText}>Publicar</Text>
                    </TouchableOpacity>
                </View>
            )}

            {activeTab === 'organized' && item.status === 'PUBLISHED' && (
                <TouchableOpacity
                    style={styles.cancelEventButton}
                    onPress={() => handleCancel(item.id)}
                >
                    <Ionicons name="close-circle-outline" size={18} color={colors.error} />
                    <Text style={styles.cancelEventText}>Cancelar evento</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    const renderEmpty = () => {
        const config = TAB_CONFIG.find(t => t.id === activeTab)!;

        return (
            <View style={styles.emptyState}>
                <View style={styles.emptyIconContainer}>
                    <Ionicons
                        name={config.emptyIcon as any}
                        size={64}
                        color={colors.primary + '40'}
                    />
                </View>
                <Text style={styles.emptyTitle}>{config.emptyTitle}</Text>
                <Text style={styles.emptyText}>{config.emptyText}</Text>
                {config.showCreateButton && (
                    <TouchableOpacity
                        style={styles.emptyCreateButton}
                        onPress={handleCreateEvent}
                    >
                        <Ionicons name="add" size={20} color={colors.text.inverse} />
                        <Text style={styles.emptyCreateButtonText}>Crear Evento</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Cargando tus eventos...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header with Gradient */}
            <LinearGradient
                colors={[colors.primary, colors.primaryDark || colors.primary]}
                style={[styles.header, { paddingTop: insets.top + spacing.md }]}
            >
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Mi Agenda</Text>
                </View>

                {/* Tabs */}
                <View style={styles.tabsContainer}>
                    {TAB_CONFIG.map((tab) => {
                        const isActive = activeTab === tab.id;
                        const count = getTabCount(tab.id);

                        return (
                            <TouchableOpacity
                                key={tab.id}
                                style={[styles.tab, isActive && styles.tabActive]}
                                onPress={() => setActiveTab(tab.id)}
                                activeOpacity={0.8}
                            >
                                <Ionicons
                                    name={(isActive ? tab.iconActive : tab.icon) as any}
                                    size={20}
                                    color={isActive ? colors.primary : colors.text.inverse + '80'}
                                />
                                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                                    {tab.label}
                                </Text>
                                {count > 0 && (
                                    <View style={[styles.tabBadge, isActive && styles.tabBadgeActive]}>
                                        <Text style={[styles.tabBadgeText, isActive && styles.tabBadgeTextActive]}>
                                            {count}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </LinearGradient>

            {/* Event List */}
            <FlatList
                data={displayedEvents}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderEventItem}
                ListEmptyComponent={renderEmpty}
                contentContainerStyle={[
                    styles.listContent,
                    displayedEvents.length === 0 && styles.listContentEmpty
                ]}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                    />
                }
                showsVerticalScrollIndicator={false}
            />

            {/* FAB - Create Event */}
            <Animated.View
                style={[
                    styles.fabContainer,
                    { bottom: insets.bottom + spacing.lg, transform: [{ scale: fabScale }] }
                ]}
            >
                <TouchableOpacity
                    style={styles.fab}
                    onPress={handleCreateEvent}
                    activeOpacity={0.9}
                >
                    <LinearGradient
                        colors={[colors.primary, colors.primaryDark || colors.primary]}
                        style={styles.fabGradient}
                    >
                        <Ionicons name="add" size={28} color={colors.text.inverse} />
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>
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

    // Header
    header: {
        paddingBottom: spacing.md,
    },
    headerContent: {
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.lg,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: colors.text.inverse,
        marginBottom: spacing.xs,
    },
    headerSubtitle: {
        fontSize: typography.body.fontSize,
        color: colors.text.inverse,
        opacity: 0.8,
    },

    // Tabs
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: spacing.md,
        gap: spacing.sm,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.sm + 2,
        paddingHorizontal: spacing.sm,
        borderRadius: borderRadius.lg,
        backgroundColor: 'rgba(255,255,255,0.15)',
        gap: spacing.xs,
    },
    tabActive: {
        backgroundColor: colors.surface,
    },
    tabLabel: {
        fontSize: typography.caption.fontSize,
        fontWeight: '600',
        color: colors.text.inverse,
        opacity: 0.9,
    },
    tabLabelActive: {
        color: colors.primary,
        opacity: 1,
    },
    tabBadge: {
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    tabBadgeActive: {
        backgroundColor: colors.primary + '20',
    },
    tabBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.text.inverse,
    },
    tabBadgeTextActive: {
        color: colors.primary,
    },

    // List
    listContent: {
        padding: spacing.md,
        paddingBottom: 100,
    },
    listContentEmpty: {
        flexGrow: 1,
    },
    eventItemContainer: {
        marginBottom: spacing.md,
    },

    // Draft Actions
    draftActions: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: colors.warning + '10',
        borderBottomLeftRadius: borderRadius.lg,
        borderBottomRightRadius: borderRadius.lg,
        marginTop: -spacing.sm,
    },
    draftBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    draftBadgeText: {
        fontSize: typography.caption.fontSize,
        fontWeight: '600',
        color: colors.warning,
    },
    publishButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.success,
        paddingVertical: spacing.xs + 2,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.md,
        gap: spacing.xs,
    },
    publishButtonText: {
        fontSize: typography.bodySmall.fontSize,
        fontWeight: '600',
        color: colors.text.inverse,
    },

    // Cancel Button
    cancelEventButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.sm,
        gap: spacing.xs,
    },
    cancelEventText: {
        fontSize: typography.bodySmall.fontSize,
        color: colors.error,
        fontWeight: '500',
    },

    // Empty State
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xxl * 2,
        paddingHorizontal: spacing.xl,
    },
    emptyIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: colors.primary + '10',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    emptyTitle: {
        fontSize: typography.h3.fontSize,
        fontWeight: '700',
        color: colors.text.primary,
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    emptyText: {
        fontSize: typography.body.fontSize,
        color: colors.text.secondary,
        textAlign: 'center',
        lineHeight: 22,
        maxWidth: 280,
    },
    emptyCreateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: borderRadius.lg,
        marginTop: spacing.xl,
        gap: spacing.sm,
        ...shadows.md,
    },
    emptyCreateButtonText: {
        fontSize: typography.body.fontSize,
        fontWeight: '600',
        color: colors.text.inverse,
    },

    // FAB
    fabContainer: {
        position: 'absolute',
        right: spacing.lg,
    },
    fab: {
        width: 60,
        height: 60,
        borderRadius: 30,
        ...shadows.lg,
    },
    fabGradient: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
