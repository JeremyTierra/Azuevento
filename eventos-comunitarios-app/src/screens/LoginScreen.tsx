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
                        <Text style={styles.title}>Bienvenido de nuevo</Text>
                        <Text style={styles.subtitle}>
                            Ingresa tus credenciales para continuar
                        </Text>

                        <Input
                            label="Correo electrónico"
                            placeholder="ejemplo@correo.com"
                            value={email}
                            onChangeText={(text) => {
                                setEmail(text);
                                setErrors({ ...errors, email: undefined });
                            }}
                            icon="mail-outline"
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
                            icon="lock-closed-outline"
                            error={errors.password}
                            secureTextEntry
                            autoCapitalize="none"
                        />

                        <Button
                            title="Iniciar Sesión"
                            onPress={handleLogin}
                            loading={loading}
                            fullWidth
                            style={styles.primaryButton}
                        />
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
    registerLink: {
        fontSize: typography.body.fontSize,
        fontWeight: '600',
        color: colors.primary,
    },
});
