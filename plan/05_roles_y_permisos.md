# Roles y Permisos

## Roles
- USUARIO: usuario final, puede crear y gestionar sus eventos.
- COORGANIZADOR (opcional): invitado por el creador, puede apoyar la gestión del evento.
- ADMINISTRADOR: puede moderar eventos y usuarios.

## Permisos

| Acción                          | USUARIO (creador) | COORGANIZADOR | ADMINISTRADOR |
|---------------------------------|-------------------|---------------|---------------|
| Crear evento                     | Sí                | No            | No            |
| Editar evento                    | Sí                | Sí            | No            |
| Publicar evento                  | Sí                | Sí (opcional) | No            |
| Cancelar evento                  | Sí                | Sí (opcional) | Sí (opcional) |
| Archivar evento                  | Sí                | Sí (opcional) | Sí (opcional) |
| Eliminar evento (borrado lógico) | Sí                | No            | Sí            |
| Ver asistentes                   | Sí                | Sí            | Sí            |
| Moderar eventos globales         | No                | No            | Sí            |

## Reglas recomendadas (best practices)
- Eliminar evento: preferible solo creador y admin (borrado lógico).
- Cancelar en vez de borrar: conserva trazabilidad y mejora UX.
- Eventos públicos visibles solo si: visibilidad=PUBLIC y estado=PUBLISHED y deleted_at=NULL.
