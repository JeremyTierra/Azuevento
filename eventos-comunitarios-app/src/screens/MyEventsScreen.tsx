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
    ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MyEventsStackParamList } from '../navigation/TabNavigator';
import { eventService } from '../services/eventService';
import { favoriteService } from '../services/favoriteService';
import { EventCard } from '../components/EventCard';
import { Button } from '../components/Button';
import type { Event } from '../types/models';
import { colors, spacing, typography, borderRadius } from '../theme';

type MyEventsNavigationProp = NativeStackNavigationProp<MyEventsStackParamList, 'MyEventsList'>;

type Tab = 'favorites' | 'organized' | 'attending';

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
            const [organized, favorites] = await Promise.all([
                eventService.getMyEvents(),
                favoriteService.getUserFavorites(),
            ]);

            setAllOrganized(organized);
            setAllFavorites(favorites);
            // TODO: Cuando tengamos el endpoint de eventos asistiendo, cargarlo aquí
            setAllAttending([]);
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
            '¿Estás seguro de que quieres cancelar este evento?',
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

    const renderEventItem = ({ item }: { item: Event }) => (
        <View>
            <EventCard event={item} onPress={() => handleEventPress(item)} />

            {activeTab === 'organized' && item.status === 'DRAFT' && (
                <View style={styles.actions}>
                    <Button
                        title="Publicar Evento"
                        onPress={() => handlePublish(item.id)}
                        variant="secondary"
                    />
                </View>
            )}

            {activeTab === 'organized' && item.status === 'PUBLISHED' && (
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => handleCancel(item.id)}
                    >
                        <Ionicons name="close-circle-outline" size={20} color={colors.error} />
                        <Text style={styles.cancelText}>Cancelar Evento</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    const renderEmpty = () => {
        let icon: keyof typeof Ionicons.glyphMap = 'heart-outline';
        let title = '';
        let text = '';
        let showCreateButton = false;

        if (activeTab === 'favorites') {
            icon = 'heart-outline';
            title = 'No tienes favoritos';
            text = 'Los eventos que marques como favoritos aparecerán aquí';
        } else if (activeTab === 'organized') {
            icon = 'calendar-outline';
            title = 'No has creado eventos';
            text = 'Crea tu primer evento y compártelo con la comunidad';
            showCreateButton = true;
        } else {
            icon = 'people-outline';
            title = 'No estás asistiendo a eventos';
            text = 'Explora eventos y marca tu asistencia';
        }

        return (
            <View style={styles.emptyState}>
                <Ionicons name={icon} size={56} color={colors.text.disabled} />
                <Text style={styles.emptyTitle}>{title}</Text>
                <Text style={styles.emptyText}>{text}</Text>
                {showCreateButton && (
                    <Button
                        title="Crear Evento"
                        onPress={() => navigation.navigate('CreateEvent')}
                        style={{ marginTop: spacing.lg }}
                    />
                )}
            </View>
        );
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
                <Text style={styles.headerTitle}>Mis Eventos</Text>

                {/* Category-style Tabs */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabsContainer}
                >
                    <TouchableOpacity
                        style={[
                            styles.tabChip,
                            activeTab === 'favorites' && styles.tabChipSelected
                        ]}
                        onPress={() => setActiveTab('favorites')}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name="heart"
                            size={16}
                            color={activeTab === 'favorites' ? colors.text.inverse : colors.text.secondary}
                        />
                        <Text style={[
                            styles.tabChipText,
                            activeTab === 'favorites' && styles.tabChipTextSelected
                        ]}>
                            Favoritos
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.tabChip,
                            activeTab === 'organized' && styles.tabChipSelected
                        ]}
                        onPress={() => setActiveTab('organized')}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name="calendar"
                            size={16}
                            color={activeTab === 'organized' ? colors.text.inverse : colors.text.secondary}
                        />
                        <Text style={[
                            styles.tabChipText,
                            activeTab === 'organized' && styles.tabChipTextSelected
                        ]}>
                            Organizados
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.tabChip,
                            activeTab === 'attending' && styles.tabChipSelected
                        ]}
                        onPress={() => setActiveTab('attending')}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name="people"
                            size={16}
                            color={activeTab === 'attending' ? colors.text.inverse : colors.text.secondary}
                        />
                        <Text style={[
                            styles.tabChipText,
                            activeTab === 'attending' && styles.tabChipTextSelected
                        ]}>
                            Asistiendo
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            {/* Event List */}
            <FlatList
                data={displayedEvents}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderEventItem}
                ListEmptyComponent={renderEmpty}
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
    header: {
        backgroundColor: colors.surface,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerTitle: {
        fontSize: typography.h2.fontSize,
        fontWeight: typography.h2.fontWeight,
        color: colors.text.primary,
        marginBottom: spacing.md,
    },
    tabsContainer: {
        gap: spacing.sm,
        paddingBottom: spacing.xs,
    },
    tabChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.full,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        gap: spacing.xs,
    },
    tabChipSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    tabChipText: {
        fontSize: typography.bodySmall.fontSize,
        fontWeight: '600',
        color: colors.text.secondary,
    },
    tabChipTextSelected: {
        color: colors.text.inverse,
    },
    listContent: {
        padding: spacing.lg,
        flexGrow: 1,
    },
    actions: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        paddingBottom: spacing.md,
    },
    cancelButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.sm,
        gap: spacing.xs,
    },
    cancelText: {
        fontSize: typography.body.fontSize,
        color: colors.error,
        fontWeight: '600',
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xxl * 2,
        paddingHorizontal: spacing.xl,
    },
    emptyTitle: {
        fontSize: typography.h3.fontSize,
        fontWeight: '600',
        color: colors.text.primary,
        marginTop: spacing.md,
        textAlign: 'center',
    },
    emptyText: {
        fontSize: typography.body.fontSize,
        color: colors.text.secondary,
        textAlign: 'center',
        marginTop: spacing.xs,
        lineHeight: 22,
    },
});
