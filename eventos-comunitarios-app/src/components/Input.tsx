import React, { useState } from 'react';
import {
    TextInput,
    View,
    Text,
    StyleSheet,
    TextInputProps,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, spacing, typography } from '../theme';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    icon,
    rightIcon,
    style,
    secureTextEntry,
    ...props
}) => {
    const [isSecure, setIsSecure] = useState(secureTextEntry);

    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}

            <View style={[styles.inputContainer, error && styles.inputError]}>
                {icon && <View style={styles.iconLeft}>{icon}</View>}

                <TextInput
                    style={[styles.input, icon && styles.inputWithIconLeft]}
                    placeholderTextColor={colors.text.disabled}
                    secureTextEntry={isSecure}
                    {...props}
                />

                {secureTextEntry && (
                    <TouchableOpacity
                        style={styles.iconRight}
                        onPress={() => setIsSecure(!isSecure)}
                    >
                        <Ionicons
                            name={isSecure ? 'eye-off-outline' : 'eye-outline'}
                            size={20}
                            color={colors.text.secondary}
                        />
                    </TouchableOpacity>
                )}

                {rightIcon && !secureTextEntry && (
                    <View style={styles.iconRight}>{rightIcon}</View>
                )}
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.md,
    },
    label: {
        fontSize: typography.bodySmall.fontSize,
        fontWeight: '600',
        color: colors.text.primary,
        marginBottom: spacing.xs,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
    },
    inputError: {
        borderColor: colors.error,
    },
    input: {
        flex: 1,
        height: 48,
        fontSize: typography.body.fontSize,
        color: colors.text.primary,
    },
    inputWithIconLeft: {
        marginLeft: spacing.sm,
    },
    iconLeft: {
        marginRight: spacing.xs,
    },
    iconRight: {
        marginLeft: spacing.xs,
    },
    eyeIcon: {
        fontSize: 20,
    },
    errorText: {
        fontSize: typography.caption.fontSize,
        color: colors.error,
        marginTop: spacing.xs,
    },
});
