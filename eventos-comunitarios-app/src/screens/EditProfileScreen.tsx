import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Alert,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { colors, spacing, typography, borderRadius, shadows } from '../theme';
import userService, { UpdateProfileData } from '../services/userService';
import { useAuth } from '../contexts/AuthContext';
import { ProfileStackParamList } from '../navigation/TabNavigator';

type EditProfileScreenNavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'EditProfile'>;

interface Props {
    navigation: EditProfileScreenNavigationProp;
}

const EditProfileScreen: React.FC<Props> = ({ navigation }) => {
    const { user, updateUser } = useAuth();
    const [loading, setLoading] = useState(false);

    // Profile data
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');

    // Errors
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (user) {
            setName(user.name);
            setEmail(user.email);
        }
    }, [user]);

    const validateEmail = (email: string): boolean => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!name.trim()) {
            newErrors.name = 'El nombre es requerido';
        } else if (name.trim().length < 2) {
            newErrors.name = 'El nombre debe tener al menos 2 caracteres';
        }

        if (!email.trim()) {
            newErrors.email = 'El email es requerido';
        } else if (!validateEmail(email)) {
            newErrors.email = 'Email inválido';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleUpdateProfile = async () => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            const data: UpdateProfileData = {
                name: name.trim(),
                email: email.trim().toLowerCase(),
            };

            const updatedUser = await userService.updateProfile(data);
            updateUser(updatedUser);

            Alert.alert(
                '✅ Éxito',
                'Tu perfil se ha actualizado correctamente',
                [{ text: 'Aceptar', onPress: () => navigation.goBack() }]
            );
        } catch (error: any) {
            console.error('Error updating profile:', error);
            if (error.response?.status === 409) {
                Alert.alert(
                    '⚠️ Email en uso',
                    'Este email ya está siendo utilizado por otra cuenta'
                );
            } else {
                Alert.alert(
                    '❌ Error',
                    'No se pudo actualizar tu perfil. Por favor, intenta de nuevo.'
                );
            }
        } finally {
            setLoading(false);
        }
    };

    const hasChanges = () => {
        return name !== user?.name || email !== user?.email;
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                >
                    <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Editar Perfil</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Avatar Section */}
                <View style={styles.avatarSection}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Ionicons name="person" size={56} color={colors.text.inverse} />
                        </View>
                        <View style={styles.avatarBadge}>
                            <Ionicons name="camera" size={16} color={colors.text.inverse} />
                        </View>
                    </View>
                    <Text style={styles.avatarHint}>Toca para cambiar foto</Text>
                </View>

                {/* Card Container */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="person-circle-outline" size={24} color={colors.primary} />
                        <Text style={styles.cardTitle}>Información Personal</Text>
                    </View>

                    <View style={styles.formSection}>
                        <Input
                            placeholder="Nombre completo"
                            value={name}
                            onChangeText={(text: string) => {
                                setName(text);
                                if (errors.name) {
                                    setErrors({ ...errors, name: '' });
                                }
                            }}
                            icon="person-outline"
                            error={errors.name}
                        />

                        <Input
                            placeholder="Email"
                            value={email}
                            onChangeText={(text: string) => {
                                setEmail(text);
                                if (errors.email) {
                                    setErrors({ ...errors, email: '' });
                                }
                            }}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            icon="mail-outline"
                            error={errors.email}
                        />
                    </View>
                </View>

                {/* Info Box */}
                {hasChanges() && (
                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle" size={20} color={colors.primary} />
                        <Text style={styles.infoText}>
                            Tienes cambios sin guardar
                        </Text>
                    </View>
                )}

                {/* Action Buttons */}
                <View style={styles.actions}>
                    <Button
                        title={hasChanges() ? "Guardar Cambios" : "Todo Actualizado"}
                        onPress={handleUpdateProfile}
                        loading={loading}
                        disabled={!hasChanges()}
                    />

                    {hasChanges() && (
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => {
                                setName(user?.name || '');
                                setEmail(user?.email || '');
                                setErrors({});
                            }}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.cancelButtonText}>Descartar Cambios</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Security Notice */}
                <View style={styles.securityNotice}>
                    <Ionicons name="shield-checkmark-outline" size={18} color={colors.text.secondary} />
                    <Text style={styles.securityText}>
                        Tu información está protegida y encriptada
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: typography.h4.fontSize,
        fontWeight: typography.h4.fontWeight,
        color: colors.text.primary,
    },
    headerSpacer: {
        width: 40,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: spacing.lg,
        paddingBottom: spacing.xl * 2,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: spacing.xl,
        marginTop: spacing.md,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: spacing.sm,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...shadows.md,
    },
    avatarBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.secondary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: colors.background,
    },
    avatarHint: {
        fontSize: typography.caption.fontSize,
        color: colors.text.secondary,
        marginTop: spacing.xs,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        marginBottom: spacing.lg,
        ...shadows.sm,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.lg,
        gap: spacing.sm,
    },
    cardTitle: {
        fontSize: typography.h5.fontSize,
        fontWeight: typography.h5.fontWeight,
        color: colors.text.primary,
    },
    formSection: {
        gap: spacing.md,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primaryLight + '20',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.lg,
        gap: spacing.sm,
        marginBottom: spacing.lg,
        borderLeftWidth: 3,
        borderLeftColor: colors.primary,
    },
    infoText: {
        flex: 1,
        fontSize: typography.bodySmall.fontSize,
        color: colors.primary,
        fontWeight: '600',
    },
    actions: {
        gap: spacing.md,
        marginBottom: spacing.lg,
    },
    cancelButton: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        alignItems: 'center',
        borderRadius: borderRadius.lg,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
    },
    cancelButtonText: {
        fontSize: typography.body.fontSize,
        color: colors.text.secondary,
        fontWeight: '600',
    },
    securityNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
        paddingTop: spacing.lg,
    },
    securityText: {
        fontSize: typography.caption.fontSize,
        color: colors.text.secondary,
    },
});

export default EditProfileScreen;
