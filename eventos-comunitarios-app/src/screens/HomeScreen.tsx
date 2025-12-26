import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    RefreshControl,
    ActivityIndicator,
    Alert,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ExploreStackParamList } from '../navigation/TabNavigator';
import { eventService } from '../services/eventService';
import { categoryService } from '../services/categoryService';
import { EventCard } from '../components/EventCard';
import type { Event, Category } from '../types/models';
import { colors, spacing, typography, borderRadius, shadows } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { getCategoryIcon } from '../utils/formatters';

type HomeScreenNavigationProp = NativeStackNavigationProp<ExploreStackParamList, 'ExploreHome'>;

export const HomeScreen: React.FC = () => {
    const navigation = useNavigation<HomeScreenNavigationProp>();
    const insets = useSafeAreaInsets();

    // State
    const [events, setEvents] = useState<Event[]>([]);
    const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    // Reload data when screen gains focus (e.g., after creating an event)
    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    useEffect(() => {
        filterEvents();
    }, [searchQuery, selectedCategory, events]);

    const loadData = async () => {
        try {
            const [eventsData, categoriesData] = await Promise.all([
                eventService.getAll(),
                categoryService.getAll(),
            ]);
            setEvents(eventsData);
            setFilteredEvents(eventsData);
            setCategories(categoriesData);
        } catch (error: any) {
            console.error('Error loading data:', error);
            Alert.alert('Error', error.message || 'No se pudieron cargar los datos');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const filterEvents = useCallback(() => {
        let result = [...events];

        if (selectedCategory !== null) {
            result = result.filter(event => event.categoryId === selectedCategory);
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            result = result.filter(event =>
                event.title.toLowerCase().includes(query) ||
                event.description.toLowerCase().includes(query) ||
                event.location.toLowerCase().includes(query) ||
                event.categoryName.toLowerCase().includes(query)
            );
        }

        setFilteredEvents(result);
    }, [events, selectedCategory, searchQuery]);

    const handleRefresh = () => {
        setRefreshing(true);
        setSelectedCategory(null);
        setSearchQuery('');
        loadData();
    };

    const handleEventPress = (event: Event) => {
        navigation.navigate('EventDetail', { eventId: event.id });
    };

    const handleCategoryPress = (categoryId: number | null) => {
        setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
    };

    const clearSearch = () => {
        setSearchQuery('');
        Keyboard.dismiss();
    };

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Ionicons
                name={searchQuery || selectedCategory ? "search-outline" : "calendar-outline"}
                size={56}
                color={colors.text.disabled}
            />
            <Text style={styles.emptyTitle}>
                {searchQuery || selectedCategory ? 'Sin resultados' : 'No hay eventos'}
            </Text>
            <Text style={styles.emptyText}>
                {searchQuery || selectedCategory
                    ? 'Intenta con otra búsqueda'
                    : '¡Sé el primero en crear uno!'}
            </Text>
            {(searchQuery || selectedCategory) && (
                <TouchableOpacity
                    style={styles.clearFiltersButton}
                    onPress={() => {
                        setSearchQuery('');
                        setSelectedCategory(null);
                    }}
                >
                    <Text style={styles.clearFiltersText}>Limpiar filtros</Text>
                </TouchableOpacity>
            )}
        </View>
    );

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
            <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <View style={[styles.searchBar, isSearchFocused && styles.searchBarFocused]}>
                        <Ionicons
                            name="search"
                            size={20}
                            color={isSearchFocused ? colors.primary : colors.text.secondary}
                        />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Buscar eventos..."
                            placeholderTextColor={colors.text.disabled}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setIsSearchFocused(false)}
                            returnKeyType="search"
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                <Ionicons name="close-circle" size={20} color={colors.text.secondary} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Category Chips */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoriesContainer}
                >
                    {/* All option */}
                    <TouchableOpacity
                        style={[
                            styles.categoryChip,
                            selectedCategory === null && styles.categoryChipSelected
                        ]}
                        onPress={() => handleCategoryPress(null)}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name="apps"
                            size={16}
                            color={selectedCategory === null ? colors.text.inverse : colors.text.secondary}
                        />
                        <Text style={[
                            styles.categoryChipText,
                            selectedCategory === null && styles.categoryChipTextSelected
                        ]}>
                            Todos
                        </Text>
                    </TouchableOpacity>

                    {categories.map((category) => (
                        <TouchableOpacity
                            key={category.id}
                            style={[
                                styles.categoryChip,
                                selectedCategory === category.id && styles.categoryChipSelected
                            ]}
                            onPress={() => handleCategoryPress(category.id)}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name={getCategoryIcon(category.name) as any}
                                size={16}
                                color={selectedCategory === category.id ? colors.text.inverse : colors.text.secondary}
                            />
                            <Text style={[
                                styles.categoryChipText,
                                selectedCategory === category.id && styles.categoryChipTextSelected
                            ]} numberOfLines={1}>
                                {category.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Events List */}
            <FlatList
                data={filteredEvents}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <EventCard event={item} onPress={() => handleEventPress(item)} />
                )}
                ListEmptyComponent={renderEmptyState}
                contentContainerStyle={[
                    styles.listContent,
                    filteredEvents.length === 0 && styles.listContentEmpty
                ]}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                    />
                }
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            />

            {/* FAB */}
            <TouchableOpacity
                style={[styles.fab, { bottom: spacing.lg + insets.bottom }]}
                onPress={() => navigation.navigate('CreateEvent')}
                activeOpacity={0.8}
            >
                <Ionicons name="add" size={28} color={colors.text.inverse} />
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
    // Header
    header: {
        backgroundColor: colors.surface,
        paddingBottom: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    // Search
    searchContainer: {
        paddingHorizontal: spacing.md,
        marginBottom: spacing.sm,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
        gap: spacing.sm,
    },
    searchBarFocused: {
        borderColor: colors.primary,
        backgroundColor: colors.surface,
    },
    searchInput: {
        flex: 1,
        fontSize: typography.body.fontSize,
        color: colors.text.primary,
        paddingVertical: 2,
    },
    // Categories
    categoriesContainer: {
        paddingHorizontal: spacing.md,
        gap: spacing.xs,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        gap: spacing.xs,
    },
    categoryChipSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    categoryChipText: {
        fontSize: typography.bodySmall.fontSize,
        color: colors.text.secondary,
        fontWeight: '500',
    },
    categoryChipTextSelected: {
        color: colors.text.inverse,
    },
    // List
    listContent: {
        padding: spacing.md,
        paddingBottom: 100,
    },
    listContentEmpty: {
        flex: 1,
    },
    // Empty state
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xxl,
        paddingHorizontal: spacing.lg,
    },
    emptyTitle: {
        fontSize: typography.h4.fontSize,
        fontWeight: '600',
        color: colors.text.primary,
        marginTop: spacing.md,
        marginBottom: spacing.xs,
    },
    emptyText: {
        fontSize: typography.body.fontSize,
        color: colors.text.secondary,
        textAlign: 'center',
    },
    clearFiltersButton: {
        marginTop: spacing.lg,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        backgroundColor: colors.primary,
        borderRadius: borderRadius.full,
    },
    clearFiltersText: {
        fontSize: typography.bodySmall.fontSize,
        fontWeight: '600',
        color: colors.text.inverse,
    },
    // FAB
    fab: {
        position: 'absolute',
        right: spacing.md,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...shadows.lg,
    },
});
