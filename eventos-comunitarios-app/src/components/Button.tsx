import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacityProps,
    ViewStyle,
    TextStyle,
} from 'react-native';
import { colors, borderRadius, spacing, typography } from '../theme';

interface ButtonProps extends TouchableOpacityProps {
    title: string;
    variant?: 'primary' | 'secondary' | 'outline' | 'danger';
    loading?: boolean;
    fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    variant = 'primary',
    loading = false,
    disabled,
    fullWidth = false,
    style,
    ...props
}) => {
    const getButtonStyle = (): ViewStyle => {
        let style: ViewStyle = { ...styles.button };

        if (fullWidth) {
            style = { ...style, ...styles.fullWidth };
        }

        switch (variant) {
            case 'secondary':
                return { ...style, backgroundColor: colors.secondary };
            case 'outline':
                return {
                    ...style,
                    backgroundColor: 'transparent',
                    borderWidth: 1.5,
                    borderColor: colors.primary,
                };
            case 'danger':
                return { ...style, backgroundColor: colors.error };
            default:
                return style;
        }
    };

    const getTextStyle = (): TextStyle => {
        if (variant === 'outline') {
            return { ...styles.buttonText, color: colors.primary };
        }
        return styles.buttonText;
    };

    return (
        <TouchableOpacity
            style={[getButtonStyle(), (disabled || loading) && styles.disabled, style]}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <ActivityIndicator color={variant === 'outline' ? colors.primary : colors.text.inverse} />
            ) : (
                <Text style={getTextStyle()}>{title}</Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 48,
    },
    buttonText: {
        color: colors.text.inverse,
        fontSize: typography.button.fontSize,
        fontWeight: typography.button.fontWeight,
    },
    disabled: {
        opacity: 0.5,
    },
    fullWidth: {
        width: '100%',
    },
});
