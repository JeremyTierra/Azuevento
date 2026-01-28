import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { HomeScreen } from '../screens/HomeScreen';
import { EventDetailScreen } from '../screens/EventDetailScreen';
import { CreateEventScreen } from '../screens/CreateEventScreen';
import { MyEventsScreen } from '../screens/MyEventsScreen';
import { CommentsScreen } from '../screens/CommentsScreen';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import { MapScreen } from '../screens/MapScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { colors } from '../theme';

// Stack navigation types for each tab
export type ExploreStackParamList = {
    ExploreHome: undefined;
    EventDetail: { eventId: number };
    CreateEvent: undefined;
    MyEvents: undefined;
    Comments: { eventId: number; eventTitle: string };
};

export type FavoritesStackParamList = {
    FavoritesList: undefined;
    EventDetail: { eventId: number };
    Comments: { eventId: number; eventTitle: string };
};

export type MapStackParamList = {
    MapMain: undefined;
    EventDetail: { eventId: number };
    Comments: { eventId: number; eventTitle: string };
};

export type TabParamList = {
    Explore: undefined;
    Favorites: undefined;
    Map: undefined;
    Profile: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const ExploreStack = createNativeStackNavigator<ExploreStackParamList>();
const FavoritesStack = createNativeStackNavigator<FavoritesStackParamList>();
const MapStack = createNativeStackNavigator<MapStackParamList>();

// Explore Stack Navigator
const ExploreNavigator = () => {
    return (
        <ExploreStack.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >
            <ExploreStack.Screen
                name="ExploreHome"
                component={HomeScreen}
            />
            <ExploreStack.Screen
                name="EventDetail"
                component={EventDetailScreen}
            />
            <ExploreStack.Screen
                name="CreateEvent"
                component={CreateEventScreen}
            />
            <ExploreStack.Screen
                name="MyEvents"
                component={MyEventsScreen}
            />
            <ExploreStack.Screen
                name="Comments"
                component={CommentsScreen}
            />
        </ExploreStack.Navigator>
    );
};

// Favorites Stack Navigator
const FavoritesNavigator = () => {
    return (
        <FavoritesStack.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >
            <FavoritesStack.Screen
                name="FavoritesList"
                component={FavoritesScreen}
            />
            <FavoritesStack.Screen
                name="EventDetail"
                component={EventDetailScreen}
            />
            <FavoritesStack.Screen
                name="Comments"
                component={CommentsScreen}
            />
        </FavoritesStack.Navigator>
    );
};

// Map Stack Navigator
const MapNavigator = () => {
    return (
        <MapStack.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >
            <MapStack.Screen
                name="MapMain"
                component={MapScreen}
            />
            <MapStack.Screen
                name="EventDetail"
                component={EventDetailScreen}
            />
            <MapStack.Screen
                name="Comments"
                component={CommentsScreen}
            />
        </MapStack.Navigator>
    );
};

// Main Tab Navigator
export const TabNavigator = () => {
    const insets = useSafeAreaInsets();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: keyof typeof Ionicons.glyphMap;

                    if (route.name === 'Explore') {
                        iconName = focused ? 'compass' : 'compass-outline';
                    } else if (route.name === 'Favorites') {
                        iconName = focused ? 'heart' : 'heart-outline';
                    } else if (route.name === 'Map') {
                        iconName = focused ? 'map' : 'map-outline';
                    } else if (route.name === 'Profile') {
                        iconName = focused ? 'person' : 'person-outline';
                    } else {
                        iconName = 'help-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.text.disabled,
                tabBarStyle: {
                    backgroundColor: colors.surface,
                    borderTopColor: colors.border,
                    paddingBottom: 5 + insets.bottom,
                    paddingTop: 5,
                    height: 60 + insets.bottom,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600',
                },
            })}
        >
            <Tab.Screen
                name="Explore"
                component={ExploreNavigator}
                options={{ tabBarLabel: 'Explorar' }}
            />
            <Tab.Screen
                name="Favorites"
                component={FavoritesNavigator}
                options={{ tabBarLabel: 'Favoritos' }}
            />
            <Tab.Screen
                name="Map"
                component={MapNavigator}
                options={{ tabBarLabel: 'Mapa' }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{ tabBarLabel: 'Perfil' }}
            />
        </Tab.Navigator>
    );
};
