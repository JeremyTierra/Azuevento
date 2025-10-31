import React, { useState } from 'react';
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
import userService, { UpdatePasswordData } from '../services/userService';
import { ProfileStackParamList } from '../navigation/TabNavigator';

type ChangePasswordScreenNavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'ChangePassword'>;

interface Props {
    navigation: ChangePasswordScreenNavigationProp;
}

const ChangePasswordScreen: React.FC<Props> = ({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!currentPassword) {
            newErrors.currentPassword = 'Ingresa tu contraseña actual';
        }

        if (!newPassword) {
            newErrors.newPassword = 'Ingresa una nueva contraseña';
        } else if (newPassword.length < 6) {
            newErrors.newPassword = 'Mínimo 6 caracteres';
        }

        if (!confirmPassword) {
            newErrors.confirmPassword = 'Confirma tu nueva contraseña';
        } else if (newPassword !== confirmPassword) {
            newErrors.confirmPassword = 'Las contraseñas no coinciden';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleUpdatePassword = async () => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            const data: UpdatePasswordData = {
                currentPassword,
                newPassword,
            };

            await userService.updatePassword(data);

            Alert.alert(
                '✅ Contraseña actualizada',
                'Tu contraseña ha sido cambiada exitosamente',
                [{ text: 'Aceptar', onPress: () => navigation.goBack() }]
            );

            // Limpiar campos
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            console.error('Error updating password:', error);
            if (error.response?.status === 400) {
                Alert.alert(
                    '❌ Contraseña incorrecta',
                    'La contraseña actual que ingresaste no es correcta'
                );
            } else {
                Alert.alert(
                    '❌ Error',
                    'No se pudo actualizar la contraseña. Por favor, intenta de nuevo.'
                );
            }
        } finally {
            setLoading(false);
        }
    };

    const getPasswordStrength = () => {
        if (!newPassword) return null;

        let strength = 0;
        if (newPassword.length >= 6) strength++;
        if (newPassword.length >= 8) strength++;
        if (/[A-Z]/.test(newPassword)) strength++;
        if (/[0-9]/.test(newPassword)) strength++;
        if (/[^A-Za-z0-9]/.test(newPassword)) strength++;

        if (strength <= 2) return { label: 'Débil', color: colors.error };
        if (strength <= 3) return { label: 'Media', color: '#F59E0B' };
        return { label: 'Fuerte', color: colors.success };
    };

    const strength = getPasswordStrength();

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
                <Text style={styles.headerTitle}>Cambiar Contraseña</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Icon Section */}
                <View style={styles.iconSection}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="shield-checkmark" size={56} color={colors.text.inverse} />
                    </View>
                    <Text style={styles.subtitle}>
                        Protege tu cuenta con una contraseña segura
                    </Text>
                </View>

                {/* Card Container */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="lock-closed-outline" size={24} color={colors.primary} />
                        <Text style={styles.cardTitle}>Nueva Contraseña</Text>
                    </View>

                    <View style={styles.formSection}>
                        <Input
                            placeholder="Contraseña actual"
                            value={currentPassword}
                            onChangeText={(text: string) => {
                                setCurrentPassword(text);
                                if (errors.currentPassword) {
                                    setErrors({ ...errors, currentPassword: '' });
                                }
                            }}
                            secureTextEntry
                            icon="lock-closed-outline"
                            error={errors.currentPassword}
                        />

                        <Input
                            placeholder="Nueva contraseña"
                            value={newPassword}
                            onChangeText={(text: string) => {
                                setNewPassword(text);
                                if (errors.newPassword) {
                                    setErrors({ ...errors, newPassword: '' });
                                }
                            }}
                            secureTextEntry
                            icon="key-outline"
                            error={errors.newPassword}
                        />

                        {/* Password Strength Indicator */}
                        {newPassword && !errors.newPassword && strength && (
                            <View style={styles.strengthContainer}>
                                <Text style={styles.strengthLabel}>Seguridad:</Text>
                                <View style={[styles.strengthBadge, { backgroundColor: strength.color + '20' }]}>
                                    <Text style={[styles.strengthText, { color: strength.color }]}>
                                        {strength.label}
                                    </Text>
                                </View>
                            </View>
                        )}

                        <Input
                            placeholder="Confirmar nueva contraseña"
                            value={confirmPassword}
                            onChangeText={(text: string) => {
                                setConfirmPassword(text);
                                if (errors.confirmPassword) {
                                    setErrors({ ...errors, confirmPassword: '' });
                                }
                            }}
                            secureTextEntry
                            icon="key-outline"
                            error={errors.confirmPassword}
                        />
                    </View>
                </View>

                {/* Tips Card */}
                <View style={styles.tipsCard}>
                    <View style={styles.tipsHeader}>
                        <Ionicons name="bulb-outline" size={20} color={colors.secondary} />
                        <Text style={styles.tipsTitle}>Consejos de Seguridad</Text>
                    </View>
                    <View style={styles.tipsList}>
                        <TipItem text="Usa al menos 6 caracteres" />
                        <TipItem text="Combina letras mayúsculas y minúsculas" />
                        <TipItem text="Incluye números y símbolos" />
                        <TipItem text="Evita información personal obvia" />
                    </View>
                </View>

                {/* Action Button */}
                <View style={styles.actions}>
                    <Button
                        title="Actualizar Contraseña"
                        onPress={handleUpdatePassword}
                        loading={loading}
                        variant="secondary"
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const TipItem: React.FC<{ text: string }> = ({ text }) => (
    <View style={styles.tipItem}>
        <Ionicons name="checkmark-circle" size={16} color={colors.success} />
        <Text style={styles.tipText}>{text}</Text>
    </View>
);

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
    iconSection: {
        alignItems: 'center',
        marginBottom: spacing.xl,
        marginTop: spacing.md,
    },
    iconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: colors.secondary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
        ...shadows.md,
    },
    subtitle: {
        fontSize: typography.body.fontSize,
        color: colors.text.secondary,
        textAlign: 'center',
        paddingHorizontal: spacing.xl,
        lineHeight: 22,
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
    strengthContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginTop: -spacing.xs,
    },
    strengthLabel: {
        fontSize: typography.caption.fontSize,
        color: colors.text.secondary,
    },
    strengthBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: borderRadius.sm,
    },
    strengthText: {
        fontSize: typography.caption.fontSize,
        fontWeight: '600',
    },
    tipsCard: {
        backgroundColor: colors.secondaryLight + '15',
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        marginBottom: spacing.lg,
        borderLeftWidth: 4,
        borderLeftColor: colors.secondary,
    },
    tipsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    tipsTitle: {
        fontSize: typography.h5.fontSize,
        fontWeight: typography.h5.fontWeight,
        color: colors.text.primary,
    },
    tipsList: {
        gap: spacing.sm,
    },
    tipItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    tipText: {
        flex: 1,
        fontSize: typography.bodySmall.fontSize,
        color: colors.text.secondary,
        lineHeight: 20,
    },
    actions: {
        marginTop: spacing.md,
    },
});

export default ChangePasswordScreen;
