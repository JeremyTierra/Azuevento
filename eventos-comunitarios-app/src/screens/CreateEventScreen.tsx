import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Alert,
    TouchableOpacity,
    Modal,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, MapPressEvent } from 'react-native-maps';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ExploreStackParamList } from '../navigation/TabNavigator';
import { eventService } from '../services/eventService';
import { categoryService } from '../services/categoryService';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { DateTimePicker } from '../components/DateTimePicker';
import type { Category, EventRequest } from '../types/models';
import { colors, spacing, borderRadius, typography } from '../theme';
import { getCategoryIcon } from '../utils/formatters';

type CreateEventNavigationProp = NativeStackNavigationProp<ExploreStackParamList, 'CreateEvent'>;

// Default location: Cuenca, Ecuador
const DEFAULT_REGION = {
    latitude: -2.9001,
    longitude: -79.0059,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
};

type Coordinates = {
    latitude: number;
    longitude: number;
};

// Format date for display
const formatDisplayDate = (date: Date): string => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    const dayName = days[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${dayName}, ${day} ${month} ${year}`;
};

// Format time for display
const formatDisplayTime = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
};

// Format date for API (ISO 8601 format: yyyy-MM-ddTHH:mm:ss)
const formatForAPI = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}:00`;
};

export const CreateEventScreen: React.FC = () => {
    const navigation = useNavigation<CreateEventNavigationProp>();
    const scrollViewRef = useRef<ScrollView>(null);

    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showMapModal, setShowMapModal] = useState(false);
    const [tempCoordinates, setTempCoordinates] = useState<Coordinates | null>(null);
    const [loadingLocation, setLoadingLocation] = useState(false);

    // Date/Time picker states
    const [startDate, setStartDate] = useState<Date>(new Date());
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [hasStartDate, setHasStartDate] = useState(false);
    const [hasEndDate, setHasEndDate] = useState(false);

    // Picker visibility
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showStartTimePicker, setShowStartTimePicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [showEndTimePicker, setShowEndTimePicker] = useState(false);

    const [formData, setFormData] = useState<Omit<EventRequest, 'startDate' | 'endDate'> & { startDate?: string; endDate?: string }>({
        title: '',
        description: '',
        categoryId: 0,
        location: '',
        visibility: 'PUBLIC',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        loadCategories();
        // Set default start date to tomorrow at 10:00
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(10, 0, 0, 0);
        setStartDate(tomorrow);
    }, []);

    const loadCategories = async () => {
        try {
            const data = await categoryService.getAll();
            setCategories(data);
        } catch (error: any) {
            Alert.alert('Error', 'No se pudieron cargar las categorías');
        }
    };

    const updateField = (field: string, value: any) => {
        setFormData({ ...formData, [field]: value });
        if (errors[field]) {
            setErrors({ ...errors, [field]: '' });
        }
    };

    // Date picker handlers
    const handleStartDateConfirm = (date: Date) => {
        setStartDate(date);
        setHasStartDate(true);
        setShowStartPicker(false);
        if (errors.startDate) {
            setErrors({ ...errors, startDate: '' });
        }
    };

    const handleStartTimeConfirm = (date: Date) => {
        const newDate = new Date(startDate);
        newDate.setHours(date.getHours());
        newDate.setMinutes(date.getMinutes());
        setStartDate(newDate);
        setHasStartDate(true);
        setShowStartTimePicker(false);
    };

    const handleEndDateConfirm = (date: Date) => {
        setEndDate(date);
        setHasEndDate(true);
        setShowEndPicker(false);
    };

    const handleEndTimeConfirm = (date: Date) => {
        const newDate = endDate ? new Date(endDate) : new Date(startDate);
        newDate.setHours(date.getHours());
        newDate.setMinutes(date.getMinutes());
        setEndDate(newDate);
        setHasEndDate(true);
        setShowEndTimePicker(false);
    };

    const clearEndDate = () => {
        setEndDate(null);
        setHasEndDate(false);
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.title.trim()) {
            newErrors.title = 'El título es requerido';
        } else if (formData.title.length < 5) {
            newErrors.title = 'El título debe tener al menos 5 caracteres';
        }

        if (!formData.description.trim()) {
            newErrors.description = 'La descripción es requerida';
        } else if (formData.description.length < 20) {
            newErrors.description = 'La descripción debe tener al menos 20 caracteres';
        }

        if (!formData.categoryId || formData.categoryId === 0) {
            newErrors.categoryId = 'Selecciona una categoría';
        }

        if (!formData.location.trim()) {
            newErrors.location = 'La ubicación es requerida';
        }

        if (!hasStartDate) {
            newErrors.startDate = 'Selecciona la fecha y hora de inicio';
        } else if (startDate < new Date()) {
            newErrors.startDate = 'La fecha de inicio debe ser en el futuro';
        }

        if (hasEndDate && endDate && endDate <= startDate) {
            newErrors.endDate = 'La fecha de fin debe ser posterior al inicio';
        }

        setErrors(newErrors);

        // Show alert with first error and scroll to top
        if (Object.keys(newErrors).length > 0) {
            const errorMessages = Object.values(newErrors);
            Alert.alert(
                'Campos incompletos',
                errorMessages.join('\n'),
                [{ text: 'Entendido' }]
            );
            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        }

        return Object.keys(newErrors).length === 0;
    };

    const handleCreate = async (publish: boolean = false) => {
        if (!validate()) return;

        setLoading(true);
        try {
            const eventData: EventRequest = {
                ...formData,
                startDate: formatForAPI(startDate),
                endDate: hasEndDate && endDate ? formatForAPI(endDate) : '',
            };

            const event = await eventService.create(eventData);

            if (publish) {
                await eventService.publish(event.id);
                Alert.alert('Éxito', 'Evento publicado exitosamente');
            } else {
                Alert.alert('Éxito', 'Evento guardado como borrador');
            }

            navigation.goBack();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'No se pudo crear el evento');
        } finally {
            setLoading(false);
        }
    };

    // Map functions
    const handleOpenMapModal = () => {
        if (formData.latitude && formData.longitude) {
            setTempCoordinates({
                latitude: formData.latitude,
                longitude: formData.longitude,
            });
        } else {
            setTempCoordinates(null);
        }
        setShowMapModal(true);
    };

    const handleMapPress = (event: MapPressEvent) => {
        const { coordinate } = event.nativeEvent;
        setTempCoordinates(coordinate);
    };

    const handleUseCurrentLocation = async () => {
        setLoadingLocation(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permiso denegado', 'Necesitamos acceso a tu ubicación');
                setLoadingLocation(false);
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            setTempCoordinates({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });
        } catch (error) {
            Alert.alert('Error', 'No se pudo obtener tu ubicación');
        } finally {
            setLoadingLocation(false);
        }
    };

    const handleConfirmLocation = () => {
        if (tempCoordinates) {
            updateField('latitude', tempCoordinates.latitude);
            updateField('longitude', tempCoordinates.longitude);
        }
        setShowMapModal(false);
    };

    const handleClearLocation = () => {
        updateField('latitude', undefined);
        updateField('longitude', undefined);
        setTempCoordinates(null);
    };

    const selectedCategory = categories.find(c => c.id === formData.categoryId);
    const hasCoordinates = formData.latitude && formData.longitude;

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
                <Text style={styles.headerTitle}>Crear Evento</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView
                ref={scrollViewRef}
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Basic Info Section */}
                <Text style={styles.sectionTitle}>Información Básica</Text>

                <Input
                    label="Título del evento *"
                    placeholder="Ej: Torneo de fútbol 5"
                    value={formData.title}
                    onChangeText={(text) => updateField('title', text)}
                    error={errors.title}
                    maxLength={100}
                />

                <Input
                    label="Descripción *"
                    placeholder="Describe tu evento: qué se hará, qué traer, etc."
                    value={formData.description}
                    onChangeText={(text) => updateField('description', text)}
                    error={errors.description}
                    multiline
                    numberOfLines={4}
                    style={{ height: 100, textAlignVertical: 'top' }}
                    maxLength={1000}
                />

                {/* Category Selector */}
                <TouchableOpacity
                    style={styles.selectorContainer}
                    onPress={() => setShowCategoryModal(true)}
                >
                    <Text style={styles.label}>Categoría *</Text>
                    <View style={[styles.selector, errors.categoryId && styles.selectorError]}>
                        {selectedCategory ? (
                            <View style={styles.selectedCategory}>
                                <View style={styles.categoryIconBadge}>
                                    <Ionicons
                                        name={getCategoryIcon(selectedCategory.name) as any}
                                        size={18}
                                        color={colors.primary}
                                    />
                                </View>
                                <Text style={styles.selectorText}>{selectedCategory.name}</Text>
                            </View>
                        ) : (
                            <Text style={styles.selectorPlaceholder}>Selecciona una categoría</Text>
                        )}
                        <Ionicons name="chevron-down" size={20} color={colors.text.secondary} />
                    </View>
                    {errors.categoryId && <Text style={styles.errorText}>{errors.categoryId}</Text>}
                </TouchableOpacity>

                {/* Date & Time Section */}
                <Text style={styles.sectionTitle}>Fecha y Hora</Text>

                {/* Start Date/Time */}
                <View style={styles.dateTimeSection}>
                    <Text style={styles.label}>Inicio del evento *</Text>
                    <View style={styles.dateTimeRow}>
                        {/* Date Selector */}
                        <TouchableOpacity
                            style={[styles.dateTimeButton, styles.dateButton, errors.startDate && styles.selectorError]}
                            onPress={() => setShowStartPicker(true)}
                        >
                            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                            <Text style={hasStartDate ? styles.dateTimeText : styles.dateTimePlaceholder}>
                                {hasStartDate ? formatDisplayDate(startDate) : 'Seleccionar fecha'}
                            </Text>
                        </TouchableOpacity>

                        {/* Time Selector */}
                        <TouchableOpacity
                            style={[styles.dateTimeButton, styles.timeButton]}
                            onPress={() => setShowStartTimePicker(true)}
                        >
                            <Ionicons name="time-outline" size={20} color={colors.primary} />
                            <Text style={hasStartDate ? styles.dateTimeText : styles.dateTimePlaceholder}>
                                {hasStartDate ? formatDisplayTime(startDate) : '00:00'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    {errors.startDate && <Text style={styles.errorText}>{errors.startDate}</Text>}
                </View>

                {/* End Date/Time */}
                <View style={styles.dateTimeSection}>
                    <View style={styles.labelRow}>
                        <Text style={styles.label}>Fin del evento (opcional)</Text>
                        {hasEndDate && (
                            <TouchableOpacity onPress={clearEndDate}>
                                <Text style={styles.clearButton}>Quitar</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    <View style={styles.dateTimeRow}>
                        {/* Date Selector */}
                        <TouchableOpacity
                            style={[styles.dateTimeButton, styles.dateButton, errors.endDate && styles.selectorError]}
                            onPress={() => {
                                if (!hasEndDate) {
                                    // Initialize end date 2 hours after start
                                    const defaultEnd = new Date(startDate);
                                    defaultEnd.setHours(defaultEnd.getHours() + 2);
                                    setEndDate(defaultEnd);
                                }
                                setShowEndPicker(true);
                            }}
                        >
                            <Ionicons name="calendar-outline" size={20} color={hasEndDate ? colors.primary : colors.text.disabled} />
                            <Text style={hasEndDate ? styles.dateTimeText : styles.dateTimePlaceholder}>
                                {hasEndDate && endDate ? formatDisplayDate(endDate) : 'Seleccionar fecha'}
                            </Text>
                        </TouchableOpacity>

                        {/* Time Selector */}
                        <TouchableOpacity
                            style={[styles.dateTimeButton, styles.timeButton]}
                            onPress={() => {
                                if (!hasEndDate) {
                                    const defaultEnd = new Date(startDate);
                                    defaultEnd.setHours(defaultEnd.getHours() + 2);
                                    setEndDate(defaultEnd);
                                    setHasEndDate(true);
                                }
                                setShowEndTimePicker(true);
                            }}
                        >
                            <Ionicons name="time-outline" size={20} color={hasEndDate ? colors.primary : colors.text.disabled} />
                            <Text style={hasEndDate ? styles.dateTimeText : styles.dateTimePlaceholder}>
                                {hasEndDate && endDate ? formatDisplayTime(endDate) : '00:00'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    {errors.endDate && <Text style={styles.errorText}>{errors.endDate}</Text>}
                </View>

                {/* Location Section */}
                <Text style={styles.sectionTitle}>Ubicación</Text>

                <Input
                    label="Dirección *"
                    placeholder="Ej: Estadio Municipal, Av. Principal"
                    value={formData.location}
                    onChangeText={(text) => updateField('location', text)}
                    error={errors.location}
                    leftIcon={<Ionicons name="location-outline" size={20} color={colors.text.secondary} />}
                />

                {/* Map Location Selector */}
                <View style={styles.mapSelector}>
                    <Text style={styles.label}>Ubicación en el mapa</Text>
                    <TouchableOpacity
                        style={[
                            styles.mapSelectorButton,
                            hasCoordinates && styles.mapSelectorButtonSelected
                        ]}
                        onPress={handleOpenMapModal}
                    >
                        <View style={[styles.mapIconContainer, hasCoordinates && styles.mapIconContainerSelected]}>
                            <Ionicons
                                name={hasCoordinates ? "location" : "map-outline"}
                                size={24}
                                color={hasCoordinates ? colors.success : colors.primary}
                            />
                        </View>
                        <View style={styles.mapSelectorTextContainer}>
                            <Text style={[
                                styles.mapSelectorText,
                                hasCoordinates && styles.mapSelectorTextSelected
                            ]}>
                                {hasCoordinates
                                    ? 'Ubicación marcada'
                                    : 'Marcar en el mapa'}
                            </Text>
                            {hasCoordinates ? (
                                <Text style={styles.coordinatesText}>
                                    {formData.latitude?.toFixed(4)}, {formData.longitude?.toFixed(4)}
                                </Text>
                            ) : (
                                <Text style={styles.mapSelectorHint}>
                                    Aparecerá en el mapa de eventos
                                </Text>
                            )}
                        </View>
                        {hasCoordinates ? (
                            <TouchableOpacity
                                onPress={handleClearLocation}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Ionicons name="close-circle" size={24} color={colors.text.secondary} />
                            </TouchableOpacity>
                        ) : (
                            <Ionicons name="chevron-forward" size={24} color={colors.text.secondary} />
                        )}
                    </TouchableOpacity>
                </View>

                {/* Settings Section */}
                <Text style={styles.sectionTitle}>Configuración</Text>

                <View style={styles.settingItem}>
                    <Text style={styles.label}>Visibilidad</Text>
                    <View style={styles.visibilityButtons}>
                        <TouchableOpacity
                            style={[
                                styles.visibilityOption,
                                formData.visibility === 'PUBLIC' && styles.visibilitySelected,
                            ]}
                            onPress={() => updateField('visibility', 'PUBLIC')}
                        >
                            <Ionicons
                                name="globe-outline"
                                size={22}
                                color={formData.visibility === 'PUBLIC' ? colors.primary : colors.text.secondary}
                            />
                            <Text style={[
                                styles.visibilityText,
                                formData.visibility === 'PUBLIC' && styles.visibilityTextSelected,
                            ]}>
                                Público
                            </Text>
                            <Text style={styles.visibilityHint}>
                                Todos pueden verlo
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.visibilityOption,
                                formData.visibility === 'PRIVATE' && styles.visibilitySelected,
                            ]}
                            onPress={() => updateField('visibility', 'PRIVATE')}
                        >
                            <Ionicons
                                name="lock-closed-outline"
                                size={22}
                                color={formData.visibility === 'PRIVATE' ? colors.primary : colors.text.secondary}
                            />
                            <Text style={[
                                styles.visibilityText,
                                formData.visibility === 'PRIVATE' && styles.visibilityTextSelected,
                            ]}>
                                Privado
                            </Text>
                            <Text style={styles.visibilityHint}>
                                Solo invitados
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <Input
                    label="Capacidad máxima (opcional)"
                    placeholder="Ej: 50 personas"
                    value={formData.maxCapacity?.toString() || ''}
                    onChangeText={(text) => updateField('maxCapacity', text ? parseInt(text) || undefined : undefined)}
                    keyboardType="number-pad"
                    leftIcon={<Ionicons name="people-outline" size={20} color={colors.text.secondary} />}
                />

                {/* Action Buttons */}
                <View style={styles.buttonContainer}>
                    <Button
                        title="Guardar Borrador"
                        variant="outline"
                        onPress={() => handleCreate(false)}
                        loading={loading}
                        style={styles.button}
                    />
                    <Button
                        title="Publicar"
                        onPress={() => handleCreate(true)}
                        loading={loading}
                        style={styles.button}
                    />
                </View>
            </ScrollView>

            {/* Date/Time Pickers */}
            <DateTimePicker
                visible={showStartPicker}
                mode="date"
                value={startDate}
                minimumDate={new Date()}
                onConfirm={handleStartDateConfirm}
                onCancel={() => setShowStartPicker(false)}
                title="Fecha de inicio"
            />
            <DateTimePicker
                visible={showStartTimePicker}
                mode="time"
                value={startDate}
                onConfirm={handleStartTimeConfirm}
                onCancel={() => setShowStartTimePicker(false)}
                title="Hora de inicio"
            />
            <DateTimePicker
                visible={showEndPicker}
                mode="date"
                value={endDate || startDate}
                minimumDate={startDate}
                onConfirm={handleEndDateConfirm}
                onCancel={() => setShowEndPicker(false)}
                title="Fecha de fin"
            />
            <DateTimePicker
                visible={showEndTimePicker}
                mode="time"
                value={endDate || startDate}
                onConfirm={handleEndTimeConfirm}
                onCancel={() => setShowEndTimePicker(false)}
                title="Hora de fin"
            />

            {/* Category Modal */}
            <Modal
                visible={showCategoryModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowCategoryModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowCategoryModal(false)}
                >
                    <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Selecciona una categoría</Text>
                            <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                                <Ionicons name="close" size={24} color={colors.text.primary} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {categories.map((category) => (
                                <TouchableOpacity
                                    key={category.id}
                                    style={[
                                        styles.categoryOption,
                                        formData.categoryId === category.id && styles.categoryOptionSelected,
                                    ]}
                                    onPress={() => {
                                        updateField('categoryId', category.id);
                                        setShowCategoryModal(false);
                                    }}
                                >
                                    <View style={[
                                        styles.categoryOptionIcon,
                                        formData.categoryId === category.id && styles.categoryOptionIconSelected
                                    ]}>
                                        <Ionicons
                                            name={getCategoryIcon(category.name) as any}
                                            size={24}
                                            color={formData.categoryId === category.id ? colors.primary : colors.text.secondary}
                                        />
                                    </View>
                                    <View style={styles.categoryOptionContent}>
                                        <Text style={[
                                            styles.categoryOptionText,
                                            formData.categoryId === category.id && styles.categoryOptionTextSelected
                                        ]}>
                                            {category.name}
                                        </Text>
                                        {category.description && (
                                            <Text style={styles.categoryDescription}>{category.description}</Text>
                                        )}
                                    </View>
                                    {formData.categoryId === category.id && (
                                        <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Map Modal */}
            <Modal
                visible={showMapModal}
                animationType="slide"
                onRequestClose={() => setShowMapModal(false)}
            >
                <SafeAreaView style={styles.mapModalContainer} edges={['top']}>
                    <View style={styles.mapModalHeader}>
                        <TouchableOpacity
                            onPress={() => setShowMapModal(false)}
                            style={styles.mapModalCloseButton}
                        >
                            <Ionicons name="close" size={24} color={colors.text.primary} />
                        </TouchableOpacity>
                        <Text style={styles.mapModalTitle}>Seleccionar ubicación</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <View style={styles.mapInstructions}>
                        <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
                        <Text style={styles.mapInstructionsText}>
                            Toca el mapa para seleccionar la ubicación del evento
                        </Text>
                    </View>

                    <View style={styles.mapContainer}>
                        <MapView
                            style={styles.map}
                            initialRegion={
                                tempCoordinates
                                    ? {
                                        ...tempCoordinates,
                                        latitudeDelta: 0.01,
                                        longitudeDelta: 0.01,
                                    }
                                    : DEFAULT_REGION
                            }
                            onPress={handleMapPress}
                            showsUserLocation
                        >
                            {tempCoordinates && (
                                <Marker
                                    coordinate={tempCoordinates}
                                    draggable
                                    onDragEnd={(e) => setTempCoordinates(e.nativeEvent.coordinate)}
                                >
                                    <View style={styles.markerContainer}>
                                        <View style={styles.marker}>
                                            <Ionicons name="location" size={24} color={colors.text.inverse} />
                                        </View>
                                        <View style={styles.markerTail} />
                                    </View>
                                </Marker>
                            )}
                        </MapView>
                    </View>

                    {tempCoordinates && (
                        <View style={styles.selectedCoordinates}>
                            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                            <Text style={styles.selectedCoordinatesText}>
                                Ubicación: {tempCoordinates.latitude.toFixed(6)}, {tempCoordinates.longitude.toFixed(6)}
                            </Text>
                        </View>
                    )}

                    <View style={styles.mapModalButtons}>
                        <TouchableOpacity
                            style={styles.useLocationButton}
                            onPress={handleUseCurrentLocation}
                            disabled={loadingLocation}
                        >
                            {loadingLocation ? (
                                <ActivityIndicator size="small" color={colors.primary} />
                            ) : (
                                <>
                                    <Ionicons name="navigate" size={20} color={colors.primary} />
                                    <Text style={styles.useLocationButtonText}>Usar mi ubicación</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.confirmLocationButton,
                                !tempCoordinates && styles.confirmLocationButtonDisabled
                            ]}
                            onPress={handleConfirmLocation}
                            disabled={!tempCoordinates}
                        >
                            <Ionicons name="checkmark" size={20} color={colors.text.inverse} />
                            <Text style={styles.confirmLocationButtonText}>Confirmar ubicación</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.surface,
    },
    backButton: {
        padding: spacing.xs,
    },
    headerTitle: {
        flex: 1,
        fontSize: typography.h3.fontSize,
        fontWeight: typography.h3.fontWeight,
        color: colors.text.primary,
        textAlign: 'center',
    },
    headerSpacer: {
        width: 32,
    },
    content: {
        padding: spacing.lg,
    },
    sectionTitle: {
        fontSize: typography.h4.fontSize,
        fontWeight: typography.h4.fontWeight,
        color: colors.text.primary,
        marginTop: spacing.lg,
        marginBottom: spacing.md,
    },
    // Labels
    label: {
        fontSize: typography.bodySmall.fontSize,
        fontWeight: '600',
        color: colors.text.primary,
        marginBottom: spacing.xs,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    clearButton: {
        fontSize: typography.bodySmall.fontSize,
        color: colors.primary,
        fontWeight: '500',
    },
    // Selector
    selectorContainer: {
        marginBottom: spacing.md,
    },
    selector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        height: 52,
    },
    selectorError: {
        borderColor: colors.error,
    },
    selectorText: {
        fontSize: typography.body.fontSize,
        color: colors.text.primary,
    },
    selectorPlaceholder: {
        fontSize: typography.body.fontSize,
        color: colors.text.disabled,
    },
    selectedCategory: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    categoryIconBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: typography.caption.fontSize,
        color: colors.error,
        marginTop: spacing.xs,
    },
    // Date/Time
    dateTimeSection: {
        marginBottom: spacing.md,
    },
    dateTimeRow: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    dateTimeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        height: 52,
        gap: spacing.sm,
    },
    dateButton: {
        flex: 2,
    },
    timeButton: {
        flex: 1,
    },
    dateTimeText: {
        fontSize: typography.body.fontSize,
        color: colors.text.primary,
    },
    dateTimePlaceholder: {
        fontSize: typography.body.fontSize,
        color: colors.text.disabled,
    },
    // Map Selector
    mapSelector: {
        marginBottom: spacing.md,
    },
    mapSelectorButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        gap: spacing.md,
    },
    mapSelectorButtonSelected: {
        borderColor: colors.success,
        backgroundColor: colors.success + '08',
    },
    mapIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mapIconContainerSelected: {
        backgroundColor: colors.success + '20',
    },
    mapSelectorTextContainer: {
        flex: 1,
    },
    mapSelectorText: {
        fontSize: typography.body.fontSize,
        color: colors.primary,
        fontWeight: '500',
    },
    mapSelectorTextSelected: {
        color: colors.success,
    },
    mapSelectorHint: {
        fontSize: typography.caption.fontSize,
        color: colors.text.secondary,
        marginTop: 2,
    },
    coordinatesText: {
        fontSize: typography.caption.fontSize,
        color: colors.text.secondary,
        marginTop: 2,
    },
    // Settings
    settingItem: {
        marginBottom: spacing.md,
    },
    visibilityButtons: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    visibilityOption: {
        flex: 1,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1.5,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        alignItems: 'center',
        gap: spacing.xs,
    },
    visibilitySelected: {
        borderColor: colors.primary,
        backgroundColor: colors.primary + '08',
    },
    visibilityText: {
        fontSize: typography.body.fontSize,
        fontWeight: '600',
        color: colors.text.secondary,
    },
    visibilityTextSelected: {
        color: colors.primary,
    },
    visibilityHint: {
        fontSize: typography.caption.fontSize,
        color: colors.text.disabled,
    },
    // Buttons
    buttonContainer: {
        flexDirection: 'row',
        gap: spacing.md,
        marginTop: spacing.xl,
        marginBottom: spacing.xxl,
    },
    button: {
        flex: 1,
    },
    // Category Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: colors.overlay,
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        padding: spacing.lg,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    modalTitle: {
        fontSize: typography.h3.fontSize,
        fontWeight: typography.h3.fontWeight,
        color: colors.text.primary,
    },
    categoryOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.sm,
        borderRadius: borderRadius.md,
        marginBottom: spacing.sm,
        backgroundColor: colors.background,
        gap: spacing.md,
    },
    categoryOptionSelected: {
        backgroundColor: colors.primary + '10',
        borderWidth: 1,
        borderColor: colors.primary,
    },
    categoryOptionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoryOptionIconSelected: {
        backgroundColor: colors.primaryLight,
    },
    categoryOptionContent: {
        flex: 1,
    },
    categoryOptionText: {
        fontSize: typography.body.fontSize,
        fontWeight: '600',
        color: colors.text.primary,
    },
    categoryOptionTextSelected: {
        color: colors.primary,
    },
    categoryDescription: {
        fontSize: typography.caption.fontSize,
        color: colors.text.secondary,
        marginTop: 2,
    },
    // Map Modal
    mapModalContainer: {
        flex: 1,
        backgroundColor: colors.background,
    },
    mapModalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    mapModalCloseButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mapModalTitle: {
        fontSize: typography.h3.fontSize,
        fontWeight: typography.h3.fontWeight,
        color: colors.text.primary,
    },
    mapInstructions: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primaryLight,
        padding: spacing.md,
        gap: spacing.sm,
    },
    mapInstructionsText: {
        fontSize: typography.bodySmall.fontSize,
        color: colors.primary,
        flex: 1,
    },
    mapContainer: {
        flex: 1,
    },
    map: {
        flex: 1,
    },
    markerContainer: {
        alignItems: 'center',
    },
    marker: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    markerTail: {
        width: 0,
        height: 0,
        borderLeftWidth: 10,
        borderRightWidth: 10,
        borderTopWidth: 12,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: colors.primary,
        marginTop: -2,
    },
    selectedCoordinates: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.success + '15',
        padding: spacing.md,
        gap: spacing.sm,
    },
    selectedCoordinatesText: {
        fontSize: typography.bodySmall.fontSize,
        color: colors.success,
        fontWeight: '500',
    },
    mapModalButtons: {
        padding: spacing.lg,
        gap: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    useLocationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primaryLight,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        gap: spacing.sm,
    },
    useLocationButtonText: {
        fontSize: typography.body.fontSize,
        fontWeight: '600',
        color: colors.primary,
    },
    confirmLocationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        gap: spacing.sm,
    },
    confirmLocationButtonDisabled: {
        backgroundColor: colors.text.disabled,
    },
    confirmLocationButtonText: {
        fontSize: typography.body.fontSize,
        fontWeight: '600',
        color: colors.text.inverse,
    },
});
