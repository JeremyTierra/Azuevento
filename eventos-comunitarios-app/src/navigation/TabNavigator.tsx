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
import { MapScreen } from '../screens/MapScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import { MyTicketScreen } from '../screens/MyTicketScreen';
import { ScannerScreen } from '../screens/ScannerScreen';
import { colors } from '../theme';

// Stack navigation types for each tab
export type ExploreStackParamList = {
    ExploreHome: undefined;
    EventDetail: { eventId: number };
    CreateEvent: undefined;
    Comments: { eventId: number; eventTitle: string };
    MyTicket: { eventId: number; eventTitle: string };
};

export type MapStackParamList = {
    MapMain: { focusEventId?: number } | undefined;
    EventDetail: { eventId: number };
    Comments: { eventId: number; eventTitle: string };
};

export type MyEventsStackParamList = {
    MyEventsList: undefined;
    EventDetail: { eventId: number };
    CreateEvent: undefined;
    Comments: { eventId: number; eventTitle: string };
    MyTicket: { eventId: number; eventTitle: string };
    Scanner: { eventId: number; eventTitle: string };
};

export type TabParamList = {
    Explore: undefined;
    MyEvents: undefined;
    Map: undefined;
    Profile: undefined;
};

export type ProfileStackParamList = {
    ProfileMain: undefined;
    EditProfile: undefined;
    ChangePassword: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const ExploreStack = createNativeStackNavigator<ExploreStackParamList>();
const MapStack = createNativeStackNavigator<MapStackParamList>();
const MyEventsStack = createNativeStackNavigator<MyEventsStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

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
                name="Comments"
                component={CommentsScreen}
            />
            <ExploreStack.Screen
                name="MyTicket"
                component={MyTicketScreen}
            />
        </ExploreStack.Navigator>
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

// MyEvents Stack Navigator
const MyEventsNavigator = () => {
    return (
        <MyEventsStack.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >
            <MyEventsStack.Screen
                name="MyEventsList"
                component={MyEventsScreen}
            />
            <MyEventsStack.Screen
                name="EventDetail"
                component={EventDetailScreen}
            />
            <MyEventsStack.Screen
                name="CreateEvent"
                component={CreateEventScreen}
            />
            <MyEventsStack.Screen
                name="Comments"
                component={CommentsScreen}
            />
            <MyEventsStack.Screen
                name="MyTicket"
                component={MyTicketScreen}
            />
            <MyEventsStack.Screen
                name="Scanner"
                component={ScannerScreen}
            />
        </MyEventsStack.Navigator>
    );
};

// Profile Navigator
const ProfileNavigator = () => {
    return (
        <ProfileStack.Navigator
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
            }}
        >
            <ProfileStack.Screen
                name="ProfileMain"
                component={ProfileScreen}
            />
            <ProfileStack.Screen
                name="EditProfile"
                component={EditProfileScreen}
            />
            <ProfileStack.Screen
                name="ChangePassword"
                component={ChangePasswordScreen}
            />
        </ProfileStack.Navigator>
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
                    } else if (route.name === 'MyEvents') {
                        iconName = focused ? 'calendar' : 'calendar-outline';
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
                name="MyEvents"
                component={MyEventsNavigator}
                options={{ tabBarLabel: 'Agenda' }}
            />
            <Tab.Screen
                name="Map"
                component={MapNavigator}
                options={{ tabBarLabel: 'Mapa' }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileNavigator}
                options={{ tabBarLabel: 'Perfil' }}
            />
        </Tab.Navigator>
    );
};
