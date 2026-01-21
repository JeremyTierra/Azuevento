import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
    ScrollView,
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

    const formatShortDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-EC', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
        });
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('es-EC', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusInfo = () => {
        if (ticket?.checkedInAt) {
            return {
                icon: 'checkmark-circle' as const,
                color: colors.success,
                bgColor: colors.successLight,
                text: 'YA INGRESASTE',
                subtext: `Check-in: ${formatDate(ticket.checkedInAt)}`,
            };
        }
        return {
            icon: 'ticket' as const,
            color: colors.primary,
            bgColor: colors.primaryLight + '30',
            text: 'ENTRADA VÁLIDA',
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

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Ticket Card */}
                <View style={styles.ticketCard}>
                    {/* Status Badge */}
                    <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
                        <Ionicons name={statusInfo.icon} size={18} color={statusInfo.color} />
                        <Text style={[styles.statusText, { color: statusInfo.color }]}>
                            {statusInfo.text}
                        </Text>
                    </View>

                    {/* Event Title */}
                    <Text style={styles.eventTitle}>{ticket.eventTitle}</Text>

                    {/* Event Info Cards */}
                    <View style={styles.infoCardsContainer}>
                        <View style={styles.infoCard}>
                            <View style={[styles.infoCardIcon, { backgroundColor: colors.primary + '15' }]}>
                                <Ionicons name="location" size={18} color={colors.primary} />
                            </View>
                            <View style={styles.infoCardContent}>
                                <Text style={styles.infoCardLabel}>Ubicación</Text>
                                <Text style={styles.infoCardValue} numberOfLines={2}>
                                    {ticket.eventLocation}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.infoCard}>
                            <View style={[styles.infoCardIcon, { backgroundColor: colors.secondary + '15' }]}>
                                <Ionicons name="calendar" size={18} color={colors.secondary} />
                            </View>
                            <View style={styles.infoCardContent}>
                                <Text style={styles.infoCardLabel}>Fecha y hora</Text>
                                <Text style={styles.infoCardValue}>
                                    {formatShortDate(ticket.eventStartDate)}, {formatTime(ticket.eventStartDate)}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Divider with ticket perforation effect */}
                    <View style={styles.dividerContainer}>
                        <View style={styles.dividerCircleLeft} />
                        <View style={styles.dividerDashed} />
                        <View style={styles.dividerCircleRight} />
                    </View>

                    {/* QR Code Section */}
                    <View style={styles.qrSection}>
                        <View style={styles.qrContainer}>
                            <QRCode
                                value={ticket.checkinToken}
                                size={180}
                                color="#FFFFFF"
                                backgroundColor={colors.primary}
                            />
                        </View>
                    </View>

                    {/* User Info */}
                    <View style={styles.userSection}>
                        <View style={styles.userAvatar}>
                            <Ionicons name="person" size={20} color={colors.primary} />
                        </View>
                        <Text style={styles.userName}>{ticket.userName}</Text>
                    </View>

                    {/* Instruction */}
                    <Text style={styles.instructionText}>{statusInfo.subtext}</Text>
                </View>

                {/* Additional Info Section */}
                <View style={styles.additionalInfo}>
                    <Text style={styles.additionalInfoTitle}>Detalles de la entrada</Text>

                    <View style={styles.detailRow}>
                        <View style={styles.detailIcon}>
                            <Ionicons name="ticket-outline" size={16} color={colors.text.secondary} />
                        </View>
                        <Text style={styles.detailLabel}>Tipo de entrada</Text>
                        <Text style={styles.detailValue}>General</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <View style={styles.detailIcon}>
                            <Ionicons name="time-outline" size={16} color={colors.text.secondary} />
                        </View>
                        <Text style={styles.detailLabel}>Registrado</Text>
                        <Text style={styles.detailValue}>{formatShortDate(ticket.registrationDate)}</Text>
                    </View>
                </View>

                {/* Bottom Info */}
                <View style={styles.bottomInfo}>
                    <Ionicons name="information-circle-outline" size={20} color={colors.text.secondary} />
                    <Text style={styles.bottomInfoText}>
                        El organizador escaneará este código para confirmar tu asistencia al evento
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: spacing.xl,
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
        margin: spacing.md,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xxl,
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
        fontSize: 12,
        fontWeight: '700',
        marginLeft: spacing.xs,
        letterSpacing: 0.5,
    },
    eventTitle: {
        ...typography.h4,
        color: colors.text.primary,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    infoCardsContainer: {
        width: '100%',
        gap: spacing.sm,
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
    },
    infoCardIcon: {
        width: 36,
        height: 36,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoCardContent: {
        marginLeft: spacing.md,
        flex: 1,
    },
    infoCardLabel: {
        ...typography.caption,
        color: colors.text.secondary,
        marginBottom: 2,
    },
    infoCardValue: {
        ...typography.bodySmall,
        color: colors.text.primary,
        fontWeight: '500',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginVertical: spacing.lg,
        overflow: 'visible',
    },
    dividerCircleLeft: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.background,
        marginLeft: -spacing.lg - 12,
    },
    dividerDashed: {
        flex: 1,
        height: 2,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 1,
    },
    dividerCircleRight: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.background,
        marginRight: -spacing.lg - 12,
    },
    qrSection: {
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    qrContainer: {
        padding: spacing.md,
        backgroundColor: colors.primary,
        borderRadius: borderRadius.xl,
        ...shadows.md,
    },
    userSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    userAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.primary + '15',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
    },
    userName: {
        ...typography.h5,
        color: colors.text.primary,
    },
    instructionText: {
        ...typography.bodySmall,
        color: colors.primary,
        fontWeight: '500',
    },
    additionalInfo: {
        marginHorizontal: spacing.md,
        marginTop: spacing.sm,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        ...shadows.sm,
    },
    additionalInfoTitle: {
        ...typography.bodySmall,
        color: colors.text.secondary,
        fontWeight: '600',
        marginBottom: spacing.md,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
    },
    detailIcon: {
        width: 24,
        marginRight: spacing.sm,
    },
    detailLabel: {
        ...typography.bodySmall,
        color: colors.text.secondary,
        flex: 1,
    },
    detailValue: {
        ...typography.bodySmall,
        color: colors.text.primary,
        fontWeight: '500',
    },
    bottomInfo: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginHorizontal: spacing.md,
        marginTop: spacing.lg,
        padding: spacing.md,
        backgroundColor: colors.infoLight,
        borderRadius: borderRadius.lg,
    },
    bottomInfoText: {
        ...typography.caption,
        color: colors.info,
        marginLeft: spacing.sm,
        flex: 1,
        lineHeight: 18,
    },
});
