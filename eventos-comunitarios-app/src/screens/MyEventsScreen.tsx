import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation/AppNavigator';
import { eventService } from '../services/eventService';
import { EventCard } from '../components/EventCard';
import { Button } from '../components/Button';
import { Loading } from '../components/Loading';
import type { Event } from '../types/models';
import { colors, spacing, typography } from '../theme';

type MyEventsNavigationProp = NativeStackNavigationProp<MainStackParamList, 'MyEvents'>;

type Tab = 'organized' | 'attending';

export const MyEventsScreen: React.FC = () => {
    const navigation = useNavigation<MyEventsNavigationProp>();
    const [activeTab, setActiveTab] = useState<Tab>('organized');
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            loadEvents();
        }, [activeTab])
    );

    const loadEvents = async () => {
        setLoading(true);
        try {
            const data = await eventService.getMyEvents();
            setEvents(data);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'No se pudieron cargar los eventos');
        } finally {
            setLoading(false);
        }
    };

    const handleEventPress = (event: Event) => {
        navigation.navigate('EventDetail', { eventId: event.id });
    };

    const handlePublish = async (eventId: number) => {
        try {
            await eventService.publish(eventId);
            Alert.alert('Éxito', 'Evento publicado correctamente');
            loadEvents();
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
                            loadEvents();
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
                        title="Publicar"
                        variant="primary"
                        onPress={() => handlePublish(item.id)}
                        style={styles.actionButton}
                    />
                </View>
            )}

            {activeTab === 'organized' && item.status === 'PUBLISHED' && (
                <View style={styles.actions}>
                    <Button
                        title="Cancelar"
                        variant="danger"
                        onPress={() => handleCancel(item.id)}
                        style={styles.actionButton}
                    />
                </View>
            )}
        </View>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Ionicons
                name={activeTab === 'organized' ? 'create-outline' : 'ticket-outline'}
                size={64}
                color={colors.text.disabled}
            />
            <Text style={styles.emptyTitle}>
                {activeTab === 'organized' ? 'No has creado eventos' : 'No estás asistiendo a eventos'}
            </Text>
            {activeTab === 'organized' && (
                <Button
                    title="Crear mi primer evento"
                    onPress={() => navigation.navigate('CreateEvent')}
                    style={styles.createButton}
                />
            )}
        </View>
    );

    const organizedEvents = events.filter(e => e.isOrganizer);
    const attendingEvents = events.filter(e => e.hasUserRegistered && !e.isOrganizer);
    const displayEvents = activeTab === 'organized' ? organizedEvents : attendingEvents;

    if (loading) {
        return <Loading message="Cargando tus eventos..." />;
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Mis Eventos</Text>
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'organized' && styles.tabActive]}
                    onPress={() => setActiveTab('organized')}
                >
                    <Text
                        style={[styles.tabText, activeTab === 'organized' && styles.tabTextActive]}
                    >
                        Organizados ({organizedEvents.length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'attending' && styles.tabActive]}
                    onPress={() => setActiveTab('attending')}
                >
                    <Text
                        style={[styles.tabText, activeTab === 'attending' && styles.tabTextActive]}
                    >
                        Asistiendo ({attendingEvents.length})
                    </Text>
                </TouchableOpacity>
            </View>

            {/* List */}
            <FlatList
                data={displayEvents}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderEventItem}
                ListEmptyComponent={renderEmptyState}
                contentContainerStyle={styles.listContent}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
    },
    headerTitle: {
        fontSize: typography.h2.fontSize,
        fontWeight: typography.h2.fontWeight,
        color: colors.text.primary,
    },
    tabs: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    tab: {
        flex: 1,
        paddingVertical: spacing.md,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabActive: {
        borderBottomColor: colors.primary,
    },
    tabText: {
        fontSize: typography.body.fontSize,
        color: colors.text.secondary,
    },
    tabTextActive: {
        fontWeight: '600',
        color: colors.primary,
    },
    listContent: {
        padding: spacing.md,
    },
    actions: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginTop: -spacing.md,
        marginBottom: spacing.md,
        paddingHorizontal: spacing.md,
    },
    actionButton: {
        flex: 1,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xxl,
        gap: spacing.md,
    },
    emptyTitle: {
        fontSize: typography.h4.fontSize,
        fontWeight: typography.h4.fontWeight,
        color: colors.text.primary,
        marginBottom: spacing.lg,
        textAlign: 'center',
    },
    createButton: {
        marginTop: spacing.md,
    },
});
