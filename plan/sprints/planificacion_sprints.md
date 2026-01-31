# Planificación Scrum - Azuevento MVP

## Datos del Proyecto
- **Metodología**: Scrum
- **Duración total**: 01 noviembre 2025 - 31 enero 2026 (12 semanas)
- **Sprints**: 6 sprints de 2 semanas
- **Equipo**: Jeremy Tierra, Mateo Astudillo

## Calendario de Sprints

| Sprint | Inicio | Fin | Enfoque |
|--------|--------|-----|---------|
| Sprint 1 | 01/11/2025 | 14/11/2025 | Arquitectura base, autenticación y modelo de datos |
| Sprint 2 | 15/11/2025 | 28/11/2025 | Gestión de eventos (CRUD + estados) |
| Sprint 3 | 29/11/2025 | 12/12/2025 | Exploración, mapa y búsqueda |
| Sprint 4 | 13/12/2025 | 26/12/2025 | Interacción social (favoritos, comentarios, valoraciones) |
| Sprint 5 | 27/12/2025 | 09/01/2026 | Sistema de check-in QR y compartir |
| Sprint 6 | 10/01/2026 | 23/01/2026 | Perfil de usuario, pruebas y refinamiento |
| Buffer  | 24/01/2026 | 31/01/2026 | Correcciones finales y documentación |

---

## Sprint 1: Arquitectura Base y Autenticación
**Fecha**: 01/11/2025 - 14/11/2025
**Objetivo**: Configurar la infraestructura del proyecto y sistema de autenticación completo.

| ID | Tarea | Tipo | Asignado | Story Points | RF |
|----|-------|------|----------|-------------|-----|
| S1-01 | Configurar proyecto Spring Boot con PostgreSQL | Backend | Mateo Astudillo | 3 | - |
| S1-02 | Configurar proyecto React Native con Expo | Frontend | Jeremy Tierra | 3 | - |
| S1-03 | Diseñar e implementar modelo de datos (entidades JPA) | Backend | Mateo Astudillo | 5 | - |
| S1-04 | Implementar seguridad JWT (filtro, provider, config) | Backend | Mateo Astudillo | 5 | RF-02 |
| S1-05 | Crear endpoint POST /api/auth/register | Backend | Mateo Astudillo | 3 | RF-01 |
| S1-06 | Crear endpoint POST /api/auth/login | Backend | Mateo Astudillo | 3 | RF-02 |
| S1-07 | Implementar pantalla de Login | Frontend | Jeremy Tierra | 3 | RF-02 |
| S1-08 | Implementar pantalla de Registro | Frontend | Jeremy Tierra | 3 | RF-01 |
| S1-09 | Implementar AuthContext y persistencia de sesión (AsyncStorage) | Frontend | Jeremy Tierra | 5 | RF-02 |
| S1-10 | Configurar navegación base (Stack + Tab Navigator) | Frontend | Jeremy Tierra | 3 | - |
| S1-11 | Crear sistema de temas y estilos globales | Frontend | Jeremy Tierra | 2 | - |
| S1-12 | Crear seed de categorías iniciales | Backend | Mateo Astudillo | 2 | - |
| | | | | **Total: 40** | |

---

## Sprint 2: Gestión de Eventos
**Fecha**: 15/11/2025 - 28/11/2025
**Objetivo**: Implementar el ciclo de vida completo de eventos (CRUD + transiciones de estado).

| ID | Tarea | Tipo | Asignado | Story Points | RF |
|----|-------|------|----------|-------------|-----|
| S2-01 | Crear endpoint POST /api/events (crear evento) | Backend | Mateo Astudillo | 3 | RF-04 |
| S2-02 | Crear endpoint PUT /api/events/{id} (editar evento) | Backend | Mateo Astudillo | 3 | RF-05 |
| S2-03 | Crear endpoint DELETE /api/events/{id} (borrado lógico) | Backend | Mateo Astudillo | 3 | RF-06 |
| S2-04 | Crear endpoint POST /api/events/{id}/publish | Backend | Mateo Astudillo | 2 | RF-09 |
| S2-05 | Crear endpoint POST /api/events/{id}/cancel | Backend | Mateo Astudillo | 2 | RF-10 |
| S2-06 | Crear endpoint POST /api/events/{id}/archive | Backend | Mateo Astudillo | 2 | RF-11 |
| S2-07 | Crear endpoint GET /api/events/my-events | Backend | Mateo Astudillo | 2 | RF-07 |
| S2-08 | Crear endpoint GET /api/events/{id} (detalle) | Backend | Mateo Astudillo | 3 | RF-08 |
| S2-09 | Implementar pantalla CreateEventScreen (formulario con mapa) | Frontend | Jeremy Tierra | 8 | RF-04 |
| S2-10 | Implementar pantalla MyEventsScreen (tabs: creados/asistiendo) | Frontend | Jeremy Tierra | 5 | RF-07 |
| S2-11 | Implementar pantalla EventDetailScreen | Frontend | Jeremy Tierra | 8 | RF-08 |
| S2-12 | Implementar acciones publicar/cancelar/archivar en UI | Frontend | Jeremy Tierra | 3 | RF-09, RF-10, RF-11 |
| | | | | **Total: 44** | |

