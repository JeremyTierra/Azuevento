import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../theme';

interface LoadingProps {
    message?: string;
}

export const Loading: React.FC<LoadingProps> = ({ message = 'Cargando...' }) => {
    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.message}>{message}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
        padding: spacing.xl,
    },
    message: {
        marginTop: spacing.md,
        fontSize: typography.body.fontSize,
        color: colors.text.secondary,
        textAlign: 'center',
    },
});
