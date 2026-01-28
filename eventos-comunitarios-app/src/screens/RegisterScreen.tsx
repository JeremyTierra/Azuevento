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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { colors, spacing, typography } from '../theme';

export const RegisterScreen: React.FC = () => {
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
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <Ionicons name="calendar" size={48} color={colors.primary} />
                        <Text style={styles.logoText}>Azuevento</Text>
                    </View>
                    <Text style={styles.title}>Crear Cuenta</Text>
                    <Text style={styles.subtitle}>
                        Únete a la comunidad y descubre eventos increíbles
                    </Text>
                </View>

                <View style={styles.form}>
                    <Input
                        label="Nombre completo"
                        placeholder="Juan Pérez"
                        value={formData.name}
                        onChangeText={(text) => updateField('name', text)}
                        error={errors.name}
                        autoCapitalize="words"
                        autoCorrect={false}
                    />

                    <Input
                        label="Email"
                        placeholder="juan@email.com"
                        value={formData.email}
                        onChangeText={(text) => updateField('email', text)}
                        error={errors.email}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />

                    <Input
                        label="Contraseña"
                        placeholder="Mínimo 6 caracteres"
                        value={formData.password}
                        onChangeText={(text) => updateField('password', text)}
                        error={errors.password}
                        secureTextEntry
                        autoCapitalize="none"
                    />

                    <Input
                        label="Confirmar contraseña"
                        placeholder="Repite tu contraseña"
                        value={formData.confirmPassword}
                        onChangeText={(text) => updateField('confirmPassword', text)}
                        error={errors.confirmPassword}
                        secureTextEntry
                        autoCapitalize="none"
                    />

                    <Button
                        title="Crear Cuenta"
                        onPress={handleRegister}
                        loading={loading}
                        fullWidth
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
                    <TouchableOpacity>
                        <Text style={styles.loginLink}>Inicia sesión</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        flexGrow: 1,
        padding: spacing.lg,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    logoText: {
        fontSize: 32,
        fontWeight: '700',
        color: colors.primary,
    },
    title: {
        fontSize: typography.h1.fontSize,
        fontWeight: typography.h1.fontWeight,
        color: colors.text.primary,
        marginBottom: spacing.xs,
    },
    subtitle: {
        fontSize: typography.body.fontSize,
        color: colors.text.secondary,
        textAlign: 'center',
    },
    form: {
        marginBottom: spacing.xl,
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