---

## Sprint 3: Exploración, Mapa y Búsqueda
**Fecha**: 29/11/2025 - 12/12/2025
**Objetivo**: Permitir a los usuarios descubrir eventos mediante listado, búsqueda, filtros y mapa.

| ID | Tarea | Tipo | Asignado | Story Points | RF |
|----|-------|------|----------|-------------|-----|
| S3-01 | Crear endpoint GET /api/events (eventos públicos) | Backend | Mateo Astudillo | 3 | RF-12 |
| S3-02 | Crear endpoint GET /api/events/search (búsqueda + filtros) | Backend | Mateo Astudillo | 5 | RF-14 |
| S3-03 | Crear endpoint GET /api/categories | Backend | Mateo Astudillo | 2 | RF-13 |
| S3-04 | Implementar pantalla HomeScreen (listado de eventos) | Frontend | Jeremy Tierra | 5 | RF-12 |
| S3-05 | Implementar barra de búsqueda por texto | Frontend | Jeremy Tierra | 3 | RF-14 |
| S3-06 | Implementar filtro por categorías (chips horizontales) | Frontend | Jeremy Tierra | 3 | RF-13 |
| S3-07 | Implementar componente EventCard | Frontend | Jeremy Tierra | 3 | - |
| S3-08 | Implementar pantalla MapScreen con react-native-maps | Frontend | Jeremy Tierra | 8 | RF-15 |
| S3-09 | Implementar marcadores de eventos en mapa | Frontend | Jeremy Tierra | 3 | RF-15 |
| S3-10 | Implementar indicaciones externas (Google Maps / Apple Maps) | Frontend | Jeremy Tierra | 3 | RF-16 |
| S3-11 | Implementar pull-to-refresh y estados vacíos | Frontend | Jeremy Tierra | 2 | - |
| S3-12 | Configurar Swagger/OpenAPI para documentación de API | Backend | Mateo Astudillo | 2 | - |
| | | | | **Total: 42** | |

---

## Sprint 4: Interacción Social
**Fecha**: 13/12/2025 - 26/12/2025
**Objetivo**: Implementar favoritos, asistencia, comentarios y valoraciones.

| ID | Tarea | Tipo | Asignado | Story Points | RF |
|----|-------|------|----------|-------------|-----|
| S4-01 | Crear endpoints de favoritos (POST/DELETE/GET) | Backend | Mateo Astudillo | 3 | RF-17 |
| S4-02 | Crear endpoints de asistencia (POST/DELETE) | Backend | Mateo Astudillo | 3 | RF-18 |
| S4-03 | Crear endpoint GET /api/events/attending | Backend | Mateo Astudillo | 2 | RF-18 |
| S4-04 | Crear endpoints de comentarios (CRUD) | Backend | Mateo Astudillo | 5 | RF-19 |
| S4-05 | Crear endpoints de valoraciones (POST/PUT/GET) | Backend | Mateo Astudillo | 3 | RF-20 |
| S4-06 | Implementar botón de favorito en EventCard y EventDetail | Frontend | Jeremy Tierra | 3 | RF-17 |
| S4-07 | Implementar tab "Favoritos" en MyEventsScreen | Frontend | Jeremy Tierra | 3 | RF-17 |
| S4-08 | Implementar botón inscribirse/cancelar asistencia | Frontend | Jeremy Tierra | 3 | RF-18 |
| S4-09 | Implementar tab "Asistiendo" en MyEventsScreen | Frontend | Jeremy Tierra | 3 | RF-18 |
| S4-10 | Implementar pantalla CommentsScreen | Frontend | Jeremy Tierra | 5 | RF-19 |
| S4-11 | Implementar componente RatingStars y flujo de valoración | Frontend | Jeremy Tierra | 5 | RF-20 |
| S4-12 | Mostrar estadísticas en EventDetail (asistentes, rating, favoritos) | Frontend | Jeremy Tierra | 3 | RF-08 |
| | | | | **Total: 41** | |

---

## Sprint 5: Sistema de Check-in QR y Compartir
**Fecha**: 27/12/2025 - 09/01/2026
**Objetivo**: Implementar tickets con QR, escaneo para check-in y funcionalidad de compartir.

