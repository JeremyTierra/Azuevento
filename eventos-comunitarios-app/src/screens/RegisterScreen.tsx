import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
    TouchableOpacity,
    Image,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { colors, spacing, typography, shadows, borderRadius } from '../theme';

type RegisterNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

export const RegisterScreen: React.FC = () => {
    const navigation = useNavigation<RegisterNavigationProp>();
    const { signUp } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'El nombre es requerido';
        } else if (formData.name.trim().length < 2) {
            newErrors.name = 'El nombre debe tener al menos 2 caracteres';
        }

        if (!formData.email) {
            newErrors.email = 'El email es requerido';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email inválido';
        }

        if (!formData.password) {
            newErrors.password = 'La contraseña es requerida';
        } else if (formData.password.length < 6) {
            newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Confirma tu contraseña';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Las contraseñas no coinciden';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleRegister = async () => {
        if (!validate()) return;

        setLoading(true);
        try {
            await signUp({
                name: formData.name.trim(),
                email: formData.email.trim(),
                password: formData.password,
            });
            // Navigation will happen automatically via AuthContext
        } catch (error: any) {
            Alert.alert(
                'Error de registro',
                error.message || 'No se pudo crear la cuenta. Por favor, intenta nuevamente.'
            );
        } finally {
            setLoading(false);
        }
    };

    const updateField = (field: keyof typeof formData, value: string) => {
        setFormData({ ...formData, [field]: value });
        setErrors({ ...errors, [field]: undefined });
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
            <View style={styles.backgroundOrbTop} pointerEvents="none" />
            <View style={styles.backgroundOrbBottom} pointerEvents="none" />
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.header}>
                        <View style={styles.logoHalo}>
                            <Image
                                source={require('../../assets/logo.png')}
                                style={styles.logoImage}
                                resizeMode="contain"
                            />
                            <View style={styles.logoBadge}>
                                <Ionicons name="sparkles" size={16} color={colors.primary} />
                            </View>
                        </View>
                        <View style={styles.logoContainer}>
                            <Text style={styles.logoText}>Azuevento</Text>
                        </View>
                        <Text style={styles.tagline}>Eventos de tu comunidad</Text>
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.title}>Crea tu cuenta</Text>
                        <Text style={styles.subtitle}>
                            Únete a la comunidad y descubre eventos increíbles
                        </Text>

                        <Input
                            label="Nombre completo"
                            placeholder="Juan Pérez"
                            value={formData.name}
                            onChangeText={(text) => updateField('name', text)}
                            error={errors.name}
                            autoCapitalize="words"
                            autoCorrect={false}
                            icon="person-outline"
                        />

                        <Input
                            label="Correo electrónico"
                            placeholder="juan@email.com"
                            value={formData.email}
                            onChangeText={(text) => updateField('email', text)}
                            error={errors.email}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            icon="mail-outline"
                        />

                        <Input
                            label="Contraseña"
                            placeholder="Mínimo 6 caracteres"
                            value={formData.password}
                            onChangeText={(text) => updateField('password', text)}
                            error={errors.password}
                            secureTextEntry
                            autoCapitalize="none"
                            icon="lock-closed-outline"
                        />

                        <Input
                            label="Confirmar contraseña"
                            placeholder="Repite tu contraseña"
                            value={formData.confirmPassword}
                            onChangeText={(text) => updateField('confirmPassword', text)}
                            error={errors.confirmPassword}
                            secureTextEntry
                            autoCapitalize="none"
                            icon="shield-checkmark-outline"
                        />

                        <Button
                            title="Crear Cuenta"
                            onPress={handleRegister}
                            loading={loading}
                            fullWidth
                            style={styles.primaryButton}
                        />

                        <View style={styles.termsContainer}>
                            <Text style={styles.termsText}>
                                Al registrarte, aceptas nuestros{' '}
                                <Text style={styles.termsLink}>Términos y condiciones</Text>
                            </Text>
                        </View>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                            <Text style={styles.loginLink}>Inicia sesión</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
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
        backgroundColor: colors.background,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xl,
        paddingBottom: spacing.xxl,
    },
    backgroundOrbTop: {
        position: 'absolute',
        top: -140,
        right: -80,
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: colors.primaryLight,
        opacity: 0.1,
    },
    backgroundOrbBottom: {
        position: 'absolute',
        bottom: -180,
        left: -100,
        width: 260,
        height: 260,
        borderRadius: 130,
        backgroundColor: colors.primaryLight,
        opacity: 0.08,
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    logoHalo: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
        ...shadows.md,
    },
    logoImage: {
        width: 68,
        height: 68,
    },
    logoBadge: {
        position: 'absolute',
        bottom: -6,
        right: -6,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.full,
        padding: spacing.xs,
        borderWidth: 1,
        borderColor: colors.borderLight,
        ...shadows.sm,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    logoText: {
        fontSize: 28,
        fontWeight: '700',
        color: colors.primary,
    },
    tagline: {
        fontSize: typography.bodySmall.fontSize,
        color: colors.text.secondary,
        marginTop: spacing.xs,
    },
    title: {
        fontSize: typography.h3.fontSize,
        fontWeight: typography.h3.fontWeight,
        color: colors.text.primary,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: typography.body.fontSize,
        color: colors.text.secondary,
        textAlign: 'center',
        marginTop: spacing.xs,
        marginBottom: spacing.lg,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        marginTop: spacing.md,
        ...shadows.md,
    },
    primaryButton: {
        borderRadius: borderRadius.lg,
        ...shadows.sm,
    },
    termsContainer: {
        marginTop: spacing.md,
        paddingHorizontal: spacing.md,
    },
    termsText: {
        fontSize: typography.bodySmall.fontSize,
        color: colors.text.secondary,
        textAlign: 'center',
    },
    termsLink: {
        color: colors.primary,
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: spacing.xs,
        marginTop: spacing.lg,
    },
    footerText: {
        fontSize: typography.body.fontSize,
        color: colors.text.secondary,
    },
    loginLink: {
        fontSize: typography.body.fontSize,
        fontWeight: '600',
        color: colors.primary,
    },
});
