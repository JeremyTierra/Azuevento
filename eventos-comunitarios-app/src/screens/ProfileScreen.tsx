import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, typography, borderRadius } from '../theme';
import { ProfileStackParamList } from '../navigation/TabNavigator';

type ProfileScreenNavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'ProfileMain'>;

interface Props {
    navigation: ProfileScreenNavigationProp;
}

export const ProfileScreen: React.FC<Props> = ({ navigation }) => {
    const { user, signOut } = useAuth();

    const handleLogout = () => {
        Alert.alert(
            'Cerrar sesión',
            '¿Estás seguro de que quieres cerrar sesión?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Cerrar sesión',
                    style: 'destructive',
                    onPress: signOut,
                },
            ]
        );
    };

    const MenuItem = ({ icon, title, onPress, developing = false }: any) => (
        <TouchableOpacity
            style={styles.menuItem}
            onPress={onPress}
            disabled={developing}
        >
            <View style={styles.menuLeft}>
                <Ionicons name={icon} size={24} color={colors.text.primary} />
                <Text style={styles.menuTitle}>{title}</Text>
                {developing && (
                    <View style={styles.devBadge}>
                        <Text style={styles.devText}>En desarrollo</Text>
                    </View>
                )}
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text.disabled} />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                {/* Profile Header */}
                <View style={styles.header}>
                    <View style={styles.avatarContainer}>
                        <Ionicons name="person" size={40} color={colors.text.inverse} />
                    </View>
                    <Text style={styles.name}>{user?.name || 'Usuario'}</Text>
                    <Text style={styles.email}>{user?.email}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Cuenta</Text>
                    <MenuItem
                        icon="person-outline"
                        title="Editar perfil"
                        onPress={() => navigation.navigate('EditProfile')}
                    />
                    <MenuItem
                        icon="key-outline"
                        title="Cambiar contraseña"
                        onPress={() => navigation.navigate('ChangePassword')}
                    />
                    <MenuItem
                        icon="heart-outline"
                        title="Mis intereses"
                        onPress={() => { }}
                        developing
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Configuración</Text>
                    <MenuItem
                        icon="notifications-outline"
                        title="Notificaciones"
                        onPress={() => { }}
                        developing
                    />
                    <MenuItem
                        icon="shield-checkmark-outline"
                        title="Privacidad"
                        onPress={() => { }}
                        developing
                    />
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={24} color={colors.error} />
                    <Text style={styles.logoutText}>Cerrar sesión</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
    },
    container: {
        flex: 1,
    },
    content: {
        padding: spacing.lg,
    },
    header: {
        alignItems: 'center',
        paddingVertical: spacing.xl,
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    name: {
        fontSize: typography.h2.fontSize,
        fontWeight: typography.h2.fontWeight,
        color: colors.text.primary,
        marginBottom: spacing.xs,
    },
    email: {
        fontSize: typography.body.fontSize,
        color: colors.text.secondary,
    },
    section: {
        marginBottom: spacing.lg,
    },
    sectionTitle: {
        fontSize: typography.bodySmall.fontSize,
        fontWeight: '600',
        color: colors.text.secondary,
        textTransform: 'uppercase',
        marginBottom: spacing.sm,
        paddingHorizontal: spacing.sm,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.sm,
    },
    menuLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        flex: 1,
    },
    menuTitle: {
        fontSize: typography.body.fontSize,
        color: colors.text.primary,
        fontWeight: '500',
    },
    devBadge: {
        backgroundColor: colors.warningLight,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs / 2,
        borderRadius: borderRadius.sm,
    },
    devText: {
        fontSize: typography.caption.fontSize,
        color: colors.warning,
        fontWeight: '600',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.error,
        marginTop: spacing.lg,
    },
    logoutText: {
        fontSize: typography.body.fontSize,
        color: colors.error,
        fontWeight: '600',
    },
});
