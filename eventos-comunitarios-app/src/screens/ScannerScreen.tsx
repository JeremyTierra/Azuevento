import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Vibration,
    Modal,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';
import { participantService } from '../services/participantService';

type RouteParams = {
    Scanner: {
        eventId: number;
        eventTitle: string;
    };
};

interface CheckinResult {
    success: boolean;
    message: string;
    userName?: string;
    userEmail?: string;
    checkedInAt?: string;
    firstTime?: boolean;
}

interface AttendanceItem {
    participantId: number;
    userId: number;
    userName: string;
    userEmail: string;
    attendanceStatus: string;
    checkedInAt: string | null;
    hasCheckedIn: boolean;
}

// Dark theme colors for scanner
const scannerColors = {
    background: '#0F172A',
    surface: '#1E293B',
    surfaceLight: '#334155',
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    primary: colors.primary,
    success: '#22C55E',
    error: '#EF4444',
};

export const ScannerScreen = () => {
    const navigation = useNavigation();
    const route = useRoute<RouteProp<RouteParams, 'Scanner'>>();
    const { eventId, eventTitle } = route.params;

    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [result, setResult] = useState<CheckinResult | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [showAttendanceList, setShowAttendanceList] = useState(false);
    const [attendanceList, setAttendanceList] = useState<AttendanceItem[]>([]);
    const [stats, setStats] = useState({ total: 0, checkedIn: 0 });
    const [flashOn, setFlashOn] = useState(false);

    const scanLineAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        startScanAnimation();
        startPulseAnimation();
        loadAttendanceList();
    }, []);

    const startScanAnimation = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(scanLineAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(scanLineAnim, {
                    toValue: 0,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    };

    const startPulseAnimation = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.05,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    };

    const loadAttendanceList = async () => {
        try {
            const list = await participantService.getAttendanceList(eventId);
            setAttendanceList(list);
            const checkedIn = list.filter((item: AttendanceItem) => item.hasCheckedIn).length;
            setStats({ total: list.length, checkedIn });
        } catch (err) {
            console.error('Error loading attendance list:', err);
        }
    };

    const handleBarCodeScanned = async ({ data }: { data: string }) => {
        if (scanned || processing) return;

        setScanned(true);
        setProcessing(true);
        Vibration.vibrate(100);

        try {
            const response = await participantService.checkinParticipant(eventId, data);
            setResult({
                success: true,
                message: 'Check-in exitoso',
                userName: response.userName,
                userEmail: response.userEmail,
                checkedInAt: response.checkedInAt,
                firstTime: true,
            });
            loadAttendanceList();
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Error al procesar el código';
            setResult({
                success: false,
                message: errorMessage,
            });
        } finally {
            setProcessing(false);
            setShowResult(true);
        }
    };

    const handleContinueScanning = () => {
        setShowResult(false);
        setResult(null);
        setScanned(false);
    };

    const getProgressPercentage = () => {
        if (stats.total === 0) return 0;
        return (stats.checkedIn / stats.total) * 100;
    };

    if (!permission) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.centeredContent}>
                    <Text style={styles.messageText}>Cargando permisos de cámara...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!permission.granted) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color={scannerColors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Escáner de Entradas</Text>
                    <View style={styles.placeholder} />
                </View>
                <View style={styles.centeredContent}>
                    <View style={styles.permissionIconContainer}>
                        <Ionicons name="camera-outline" size={48} color={scannerColors.primary} />
                    </View>
                    <Text style={styles.permissionTitle}>Acceso a Cámara</Text>
                    <Text style={styles.messageText}>
                        Necesitamos acceso a la cámara para escanear los códigos QR de los asistentes
                    </Text>
                    <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                        <Ionicons name="camera" size={20} color="#FFFFFF" />
                        <Text style={styles.permissionButtonText}>Permitir acceso</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const scanLineTranslate = scanLineAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 220],
    });

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color={scannerColors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Escáner de Entradas</Text>
                <TouchableOpacity
                    style={styles.listButton}
                    onPress={() => setShowAttendanceList(true)}
                >
                    <Ionicons name="people" size={22} color={scannerColors.primary} />
                </TouchableOpacity>
            </View>

            {/* Stats Bar with Progress */}
            <View style={styles.statsBar}>
                <View style={styles.statsHeader}>
                    <View style={styles.statsIconContainer}>
                        <Ionicons name="people" size={18} color={scannerColors.primary} />
                    </View>
                    <Text style={styles.statsTitle}>Asistentes</Text>
                    <Text style={styles.statsCount}>
                        {stats.checkedIn} / {stats.total}
                    </Text>
                </View>
                <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                        <Animated.View
                            style={[
                                styles.progressFill,
                                { width: `${getProgressPercentage()}%` },
                            ]}
                        />
                    </View>
                    <Text style={styles.progressText}>
                        {Math.round(getProgressPercentage())}% completado
                    </Text>
                </View>
                <Text style={styles.eventName} numberOfLines={1}>{eventTitle}</Text>
            </View>

            {/* Camera */}
            <View style={styles.cameraContainer}>
                <CameraView
                    style={styles.camera}
                    facing="back"
                    enableTorch={flashOn}
                    barcodeScannerSettings={{
                        barcodeTypes: ['qr'],
                    }}
                    onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                >
                    {/* Overlay */}
                    <View style={styles.overlay}>
                        <View style={styles.overlayTop} />
                        <View style={styles.overlayCenterRow}>
                            <View style={styles.overlaySide} />
                            <Animated.View
                                style={[
                                    styles.scanArea,
                                    { transform: [{ scale: pulseAnim }] },
                                ]}
                            >
                                {/* Corner brackets */}
                                <View style={[styles.corner, styles.cornerTopLeft]} />
                                <View style={[styles.corner, styles.cornerTopRight]} />
                                <View style={[styles.corner, styles.cornerBottomLeft]} />
                                <View style={[styles.corner, styles.cornerBottomRight]} />
                                {/* Scan line */}
                                <Animated.View
                                    style={[
                                        styles.scanLine,
                                        { transform: [{ translateY: scanLineTranslate }] },
                                    ]}
                                />
                            </Animated.View>
                            <View style={styles.overlaySide} />
                        </View>
                        <View style={styles.overlayBottom}>
                            {/* Flash toggle */}
                            <TouchableOpacity
                                style={[styles.flashButton, flashOn && styles.flashButtonActive]}
                                onPress={() => setFlashOn(!flashOn)}
                            >
                                <Ionicons
                                    name={flashOn ? 'flash' : 'flash-outline'}
                                    size={24}
                                    color={flashOn ? scannerColors.background : scannerColors.text}
                                />
                            </TouchableOpacity>
                            <Text style={styles.scanInstructions}>
                                Apunta al código QR de la entrada
                            </Text>
                        </View>
                    </View>
                </CameraView>
            </View>

            {/* Result Modal */}
            <Modal
                visible={showResult}
                transparent
                animationType="fade"
                onRequestClose={handleContinueScanning}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.resultCard}>
                        {result?.success ? (
                            <>
                                <View style={styles.successIconContainer}>
                                    <Ionicons name="checkmark" size={40} color="#FFFFFF" />
                                </View>
                                <Text style={styles.resultTitle}>Check-in exitoso</Text>
                                <Text style={styles.resultSubtitle}>Entrada validada correctamente</Text>

                                <View style={styles.userCard}>
                                    <View style={styles.userAvatar}>
                                        <Ionicons name="person" size={24} color={scannerColors.primary} />
                                    </View>
                                    <View style={styles.userInfo}>
                                        <Text style={styles.userName}>{result.userName}</Text>
                                        {result.firstTime && (
                                            <View style={styles.firstTimeBadge}>
                                                <Text style={styles.firstTimeBadgeText}>PRIMERA VEZ</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </>
                        ) : (
                            <>
                                <View style={styles.errorIconContainer}>
                                    <Ionicons name="close" size={40} color="#FFFFFF" />
                                </View>
                                <Text style={styles.resultTitle}>Error</Text>
                                <Text style={styles.errorMessage}>{result?.message}</Text>
                            </>
                        )}
                        <TouchableOpacity
                            style={styles.continueButton}
                            onPress={handleContinueScanning}
                        >
                            <Ionicons name="scan" size={20} color="#FFFFFF" />
                            <Text style={styles.continueButtonText}>Siguiente escaneo</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Attendance List Modal */}
            <Modal
                visible={showAttendanceList}
                transparent
                animationType="slide"
                onRequestClose={() => setShowAttendanceList(false)}
            >
                <View style={styles.listModalOverlay}>
                    <View style={styles.listModalContent}>
                        <View style={styles.listModalHandle} />
                        <View style={styles.listModalHeader}>
                            <View>
                                <Text style={styles.listModalTitle}>Lista de Asistencia</Text>
                                <Text style={styles.listModalSubtitle}>
                                    {stats.checkedIn} de {stats.total} asistentes
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setShowAttendanceList(false)}
                            >
                                <Ionicons name="close" size={24} color={colors.text.primary} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
                            {attendanceList.map((item) => (
                                <View key={item.participantId} style={styles.attendeeItem}>
                                    <View style={[
                                        styles.attendeeAvatar,
                                        item.hasCheckedIn && styles.attendeeAvatarCheckedIn
                                    ]}>
                                        <Text style={styles.attendeeInitial}>
                                            {item.userName.charAt(0).toUpperCase()}
                                        </Text>
                                    </View>
                                    <View style={styles.attendeeInfo}>
                                        <Text style={styles.attendeeName}>{item.userName}</Text>
                                        <Text style={styles.attendeeEmail}>{item.userEmail}</Text>
                                    </View>
                                    {item.hasCheckedIn ? (
                                        <View style={styles.checkedInBadge}>
                                            <Ionicons name="checkmark-circle" size={24} color={scannerColors.success} />
                                        </View>
                                    ) : (
                                        <View style={styles.pendingBadge}>
                                            <Ionicons name="time-outline" size={24} color={colors.text.disabled} />
                                        </View>
                                    )}
                                </View>
                            ))}
                            {attendanceList.length === 0 && (
                                <View style={styles.emptyState}>
                                    <Ionicons name="people-outline" size={48} color={colors.text.disabled} />
                                    <Text style={styles.emptyStateText}>
                                        No hay asistentes registrados
                                    </Text>
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: scannerColors.background,
    },
    centeredContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    permissionIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: scannerColors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.lg,
    },
    permissionTitle: {
        ...typography.h4,
        color: scannerColors.text,
        marginBottom: spacing.sm,
    },
    messageText: {
        ...typography.body,
        color: scannerColors.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    permissionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        backgroundColor: scannerColors.primary,
        borderRadius: borderRadius.lg,
        gap: spacing.sm,
    },
    permissionButtonText: {
        ...typography.button,
        color: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        backgroundColor: scannerColors.surface,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: borderRadius.full,
        backgroundColor: scannerColors.surfaceLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        ...typography.h5,
        color: scannerColors.text,
    },
    listButton: {
        width: 40,
        height: 40,
        borderRadius: borderRadius.full,
        backgroundColor: scannerColors.primary + '20',
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholder: {
        width: 40,
    },
    statsBar: {
        backgroundColor: scannerColors.surface,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: scannerColors.surfaceLight,
    },
    statsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    statsIconContainer: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: scannerColors.primary + '20',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
    },
    statsTitle: {
        ...typography.bodySmall,
        color: scannerColors.textSecondary,
        flex: 1,
    },
    statsCount: {
        ...typography.h5,
        color: scannerColors.text,
    },
    progressContainer: {
        marginBottom: spacing.sm,
    },
    progressBar: {
        height: 6,
        backgroundColor: scannerColors.surfaceLight,
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: spacing.xs,
    },
    progressFill: {
        height: '100%',
        backgroundColor: scannerColors.primary,
        borderRadius: 3,
    },
    progressText: {
        ...typography.caption,
        color: scannerColors.textSecondary,
    },
    eventName: {
        ...typography.caption,
        color: scannerColors.primary,
        fontWeight: '500',
    },
    cameraContainer: {
        flex: 1,
    },
    camera: {
        flex: 1,
    },
    overlay: {
        flex: 1,
    },
    overlayTop: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
    },
    overlayCenterRow: {
        flexDirection: 'row',
    },
    overlaySide: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
    },
    overlayBottom: {
        flex: 1.2,
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        alignItems: 'center',
        paddingTop: spacing.xl,
    },
    scanArea: {
        width: 250,
        height: 250,
        borderRadius: borderRadius.xl,
    },
    corner: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderColor: scannerColors.primary,
    },
    cornerTopLeft: {
        top: 0,
        left: 0,
        borderTopWidth: 4,
        borderLeftWidth: 4,
        borderTopLeftRadius: borderRadius.xl,
    },
    cornerTopRight: {
        top: 0,
        right: 0,
        borderTopWidth: 4,
        borderRightWidth: 4,
        borderTopRightRadius: borderRadius.xl,
    },
    cornerBottomLeft: {
        bottom: 0,
        left: 0,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
        borderBottomLeftRadius: borderRadius.xl,
    },
    cornerBottomRight: {
        bottom: 0,
        right: 0,
        borderBottomWidth: 4,
        borderRightWidth: 4,
        borderBottomRightRadius: borderRadius.xl,
    },
    scanLine: {
        position: 'absolute',
        left: 20,
        right: 20,
        height: 3,
        backgroundColor: scannerColors.primary,
        borderRadius: 2,
        ...shadows.sm,
    },
    flashButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: scannerColors.surfaceLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
    },
    flashButtonActive: {
        backgroundColor: '#FFFFFF',
    },
    scanInstructions: {
        ...typography.body,
        color: scannerColors.text,
        textAlign: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    resultCard: {
        backgroundColor: scannerColors.surface,
        borderRadius: borderRadius.xxl,
        padding: spacing.xl,
        alignItems: 'center',
        width: '100%',
        maxWidth: 340,
    },
    successIconContainer: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: scannerColors.success,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.lg,
    },
    errorIconContainer: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: scannerColors.error,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.lg,
    },
    resultTitle: {
        ...typography.h4,
        color: scannerColors.text,
        marginBottom: spacing.xs,
    },
    resultSubtitle: {
        ...typography.bodySmall,
        color: scannerColors.textSecondary,
        marginBottom: spacing.lg,
    },
    errorMessage: {
        ...typography.body,
        color: scannerColors.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: scannerColors.surfaceLight,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        width: '100%',
        marginBottom: spacing.lg,
    },
    userAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: scannerColors.primary + '20',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        ...typography.h5,
        color: scannerColors.text,
    },
    firstTimeBadge: {
        backgroundColor: scannerColors.success + '20',
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.sm,
        alignSelf: 'flex-start',
        marginTop: spacing.xs,
    },
    firstTimeBadgeText: {
        ...typography.caption,
        color: scannerColors.success,
        fontWeight: '700',
        fontSize: 10,
    },
    continueButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        backgroundColor: scannerColors.primary,
        borderRadius: borderRadius.lg,
        width: '100%',
        gap: spacing.sm,
    },
    continueButtonText: {
        ...typography.button,
        color: '#FFFFFF',
    },
    listModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    listModalContent: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: borderRadius.xxl,
        borderTopRightRadius: borderRadius.xxl,
        maxHeight: '85%',
    },
    listModalHandle: {
        width: 40,
        height: 4,
        backgroundColor: colors.border,
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: spacing.sm,
    },
    listModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    listModalTitle: {
        ...typography.h5,
        color: colors.text.primary,
    },
    listModalSubtitle: {
        ...typography.caption,
        color: colors.text.secondary,
        marginTop: 2,
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    listContainer: {
        padding: spacing.md,
    },
    attendeeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
    },
    attendeeAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    attendeeAvatarCheckedIn: {
        backgroundColor: colors.successLight,
    },
    attendeeInitial: {
        ...typography.h5,
        color: colors.text.secondary,
    },
    attendeeInfo: {
        flex: 1,
    },
    attendeeName: {
        ...typography.body,
        color: colors.text.primary,
        fontWeight: '600',
    },
    attendeeEmail: {
        ...typography.caption,
        color: colors.text.secondary,
    },
    checkedInBadge: {
        marginLeft: spacing.sm,
    },
    pendingBadge: {
        marginLeft: spacing.sm,
    },
    emptyState: {
        alignItems: 'center',
        padding: spacing.xxl,
    },
    emptyStateText: {
        ...typography.body,
        color: colors.text.secondary,
        textAlign: 'center',
        marginTop: spacing.md,
    },
});
