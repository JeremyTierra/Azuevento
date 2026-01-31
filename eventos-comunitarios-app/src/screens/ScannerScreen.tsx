import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    Animated,
    Vibration,
    Modal,
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

    const scanLineAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        startScanAnimation();
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
            });
            loadAttendanceList(); // Refresh stats
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
                        <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Escáner QR</Text>
                    <View style={styles.placeholder} />
                </View>
                <View style={styles.centeredContent}>
                    <Ionicons name="camera-outline" size={64} color={colors.text.secondary} />
                    <Text style={styles.messageText}>
                        Necesitamos acceso a la cámara para escanear códigos QR
                    </Text>
                    <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                        <Text style={styles.permissionButtonText}>Permitir acceso a cámara</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const scanLineTranslate = scanLineAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 250],
    });

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>
                    {eventTitle}
                </Text>
                <TouchableOpacity
                    style={styles.listButton}
                    onPress={() => setShowAttendanceList(true)}
                >
                    <Ionicons name="list" size={24} color={colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Stats Bar */}
            <View style={styles.statsBar}>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{stats.checkedIn}</Text>
                    <Text style={styles.statLabel}>Ingresados</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{stats.total}</Text>
                    <Text style={styles.statLabel}>Registrados</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={[styles.statNumber, { color: colors.success }]}>
                        {stats.total > 0 ? Math.round((stats.checkedIn / stats.total) * 100) : 0}%
                    </Text>
                    <Text style={styles.statLabel}>Asistencia</Text>
                </View>
            </View>

            {/* Camera */}
            <View style={styles.cameraContainer}>
                <CameraView
                    style={styles.camera}
                    facing="back"
                    barcodeScannerSettings={{
                        barcodeTypes: ['qr'],
                    }}
                    onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                >
                    {/* Overlay */}
                    <View style={styles.overlay}>
                        <View style={styles.overlayRow}>
                            <View style={styles.overlaySection} />
                        </View>
                        <View style={styles.overlayCenterRow}>
                            <View style={styles.overlaySection} />
                            <View style={styles.scanArea}>
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
                            </View>
                            <View style={styles.overlaySection} />
                        </View>
                        <View style={styles.overlayRow}>
                            <View style={styles.overlaySection} />
                        </View>
                    </View>
                </CameraView>
            </View>

            {/* Instructions */}
            <View style={styles.instructions}>
                <Ionicons name="qr-code-outline" size={24} color={colors.primary} />
                <Text style={styles.instructionText}>
                    Escanea el código QR del asistente
                </Text>
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
                                <View style={styles.successIcon}>
                                    <Ionicons name="checkmark-circle" size={64} color={colors.success} />
                                </View>
                                <Text style={styles.resultTitle}>Check-in Exitoso</Text>
                                <Text style={styles.resultName}>{result.userName}</Text>
                                <Text style={styles.resultEmail}>{result.userEmail}</Text>
                            </>
                        ) : (
                            <>
                                <View style={styles.errorIcon}>
                                    <Ionicons name="close-circle" size={64} color={colors.error} />
                                </View>
                                <Text style={styles.resultTitle}>Error</Text>
                                <Text style={styles.resultMessage}>{result?.message}</Text>
                            </>
                        )}
                        <TouchableOpacity
                            style={styles.continueButton}
                            onPress={handleContinueScanning}
                        >
                            <Text style={styles.continueButtonText}>Continuar escaneando</Text>
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
                        <View style={styles.listModalHeader}>
                            <Text style={styles.listModalTitle}>Lista de Asistencia</Text>
                            <TouchableOpacity onPress={() => setShowAttendanceList(false)}>
                                <Ionicons name="close" size={24} color={colors.text.primary} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.listContainer}>
                            {attendanceList.map((item) => (
                                <View key={item.participantId} style={styles.attendeeItem}>
                                    <View style={styles.attendeeInfo}>
                                        <Text style={styles.attendeeName}>{item.userName}</Text>
                                        <Text style={styles.attendeeEmail}>{item.userEmail}</Text>
                                    </View>
                                    {item.hasCheckedIn ? (
                                        <View style={styles.checkedInBadge}>
                                            <Ionicons name="checkmark" size={16} color={colors.success} />
                                        </View>
                                    ) : (
                                        <View style={styles.pendingBadge}>
                                            <Ionicons name="time-outline" size={16} color={colors.text.secondary} />
                                        </View>
                                    )}
                                </View>
                            ))}
                            {attendanceList.length === 0 && (
                                <Text style={styles.emptyListText}>
                                    No hay asistentes registrados
                                </Text>
                            )}
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.surfaceDark,
    },
    centeredContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    messageText: {
        ...typography.body,
        color: colors.text.secondary,
        textAlign: 'center',
        marginTop: spacing.md,
    },
    permissionButton: {
        marginTop: spacing.lg,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        backgroundColor: colors.primary,
        borderRadius: borderRadius.lg,
    },
    permissionButtonText: {
        ...typography.button,
        color: colors.text.inverse,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        backgroundColor: colors.surface,
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
        ...typography.h5,
        color: colors.text.primary,
        flex: 1,
        textAlign: 'center',
        marginHorizontal: spacing.sm,
    },
    listButton: {
        width: 40,
        height: 40,
        borderRadius: borderRadius.full,
        backgroundColor: colors.primaryLight + '30',
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholder: {
        width: 40,
    },
    statsBar: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statNumber: {
        ...typography.h4,
        color: colors.primary,
    },
    statLabel: {
        ...typography.caption,
        color: colors.text.secondary,
    },
    statDivider: {
        width: 1,
        height: '100%',
        backgroundColor: colors.border,
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
    overlayRow: {
        flex: 1,
    },
    overlayCenterRow: {
        flexDirection: 'row',
    },
    overlaySection: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    scanArea: {
        width: 280,
        height: 280,
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
    },
    corner: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderColor: colors.primary,
    },
    cornerTopLeft: {
        top: 0,
        left: 0,
        borderTopWidth: 4,
        borderLeftWidth: 4,
        borderTopLeftRadius: borderRadius.lg,
    },
    cornerTopRight: {
        top: 0,
        right: 0,
        borderTopWidth: 4,
        borderRightWidth: 4,
        borderTopRightRadius: borderRadius.lg,
    },
    cornerBottomLeft: {
        bottom: 0,
        left: 0,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
        borderBottomLeftRadius: borderRadius.lg,
    },
    cornerBottomRight: {
        bottom: 0,
        right: 0,
        borderBottomWidth: 4,
        borderRightWidth: 4,
        borderBottomRightRadius: borderRadius.lg,
    },
    scanLine: {
        position: 'absolute',
        left: 10,
        right: 10,
        height: 2,
        backgroundColor: colors.primary,
    },
    instructions: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.lg,
        backgroundColor: colors.surface,
    },
    instructionText: {
        ...typography.body,
        color: colors.text.primary,
        marginLeft: spacing.sm,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    resultCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        alignItems: 'center',
        width: '100%',
        maxWidth: 320,
        ...shadows.lg,
    },
    successIcon: {
        marginBottom: spacing.md,
    },
    errorIcon: {
        marginBottom: spacing.md,
    },
    resultTitle: {
        ...typography.h4,
        color: colors.text.primary,
        marginBottom: spacing.sm,
    },
    resultName: {
        ...typography.h5,
        color: colors.text.primary,
    },
    resultEmail: {
        ...typography.bodySmall,
        color: colors.text.secondary,
    },
    resultMessage: {
        ...typography.body,
        color: colors.text.secondary,
        textAlign: 'center',
    },
    continueButton: {
        marginTop: spacing.lg,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        backgroundColor: colors.primary,
        borderRadius: borderRadius.lg,
        width: '100%',
    },
    continueButtonText: {
        ...typography.button,
        color: colors.text.inverse,
        textAlign: 'center',
    },
    listModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    listModalContent: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        maxHeight: '80%',
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
    listContainer: {
        padding: spacing.md,
    },
    attendeeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
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
        width: 32,
        height: 32,
        borderRadius: borderRadius.full,
        backgroundColor: colors.successLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pendingBadge: {
        width: 32,
        height: 32,
        borderRadius: borderRadius.full,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyListText: {
        ...typography.body,
        color: colors.text.secondary,
        textAlign: 'center',
        padding: spacing.xl,
    },
});
