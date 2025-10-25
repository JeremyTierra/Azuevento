import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import { favoriteService } from '../services/favoriteService';
import { EventCard } from '../components/EventCard';
import { Loading } from '../components/Loading';
import { useAuth } from '../contexts/AuthContext';
import type { Event } from '../types/models';
import { colors, spacing, typography } from '../theme';

type FavoritesScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'Favorites'>;

export const FavoritesScreen: React.FC = () => {
    const { user } = useAuth();
    const navigation = useNavigation<FavoritesScreenNavigationProp>();
    const [favorites, setFavorites] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadFavorites();
    }, []);

    const loadFavorites = async () => {
        if (!user) return;

        try {
            const data = await favoriteService.getUserFavorites();
            setFavorites(data);
        } catch (error: any) {
            console.error('Error loading favorites:', error);
            Alert.alert('Error', 'No se pudieron cargar los favoritos');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadFavorites();
    };

    const handleEventPress = (event: Event) => {
        navigation.navigate('EventDetail', { eventId: event.id });
    };

    const renderEmpty = () => (
        <View style={styles.emptyState}>
            <Ionicons name="heart-outline" size={64} color={colors.text.disabled} />
            <Text style={styles.emptyTitle}>No tienes favoritos</Text>
            <Text style={styles.emptyText}>
                Los eventos que marques como favoritos aparecerán aquí
            </Text>
        </View>
    );

    if (loading) {
        return <Loading message="Cargando favoritos..." />;
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Favoritos</Text>
            </View>

            <FlatList
                data={favorites}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <EventCard event={item} onPress={() => handleEventPress(item)} />
                )}
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
    listContent: {
        padding: spacing.lg,
        paddingTop: 0,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: spacing.xxl,
        paddingHorizontal: spacing.xl,
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
});
