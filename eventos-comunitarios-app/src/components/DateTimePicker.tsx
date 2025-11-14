import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type DateTimePickerProps = {
    visible: boolean;
    mode: 'date' | 'time' | 'datetime';
    value: Date;
    minimumDate?: Date;
    onConfirm: (date: Date) => void;
    onCancel: () => void;
    title?: string;
};

const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DAYS_OF_WEEK = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// Generate array of numbers
const generateNumbers = (start: number, end: number): number[] => {
    const numbers: number[] = [];
    for (let i = start; i <= end; i++) {
        numbers.push(i);
    }
    return numbers;
};

// Get days in month
const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month + 1, 0).getDate();
};

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
    visible,
    mode,
    value,
    minimumDate,
    onConfirm,
    onCancel,
    title,
}) => {
    const [selectedDate, setSelectedDate] = useState(value);
    const [viewMode, setViewMode] = useState<'date' | 'time'>(mode === 'time' ? 'time' : 'date');

    // Calendar state
    const [currentMonth, setCurrentMonth] = useState(value.getMonth());
    const [currentYear, setCurrentYear] = useState(value.getFullYear());

    useEffect(() => {
        setSelectedDate(value);
        setCurrentMonth(value.getMonth());
        setCurrentYear(value.getFullYear());
        setViewMode(mode === 'time' ? 'time' : 'date');
    }, [value, visible, mode]);

    const handleDaySelect = (day: number) => {
        const newDate = new Date(selectedDate);
        newDate.setFullYear(currentYear);
        newDate.setMonth(currentMonth);
        newDate.setDate(day);

        // Check minimum date
        if (minimumDate && newDate < minimumDate) {
            return;
        }

        setSelectedDate(newDate);

        if (mode === 'datetime') {
            setViewMode('time');
        } else if (mode === 'date') {
            onConfirm(newDate);
        }
    };

    const handleTimeSelect = (hours: number, minutes: number) => {
        const newDate = new Date(selectedDate);
        newDate.setHours(hours);
        newDate.setMinutes(minutes);
        setSelectedDate(newDate);
    };

    const handleConfirm = () => {
        onConfirm(selectedDate);
    };

    const goToPreviousMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const goToNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    const isDateDisabled = (day: number): boolean => {
        if (!minimumDate) return false;
        const checkDate = new Date(currentYear, currentMonth, day);
        const minDateOnly = new Date(minimumDate.getFullYear(), minimumDate.getMonth(), minimumDate.getDate());
        return checkDate < minDateOnly;
    };

    const isSelectedDay = (day: number): boolean => {
        return (
            selectedDate.getDate() === day &&
            selectedDate.getMonth() === currentMonth &&
            selectedDate.getFullYear() === currentYear
        );
    };

    const isToday = (day: number): boolean => {
        const today = new Date();
        return (
            today.getDate() === day &&
            today.getMonth() === currentMonth &&
            today.getFullYear() === currentYear
        );
    };

    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(currentYear, currentMonth);
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
        const days: (number | null)[] = [];

        // Add empty slots for days before the first day
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(null);
        }

        // Add days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
        }

        // Create rows of 7 days
        const rows: (number | null)[][] = [];
        for (let i = 0; i < days.length; i += 7) {
            rows.push(days.slice(i, i + 7));
        }

        return (
            <View style={styles.calendar}>
                {/* Month/Year Header */}
                <View style={styles.calendarHeader}>
                    <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
                        <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={styles.monthYearText}>
                        {MONTHS[currentMonth]} {currentYear}
                    </Text>
                    <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
                        <Ionicons name="chevron-forward" size={24} color={colors.text.primary} />
                    </TouchableOpacity>
                </View>

                {/* Days of week header */}
                <View style={styles.weekHeader}>
                    {DAYS_OF_WEEK.map((day) => (
                        <View key={day} style={styles.weekDay}>
                            <Text style={styles.weekDayText}>{day}</Text>
                        </View>
                    ))}
                </View>

                {/* Days grid */}
                {rows.map((row, rowIndex) => (
                    <View key={rowIndex} style={styles.weekRow}>
                        {row.map((day, dayIndex) => (
                            <TouchableOpacity
                                key={dayIndex}
                                style={[
                                    styles.dayCell,
                                    day && isSelectedDay(day) && styles.selectedDay,
                                    day && isToday(day) && !isSelectedDay(day) && styles.todayDay,
                                ]}
                                onPress={() => day && !isDateDisabled(day) && handleDaySelect(day)}
                                disabled={!day || isDateDisabled(day)}
                            >
                                {day && (
                                    <Text
                                        style={[
                                            styles.dayText,
                                            isSelectedDay(day) && styles.selectedDayText,
                                            isDateDisabled(day) && styles.disabledDayText,
                                            isToday(day) && !isSelectedDay(day) && styles.todayText,
                                        ]}
                                    >
                                        {day}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        ))}
                        {/* Fill remaining cells if row is incomplete */}
                        {row.length < 7 &&
                            Array(7 - row.length)
                                .fill(null)
                                .map((_, i) => (
                                    <View key={`empty-${i}`} style={styles.dayCell} />
                                ))}
                    </View>
                ))}
            </View>
        );
    };

    const renderTimePicker = () => {
        const hours = generateNumbers(0, 23);
        const minutes = generateNumbers(0, 59);

        return (
            <View style={styles.timePicker}>
                <Text style={styles.timePickerLabel}>Selecciona la hora</Text>
                <View style={styles.timeSelectors}>
                    {/* Hours */}
                    <View style={styles.timeColumn}>
                        <Text style={styles.timeColumnLabel}>Hora</Text>
                        <ScrollView
                            style={styles.timeScroll}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.timeScrollContent}
                        >
                            {hours.map((hour) => (
                                <TouchableOpacity
                                    key={hour}
                                    style={[
                                        styles.timeOption,
                                        selectedDate.getHours() === hour && styles.selectedTimeOption,
                                    ]}
                                    onPress={() => handleTimeSelect(hour, selectedDate.getMinutes())}
                                >
                                    <Text
                                        style={[
                                            styles.timeOptionText,
                                            selectedDate.getHours() === hour && styles.selectedTimeText,
                                        ]}
                                    >
                                        {hour.toString().padStart(2, '0')}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    <Text style={styles.timeSeparator}>:</Text>

                    {/* Minutes */}
                    <View style={styles.timeColumn}>
                        <Text style={styles.timeColumnLabel}>Minuto</Text>
                        <ScrollView
                            style={styles.timeScroll}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.timeScrollContent}
                        >
                            {minutes.filter((m) => m % 5 === 0).map((minute) => (
                                <TouchableOpacity
                                    key={minute}
                                    style={[
                                        styles.timeOption,
                                        selectedDate.getMinutes() === minute && styles.selectedTimeOption,
                                    ]}
                                    onPress={() => handleTimeSelect(selectedDate.getHours(), minute)}
                                >
                                    <Text
                                        style={[
                                            styles.timeOptionText,
                                            selectedDate.getMinutes() === minute && styles.selectedTimeText,
                                        ]}
                                    >
                                        {minute.toString().padStart(2, '0')}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>

                {/* Selected time display */}
                <View style={styles.selectedTimeDisplay}>
                    <Ionicons name="time-outline" size={24} color={colors.primary} />
                    <Text style={styles.selectedTimeText2}>
                        {selectedDate.getHours().toString().padStart(2, '0')}:
                        {selectedDate.getMinutes().toString().padStart(2, '0')}
                    </Text>
                </View>
            </View>
        );
    };

    const getTitle = () => {
        if (title) return title;
        if (mode === 'time') return 'Seleccionar hora';
        if (mode === 'date') return 'Seleccionar fecha';
        return viewMode === 'date' ? 'Seleccionar fecha' : 'Seleccionar hora';
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
                            <Text style={styles.cancelText}>Cancelar</Text>
                        </TouchableOpacity>
                        <Text style={styles.title}>{getTitle()}</Text>
                        {mode === 'datetime' && viewMode === 'time' ? (
                            <TouchableOpacity onPress={handleConfirm} style={styles.confirmButton}>
                                <Text style={styles.confirmText}>Listo</Text>
                            </TouchableOpacity>
                        ) : mode === 'time' ? (
                            <TouchableOpacity onPress={handleConfirm} style={styles.confirmButton}>
                                <Text style={styles.confirmText}>Listo</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.placeholder} />
                        )}
                    </View>

                    {/* Content */}
                    {viewMode === 'date' && renderCalendar()}
                    {viewMode === 'time' && renderTimePicker()}

                    {/* Back to date button for datetime mode */}
                    {mode === 'datetime' && viewMode === 'time' && (
                        <TouchableOpacity
                            style={styles.backToDateButton}
                            onPress={() => setViewMode('date')}
                        >
                            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                            <Text style={styles.backToDateText}>Cambiar fecha</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: colors.overlay,
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        paddingBottom: spacing.xl,
        maxHeight: '80%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    title: {
        fontSize: typography.body.fontSize,
        fontWeight: '600',
        color: colors.text.primary,
    },
    cancelButton: {
        padding: spacing.xs,
    },
    cancelText: {
        fontSize: typography.body.fontSize,
        color: colors.text.secondary,
    },
    confirmButton: {
        padding: spacing.xs,
    },
    confirmText: {
        fontSize: typography.body.fontSize,
        fontWeight: '600',
        color: colors.primary,
    },
    placeholder: {
        width: 60,
    },
    // Calendar styles
    calendar: {
        padding: spacing.md,
    },
    calendarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    navButton: {
        padding: spacing.sm,
    },
    monthYearText: {
        fontSize: typography.h4.fontSize,
        fontWeight: '600',
        color: colors.text.primary,
    },
    weekHeader: {
        flexDirection: 'row',
        marginBottom: spacing.sm,
    },
    weekDay: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: spacing.xs,
    },
    weekDayText: {
        fontSize: typography.caption.fontSize,
        fontWeight: '600',
        color: colors.text.secondary,
    },
    weekRow: {
        flexDirection: 'row',
    },
    dayCell: {
        flex: 1,
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        margin: 2,
        borderRadius: borderRadius.full,
    },
    selectedDay: {
        backgroundColor: colors.primary,
    },
    todayDay: {
        borderWidth: 1,
        borderColor: colors.primary,
    },
    dayText: {
        fontSize: typography.body.fontSize,
        color: colors.text.primary,
    },
    selectedDayText: {
        color: colors.text.inverse,
        fontWeight: '600',
    },
    disabledDayText: {
        color: colors.text.disabled,
    },
    todayText: {
        color: colors.primary,
        fontWeight: '600',
    },
    // Time picker styles
    timePicker: {
        padding: spacing.lg,
    },
    timePickerLabel: {
        fontSize: typography.body.fontSize,
        fontWeight: '600',
        color: colors.text.primary,
        textAlign: 'center',
        marginBottom: spacing.md,
    },
    timeSelectors: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    timeColumn: {
        alignItems: 'center',
    },
    timeColumnLabel: {
        fontSize: typography.caption.fontSize,
        color: colors.text.secondary,
        marginBottom: spacing.sm,
    },
    timeScroll: {
        height: 200,
        width: 80,
    },
    timeScrollContent: {
        paddingVertical: spacing.md,
    },
    timeOption: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        marginVertical: 2,
        borderRadius: borderRadius.md,
        alignItems: 'center',
    },
    selectedTimeOption: {
        backgroundColor: colors.primary,
    },
    timeOptionText: {
        fontSize: typography.h4.fontSize,
        color: colors.text.primary,
    },
    selectedTimeText: {
        color: colors.text.inverse,
        fontWeight: '600',
    },
    timeSeparator: {
        fontSize: typography.h2.fontSize,
        fontWeight: '600',
        color: colors.text.primary,
        marginHorizontal: spacing.md,
    },
    selectedTimeDisplay: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: spacing.lg,
        padding: spacing.md,
        backgroundColor: colors.primaryLight,
        borderRadius: borderRadius.md,
        gap: spacing.sm,
    },
    selectedTimeText2: {
        fontSize: typography.h3.fontSize,
        fontWeight: '600',
        color: colors.primary,
    },
    backToDateButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.md,
        gap: spacing.sm,
    },
    backToDateText: {
        fontSize: typography.body.fontSize,
        color: colors.primary,
    },
});
