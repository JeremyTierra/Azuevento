# Flujos de Pantallas (App Móvil)

## Autenticación
Inicio → Registro → Login → Explorar eventos

## Exploración
Explorar → Listado de eventos (public + published) → Filtro/Búsqueda → Detalle del evento

## Ver evento en mapa
Mapa → Marcador → Resumen → Detalle del evento

## Crear evento (con estados)
Explorar/Mis eventos → Crear evento → Guardar
- Resultado: Evento en estado draft

## Publicar evento
Mis eventos → Detalle (draft) → Publicar
- Resultado: Evento pasa a published y si es public aparece en Explorar/Mapa

## Editar evento
Mis eventos → Detalle → Editar → Guardar

## Cancelar evento
Mis eventos → Detalle (published) → Cancelar
- Resultado: Estado cancelled, se muestra como cancelado, no permite nuevas asistencias

## Archivar evento
Mis eventos → Detalle (published/cancelled) → Archivar
- Resultado: archived (finalizado/archivado)

## Asistencia
Detalle del evento (published) → Asistir / No asistir
- Si cancelled o archived: botón deshabilitado y se muestra mensaje

## Favoritos
Detalle del evento → Marcar favorito → Lista de favoritos → Detalle del evento

## Check-in con código QR (Participante)
Detalle del evento (registrado) → Mi Entrada → Pantalla con código QR
- Muestra: título del evento, nombre del participante, código QR único
- El participante presenta el QR al organizador para check-in

## Escaneo QR para check-in (Organizador)
Detalle del evento (organizador) → Escanear → Cámara activa
- Escanear código QR del participante
- Validación automática del token
- Confirmación visual: nombre del participante y estado de check-in
- Si ya hizo check-in: mostrar mensaje de duplicado

## Ver lista de asistencia (Organizador)
Detalle del evento (organizador) → Lista de asistentes
- Lista de participantes con estado (pendiente/asistió)
- Contador de asistencia total

## Compartir evento
Detalle del evento → Botón compartir → Selector nativo de apps
- Comparte: título, ubicación, fecha y descripción breve

## Perfil
Perfil → Editar intereses / descripción → Guardar

## Cambiar contraseña
Perfil → Cambiar contraseña → Formulario (contraseña actual + nueva) → Guardar
- Validación de contraseña actual requerida

## Navegación con Tabs
La app utiliza navegación por tabs con 4 secciones principales:
1. **Explorar**: Listado de eventos públicos, búsqueda y filtros
2. **Mi Agenda**: Eventos favoritos, creados y eventos a los que asisto
3. **Mapa**: Visualización geográfica de eventos
4. **Perfil**: Información del usuario y configuración
