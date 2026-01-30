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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { colors, spacing, typography } from '../theme';

type LoginNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC = () => {
    const navigation = useNavigation<LoginNavigationProp>();
    const { signIn } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

    const validate = (): boolean => {
        const newErrors: { email?: string; password?: string } = {};

        if (!email) {
            newErrors.email = 'El email es requerido';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Email inválido';
        }

        if (!password) {
            newErrors.password = 'La contraseña es requerida';
        } else if (password.length < 6) {
            newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLogin = async () => {
        if (!validate()) return;

        setLoading(true);
        try {
            await signIn({ email, password });
            // Navigation will happen automatically via AuthContext
        } catch (error: any) {
            Alert.alert(
                'Error de inicio de sesión',
                error.message || 'Credenciales inválidas. Por favor, intenta nuevamente.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
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
                        <Text style={styles.title}>Bienvenido</Text>
                        <Text style={styles.subtitle}>
                            Inicia sesión para descubrir eventos increíbles
                        </Text>
                    </View>

                    <View style={styles.form}>
                        <Input
                            label="Email"
                            placeholder="tu@email.com"
                            value={email}
                            onChangeText={(text) => {
                                setEmail(text);
                                setErrors({ ...errors, email: undefined });
                            }}
                            error={errors.email}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />

                        <Input
                            label="Contraseña"
                            placeholder="••••••••"
                            value={password}
                            onChangeText={(text) => {
                                setPassword(text);
                                setErrors({ ...errors, password: undefined });
                            }}
                            error={errors.password}
                            secureTextEntry
                            autoCapitalize="none"
                        />

                        <Button
                            title="Iniciar Sesión"
                            onPress={handleLogin}
                            loading={loading}
                            fullWidth
                        />

                        <TouchableOpacity style={styles.forgotPassword}>
                            <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>¿No tienes cuenta? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                            <Text style={styles.registerLink}>Regístrate</Text>
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
        marginBottom: spacing.lg,
    },
    logoText: {
        fontSize: 32,
        fontWeight: '700',
        color: colors.primary,
    },
    title: {
        fontSize: typography.h2.fontSize,
        fontWeight: typography.h2.fontWeight,
        color: colors.text.primary,
    },
    subtitle: {
        fontSize: typography.body.fontSize,
        color: colors.text.secondary,
        textAlign: 'center',
    },
    form: {
        gap: spacing.md,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginTop: -spacing.xs,
    },
    forgotPasswordText: {
        fontSize: typography.bodySmall.fontSize,
        color: colors.primary,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: spacing.xs,
    },
    footerText: {
        fontSize: typography.body.fontSize,
        color: colors.text.secondary,
    },
    registerLink: {
        fontSize: typography.body.fontSize,
        fontWeight: '600',
        color: colors.primary,
    },
});
