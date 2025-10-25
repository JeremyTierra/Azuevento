import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../theme';

interface RatingStarsProps {
    value: number; // 0-5
    size?: number;
    editable?: boolean;
    onChange?: (value: number) => void;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
    value,
    size = 24,
    editable = false,
    onChange,
}) => {
    const handlePress = (rating: number) => {
        if (editable && onChange) {
            onChange(rating);
        }
    };

    const renderStar = (position: number) => {
        const filled = position <= value;
        const StarComponent = editable ? TouchableOpacity : View;

        return (
            <StarComponent
                key={position}
                onPress={() => handlePress(position)}
                disabled={!editable}
                activeOpacity={0.7}
            >
                <Ionicons
                    name={filled ? 'star' : 'star-outline'}
                    size={size}
                    color={filled ? colors.warning : colors.text.disabled}
                />
            </StarComponent>
        );
    };

    return (
        <View style={styles.container}>
            {[1, 2, 3, 4, 5].map(renderStar)}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        gap: spacing.xs,
        alignItems: 'center',
    },
});
