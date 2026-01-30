# Requerimientos Funcionales

## Autenticación y perfil
RF-01 Registro de usuario (MVP)
- Permite crear cuenta con nombre, email y contraseña.

RF-02 Inicio de sesión (MVP)
- Permite autenticar al usuario y mantener sesión con token.

RF-03 Gestión de perfil de usuario (MVP)
- Editar intereses (categorías) y descripción personal.

## Gestión de eventos (usuario)
RF-04 Crear evento (MVP)
- Crear evento con: título, descripción, fecha/hora, categoría, visibilidad, ubicación (lat/lng).
- El evento se crea en estado draft por defecto.

RF-05 Editar evento (MVP)
- Editar datos del evento si el usuario es creador (o coorganizador si aplica).

RF-06 Eliminar evento (MVP)
- Eliminar evento mediante borrado lógico (recomendado).
- Un evento eliminado no debe aparecer en listados.

RF-07 Listar mis eventos (MVP)
- Listar eventos creados por mí, con estado visible (draft/published/cancelled/archived).

RF-08 Ver detalle de evento (MVP)
- Ver información completa del evento y acciones según permisos.

## Estados del evento (mejor práctica)
RF-09 Publicar evento (MVP)
- Cambia estado de draft → published.
- Reglas: fecha/hora válida y ubicación válida.

RF-10 Cancelar evento (MVP)
- Cambia estado de published → cancelled.
- Reglas: se conserva el evento, se marca como cancelado, no admite nuevas asistencias.

RF-11 Archivar evento (MVP)
- Cambia estado de published/cancelled → archived.
- Reglas: eventos pasados pueden mostrarse como "finalizados/archivados".

## Descubrimiento (explorar)
RF-12 Visualizar eventos públicos (MVP)
- Mostrar eventos con visibilidad public y estado published.
- Orden por fecha/hora (próximos primero).

RF-13 Clasificar eventos por categorías (MVP)
- Filtrar eventos por categoría.

RF-14 Buscar eventos por nombre y categoría (MVP)
- Búsqueda por texto (título) y filtros por categoría.

## Mapa y navegación
RF-15 Visualización de eventos en mapa (MVP)
- Mostrar eventos public + published en mapa mediante marcadores.

RF-16 Indicaciones para llegar al evento (Deseable)
- Abrir app de mapas (Google/Apple) con ruta usando lat/lng.

## Interacción social
RF-17 Gestión de eventos favoritos (MVP)
- Marcar/desmarcar favoritos y listar favoritos.

RF-18 Registro de asistencia a eventos (MVP)
- Confirmar asistencia (confirmado | cancelado | asistio | no_asistio).
- Reglas: evitar duplicados por usuario-evento.
- No permitir nuevas asistencias si evento está cancelled o archived.

RF-19 Comentarios en eventos (MVP)
- Permitir a usuarios comentar en eventos published.
- Editar y eliminar propios comentarios.

RF-20 Valoraciones de eventos (MVP)
- Permitir calificar eventos (1-5 estrellas) después de asistir.
- Una valoración por usuario-evento.

RF-21 Creación de eventos con coorganizadores (Deseable)
- Invitar coorganizadores con permisos para editar y gestionar asistentes.

## Administración
RF-22 Panel de administración de eventos (Deseable)
- Moderar eventos: ocultar/eliminar, aprobar (opcional), gestionar reportes.
