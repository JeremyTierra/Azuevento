import React, { useState, useEffect } from 'react';
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
import type { Category, EventRequest } from '../types/models';
import { colors, spacing, borderRadius, typography } from '../theme';

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

export const CreateEventScreen: React.FC = () => {
    const navigation = useNavigation<CreateEventNavigationProp>();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showMapModal, setShowMapModal] = useState(false);
    const [tempCoordinates, setTempCoordinates] = useState<Coordinates | null>(null);
    const [loadingLocation, setLoadingLocation] = useState(false);

    const [formData, setFormData] = useState<EventRequest>({
        title: '',
        description: '',
        categoryId: 0,
        startDate: '',
        endDate: '',
        location: '',
        visibility: 'PUBLIC',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const data = await categoryService.getAll();
            setCategories(data);
        } catch (error: any) {
            Alert.alert('Error', 'No se pudieron cargar las categorías');
        }
    };

    const updateField = (field: keyof EventRequest, value: any) => {
        setFormData({ ...formData, [field]: value });
        setErrors({ ...errors, [field]: undefined });
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

        if (!formData.startDate) {
            newErrors.startDate = 'La fecha de inicio es requerida';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleCreate = async (publish: boolean = false) => {
        if (!validate()) return;

        setLoading(true);
        try {
            const event = await eventService.create(formData);

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
        // Initialize temp coordinates with existing coordinates or null
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

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.sectionTitle}>Información Básica</Text>

                <Input
                    label="Título del evento"
                    placeholder="Ej: Torneo de fútbol 5"
                    value={formData.title}
                    onChangeText={(text) => updateField('title', text)}
                    error={errors.title}
                />

                <Input
                    label="Descripción"
                    placeholder="Describe tu evento..."
                    value={formData.description}
                    onChangeText={(text) => updateField('description', text)}
                    error={errors.description}
                    multiline
                    numberOfLines={4}
                    style={{ height: 100, textAlignVertical: 'top' }}
                />

                <TouchableOpacity
                    style={styles.categorySelector}
                    onPress={() => setShowCategoryModal(true)}
                >
                    <Text style={styles.label}>Categoría *</Text>
                    <View style={[styles.categoryButton, errors.categoryId && styles.errorBorder]}>
                        <Text style={selectedCategory ? styles.categorySelected : styles.categoryPlaceholder}>
                            {selectedCategory ? selectedCategory.name : 'Selecciona una categoría'}
                        </Text>
                        <Text style={styles.arrow}>▼</Text>
                    </View>
                    {errors.categoryId && <Text style={styles.errorText}>{errors.categoryId}</Text>}
                </TouchableOpacity>

                <Text style={styles.sectionTitle}>Fecha y Ubicación</Text>

                <Input
                    label="Fecha de inicio (YYYY-MM-DD HH:MM)"
                    placeholder="2024-02-15 14:00"
                    value={formData.startDate}
                    onChangeText={(text) => updateField('startDate', text)}
                    error={errors.startDate}
                />

                <Input
                    label="Fecha de fin (opcional)"
                    placeholder="2024-02-15 18:00"
                    value={formData.endDate || ''}
                    onChangeText={(text) => updateField('endDate', text)}
                />

                <Input
                    label="Dirección"
                    placeholder="Ej: Estadio Municipal, Cuenca"
                    value={formData.location}
                    onChangeText={(text) => updateField('location', text)}
                    error={errors.location}
                />

                {/* Location Map Selector */}
                <View style={styles.locationSelector}>
                    <Text style={styles.label}>Ubicación en el mapa</Text>
                    <TouchableOpacity
                        style={[
                            styles.mapSelectorButton,
                            hasCoordinates && styles.mapSelectorButtonSelected
                        ]}
                        onPress={handleOpenMapModal}
                    >
                        <Ionicons
                            name={hasCoordinates ? "location" : "location-outline"}
                            size={24}
                            color={hasCoordinates ? colors.success : colors.primary}
                        />
                        <View style={styles.mapSelectorTextContainer}>
                            <Text style={[
                                styles.mapSelectorText,
                                hasCoordinates && styles.mapSelectorTextSelected
                            ]}>
                                {hasCoordinates
                                    ? 'Ubicación seleccionada'
                                    : 'Seleccionar en el mapa'}
                            </Text>
                            {hasCoordinates && (
                                <Text style={styles.coordinatesText}>
                                    {formData.latitude?.toFixed(4)}, {formData.longitude?.toFixed(4)}
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
                    <Text style={styles.helperText}>
                        Selecciona la ubicación para que aparezca en el mapa de eventos
                    </Text>
                </View>

                <Text style={styles.sectionTitle}>Configuración</Text>

                <View style={styles.visibilityContainer}>
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
                                size={20}
                                color={formData.visibility === 'PUBLIC' ? colors.primary : colors.text.secondary}
                            />
                            <Text
                                style={[
                                    styles.visibilityText,
                                    formData.visibility === 'PUBLIC' && styles.visibilityTextSelected,
                                ]}
                            >
                                Público
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
                                size={20}
                                color={formData.visibility === 'PRIVATE' ? colors.primary : colors.text.secondary}
                            />
                            <Text
                                style={[
                                    styles.visibilityText,
                                    formData.visibility === 'PRIVATE' && styles.visibilityTextSelected,
                                ]}
                            >
                                Privado
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <Input
                    label="Capacidad máxima (opcional)"
                    placeholder="Ej: 50"
                    value={formData.maxCapacity?.toString() || ''}
                    onChangeText={(text) => updateField('maxCapacity', text ? parseInt(text) : undefined)}
                    keyboardType="number-pad"
                />

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
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Selecciona una categoría</Text>
                        <ScrollView>
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
                                    <Text style={styles.categoryOptionText}>{category.name}</Text>
                                    {category.description && (
                                        <Text style={styles.categoryDescription}>{category.description}</Text>
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
                    {/* Map Modal Header */}
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

                    {/* Instructions */}
                    <View style={styles.mapInstructions}>
                        <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
                        <Text style={styles.mapInstructionsText}>
                            Toca el mapa para seleccionar la ubicación del evento
                        </Text>
                    </View>

                    {/* Map */}
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

                    {/* Selected coordinates display */}
                    {tempCoordinates && (
                        <View style={styles.selectedCoordinates}>
                            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                            <Text style={styles.selectedCoordinatesText}>
                                Ubicación: {tempCoordinates.latitude.toFixed(6)}, {tempCoordinates.longitude.toFixed(6)}
                            </Text>
                        </View>
                    )}

                    {/* Map Modal Buttons */}
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
    categorySelector: {
        marginBottom: spacing.md,
    },
    label: {
        fontSize: typography.bodySmall.fontSize,
        fontWeight: '600',
        color: colors.text.primary,
        marginBottom: spacing.xs,
    },
    categoryButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        height: 48,
    },
    categorySelected: {
        fontSize: typography.body.fontSize,
        color: colors.text.primary,
    },
    categoryPlaceholder: {
        fontSize: typography.body.fontSize,
        color: colors.text.disabled,
    },
    arrow: {
        fontSize: 12,
        color: colors.text.secondary,
    },
    errorBorder: {
        borderColor: colors.error,
    },
    errorText: {
        fontSize: typography.caption.fontSize,
        color: colors.error,
        marginTop: spacing.xs,
    },
    // Location Selector
    locationSelector: {
        marginBottom: spacing.md,
    },
    mapSelectorButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        gap: spacing.md,
    },
    mapSelectorButtonSelected: {
        borderColor: colors.success,
        backgroundColor: colors.success + '10',
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
    coordinatesText: {
        fontSize: typography.caption.fontSize,
        color: colors.text.secondary,
        marginTop: 2,
    },
    helperText: {
        fontSize: typography.caption.fontSize,
        color: colors.text.secondary,
        marginTop: spacing.xs,
    },
    // Visibility
    visibilityContainer: {
        marginBottom: spacing.md,
    },
    visibilityButtons: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    visibilityOption: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1.5,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
    },
    visibilitySelected: {
        borderColor: colors.primary,
        backgroundColor: colors.primary + '10',
    },
    visibilityText: {
        fontSize: typography.body.fontSize,
        color: colors.text.secondary,
    },
    visibilityTextSelected: {
        color: colors.primary,
        fontWeight: '600',
    },
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
        maxHeight: '70%',
    },
    modalTitle: {
        fontSize: typography.h3.fontSize,
        fontWeight: typography.h3.fontWeight,
        color: colors.text.primary,
        marginBottom: spacing.lg,
    },
    categoryOption: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.sm,
        backgroundColor: colors.background,
    },
    categoryOptionSelected: {
        backgroundColor: colors.primary + '15',
        borderWidth: 1.5,
        borderColor: colors.primary,
    },
    categoryOptionText: {
        fontSize: typography.body.fontSize,
        fontWeight: '600',
        color: colors.text.primary,
    },
    categoryDescription: {
        fontSize: typography.bodySmall.fontSize,
        color: colors.text.secondary,
        marginTop: spacing.xs,
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