| ID | Tarea | Tipo | Asignado | Story Points | RF |
|----|-------|------|----------|-------------|-----|
| S5-01 | Generar checkin_token al registrar asistencia | Backend | Mateo Astudillo | 3 | RF-21 |
| S5-02 | Crear endpoint GET /api/events/{id}/my-ticket | Backend | Mateo Astudillo | 3 | RF-21 |
| S5-03 | Crear endpoint POST /api/events/{id}/checkin | Backend | Mateo Astudillo | 5 | RF-22 |
| S5-04 | Crear endpoint GET /api/events/{id}/attendance-list | Backend | Mateo Astudillo | 3 | RF-23 |
| S5-05 | Implementar pantalla MyTicketScreen (generar QR) | Frontend | Jeremy Tierra | 5 | RF-21 |
| S5-06 | Implementar pantalla ScannerScreen (cámara + lector QR) | Frontend | Jeremy Tierra | 8 | RF-22 |
| S5-07 | Implementar feedback visual de check-in (éxito/error/duplicado) | Frontend | Jeremy Tierra | 3 | RF-22 |
| S5-08 | Implementar vista de lista de asistencia para organizador | Frontend | Jeremy Tierra | 3 | RF-23 |
| S5-09 | Implementar funcionalidad de compartir evento (Share API) | Frontend | Jeremy Tierra | 3 | RF-24 |
| S5-10 | Validaciones de seguridad: solo organizador puede escanear | Backend | Mateo Astudillo | 2 | RF-22 |
| S5-11 | Prevención de check-in duplicado | Backend | Mateo Astudillo | 2 | RF-22 |
| | | | | **Total: 40** | |

---

## Sprint 6: Perfil, Pruebas y Refinamiento
**Fecha**: 10/01/2026 - 23/01/2026
**Objetivo**: Completar gestión de perfil, pruebas generales y pulido de UI/UX.

| ID | Tarea | Tipo | Asignado | Story Points | RF |
|----|-------|------|----------|-------------|-----|
| S6-01 | Crear endpoint GET /api/users/me | Backend | Mateo Astudillo | 2 | RF-03 |
| S6-02 | Crear endpoint PUT /api/users/me (editar perfil) | Backend | Mateo Astudillo | 3 | RF-03 |
| S6-03 | Crear endpoint PUT /api/users/me/password | Backend | Mateo Astudillo | 3 | RF-25 |
| S6-04 | Implementar pantalla ProfileScreen | Frontend | Jeremy Tierra | 3 | RF-03 |
| S6-05 | Implementar pantalla EditProfileScreen | Frontend | Jeremy Tierra | 3 | RF-03 |
| S6-06 | Implementar pantalla ChangePasswordScreen | Frontend | Jeremy Tierra | 3 | RF-25 |
| S6-07 | Implementar cierre de sesión | Frontend | Jeremy Tierra | 2 | - |
| S6-08 | Manejo global de errores y excepciones (API) | Backend | Mateo Astudillo | 3 | - |
| S6-09 | Pruebas de integración de flujos principales | QA | Jeremy Tierra | 5 | - |
| S6-10 | Pruebas de usabilidad y ajustes de UI | QA | Mateo Astudillo | 5 | - |
| S6-11 | Corrección de bugs identificados en pruebas | Full Stack | Jeremy Tierra | 5 | - |
| S6-12 | Optimización de rendimiento y consultas | Backend | Mateo Astudillo | 3 | - |
| | | | | **Total: 40** | |

---

## Buffer Final: 24/01/2026 - 31/01/2026
- Correcciones finales de bugs
- Documentación técnica
- Preparación para entrega

---

## Resumen de Velocidad

| Sprint | Story Points | Estado |
|--------|-------------|--------|
| Sprint 1 | 40 | Completado |
| Sprint 2 | 44 | Completado |
| Sprint 3 | 42 | Completado |
| Sprint 4 | 41 | Completado |
| Sprint 5 | 40 | Completado |
| Sprint 6 | 40 | Completado |
| **Total** | **247** | |

## Distribución por Rol

| Miembro | Rol Principal | Sprints |
|---------|--------------|---------|
| Jeremy Tierra | Frontend (React Native) + QA | S1-S6 |
| Mateo Astudillo | Backend (Spring Boot) + BD | S1-S6 |

## Cobertura de Requerimientos por Sprint

| Sprint | Requerimientos Cubiertos |
|--------|-------------------------|
| Sprint 1 | RF-01, RF-02 |
| Sprint 2 | RF-04, RF-05, RF-06, RF-07, RF-08, RF-09, RF-10, RF-11 |
| Sprint 3 | RF-12, RF-13, RF-14, RF-15, RF-16 |
| Sprint 4 | RF-17, RF-18, RF-19, RF-20 |
| Sprint 5 | RF-21, RF-22, RF-23, RF-24 |
| Sprint 6 | RF-03, RF-25 |
