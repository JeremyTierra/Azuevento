import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import QRCode from 'react-native-qrcode-svg';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';
import { participantService } from '../services/participantService';

type RouteParams = {
    MyTicket: {
        eventId: number;
        eventTitle: string;
    };
};

interface TicketData {
    eventId: number;
    eventTitle: string;
    eventLocation: string;
    eventStartDate: string;
    userId: number;
    userName: string;
    checkinToken: string;
    attendanceStatus: string;
    registrationDate: string;
    checkedInAt: string | null;
}

export const MyTicketScreen = () => {
    const navigation = useNavigation();
    const route = useRoute<RouteProp<RouteParams, 'MyTicket'>>();
    const { eventId, eventTitle } = route.params;

    const [loading, setLoading] = useState(true);
    const [ticket, setTicket] = useState<TicketData | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadTicket();
    }, [eventId]);

    const loadTicket = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await participantService.getMyTicket(eventId);
            setTicket(data);
        } catch (err: any) {
            console.error('Error loading ticket:', err);
            setError(err.response?.data?.message || 'Error al cargar tu entrada');
            Alert.alert('Error', 'No se pudo cargar tu entrada');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-EC', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusInfo = () => {
        if (ticket?.checkedInAt) {
            return {
                icon: 'checkmark-circle' as const,
                color: colors.success,
                text: 'Ya ingresaste',
                subtext: `Check-in: ${formatDate(ticket.checkedInAt)}`,
            };
        }
        return {
            icon: 'ticket' as const,
            color: colors.primary,
            text: 'Entrada válida',
            subtext: 'Muestra este QR al organizador',
        };
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Cargando tu entrada...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error || !ticket) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Mi Entrada</Text>
                    <View style={styles.placeholder} />
                </View>
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={64} color={colors.error} />
                    <Text style={styles.errorText}>{error || 'No se encontró la entrada'}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={loadTicket}>
                        <Text style={styles.retryButtonText}>Reintentar</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const statusInfo = getStatusInfo();

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mi Entrada</Text>
                <View style={styles.placeholder} />
            </View>

            {/* Ticket Card */}
            <View style={styles.ticketCard}>
                {/* Status Badge */}
                <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '15' }]}>
                    <Ionicons name={statusInfo.icon} size={20} color={statusInfo.color} />
                    <Text style={[styles.statusText, { color: statusInfo.color }]}>
                        {statusInfo.text}
                    </Text>
                </View>

                {/* Event Info */}
                <Text style={styles.eventTitle}>{ticket.eventTitle}</Text>

                <View style={styles.infoRow}>
                    <Ionicons name="location" size={16} color={colors.text.secondary} />
                    <Text style={styles.infoText}>{ticket.eventLocation}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Ionicons name="calendar" size={16} color={colors.text.secondary} />
                    <Text style={styles.infoText}>{formatDate(ticket.eventStartDate)}</Text>
                </View>

                {/* Divider */}
                <View style={styles.divider}>
                    <View style={styles.dividerCircleLeft} />
                    <View style={styles.dividerLine} />
                    <View style={styles.dividerCircleRight} />
                </View>

                {/* QR Code */}
                <View style={styles.qrContainer}>
                    <QRCode
                        value={ticket.checkinToken}
                        size={200}
                        color={colors.text.primary}
                        backgroundColor={colors.surface}
                    />
                </View>

                {/* User Info */}
                <View style={styles.userInfo}>
                    <Ionicons name="person-circle" size={24} color={colors.primary} />
                    <Text style={styles.userName}>{ticket.userName}</Text>
                </View>

                <Text style={styles.instructionText}>{statusInfo.subtext}</Text>
            </View>

            {/* Bottom Info */}
            <View style={styles.bottomInfo}>
                <Ionicons name="information-circle-outline" size={20} color={colors.text.secondary} />
                <Text style={styles.bottomInfoText}>
                    El organizador escaneará este código para confirmar tu asistencia
                </Text>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: spacing.md,
        ...typography.body,
        color: colors.text.secondary,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: borderRadius.full,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        ...typography.h4,
        color: colors.text.primary,
    },
    placeholder: {
        width: 40,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    errorText: {
        ...typography.body,
        color: colors.text.secondary,
        textAlign: 'center',
        marginTop: spacing.md,
    },
    retryButton: {
        marginTop: spacing.lg,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        backgroundColor: colors.primary,
        borderRadius: borderRadius.lg,
    },
    retryButtonText: {
        ...typography.button,
        color: colors.text.inverse,
    },
    ticketCard: {
        margin: spacing.lg,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        alignItems: 'center',
        ...shadows.lg,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        marginBottom: spacing.md,
    },
    statusText: {
        ...typography.bodySmall,
        fontWeight: '600',
        marginLeft: spacing.xs,
    },
    eventTitle: {
        ...typography.h4,
        color: colors.text.primary,
        textAlign: 'center',
        marginBottom: spacing.md,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    infoText: {
        ...typography.bodySmall,
        color: colors.text.secondary,
        marginLeft: spacing.xs,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginVertical: spacing.lg,
    },
    dividerCircleLeft: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: colors.background,
        marginLeft: -spacing.lg - 10,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: colors.border,
        borderStyle: 'dashed',
    },
    dividerCircleRight: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: colors.background,
        marginRight: -spacing.lg - 10,
    },
    qrContainer: {
        padding: spacing.md,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        borderWidth: 2,
        borderColor: colors.border,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.lg,
    },
    userName: {
        ...typography.h5,
        color: colors.text.primary,
        marginLeft: spacing.sm,
    },
    instructionText: {
        ...typography.caption,
        color: colors.text.secondary,
        marginTop: spacing.sm,
    },
    bottomInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
    },
    bottomInfoText: {
        ...typography.caption,
        color: colors.text.secondary,
        marginLeft: spacing.sm,
        flex: 1,
    },
});
