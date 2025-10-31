# Diagramas UML - Sistema de Gestión de Eventos Comunitarios

Este directorio contiene los diagramas UML en formato PlantUML para documentar el sistema de gestión de eventos comunitarios **Azuevento**.

## Herramientas para Visualización

### Opciones para renderizar los diagramas:

1. **PlantUML Online Server**: https://www.plantuml.com/plantuml/uml/
2. **VS Code Extension**: "PlantUML" por jebbs
3. **IntelliJ IDEA Plugin**: PlantUML integration
4. **Línea de comandos**: `java -jar plantuml.jar diagrama.puml`

## Índice de Diagramas

### Diagramas Estructurales

| Archivo | Descripción | Tipo UML |
|---------|-------------|----------|
| `01_casos_de_uso_general.puml` | Casos de uso del sistema completo | Use Case Diagram |
| `11_arquitectura_sistema.puml` | Arquitectura de capas del sistema | Component Diagram |
| `12_modelo_entidad_relacion.puml` | Modelo de base de datos | ERD |

### Diagramas de Comportamiento

| Archivo | Descripción | Tipo UML |
|---------|-------------|----------|
| `02_flujo_autenticacion.puml` | Proceso de login y registro | Activity Diagram |
| `03_flujo_gestion_eventos.puml` | CRUD y ciclo de vida de eventos | Activity Diagram |
| `04_estados_evento.puml` | Estados del evento (DRAFT→PUBLISHED→...) | State Machine Diagram |
| `05_flujo_participacion.puml` | Registro de asistencia a eventos | Activity Diagram |
| `06_flujo_checkin_qr.puml` | Sistema de check-in con código QR | Activity Diagram |
| `07_flujo_interaccion_social.puml` | Favoritos, comentarios, valoraciones | Activity Diagram |
| `08_flujo_exploracion.puml` | Búsqueda y descubrimiento de eventos | Activity Diagram |
| `13_flujo_gestion_perfil.puml` | Edición de perfil y contraseña | Activity Diagram |
| `14_navegacion_app.puml` | Estructura de navegación de la app | State Diagram |

### Diagramas de Interacción

| Archivo | Descripción | Tipo UML |
|---------|-------------|----------|
| `09_secuencia_registro_asistencia.puml` | Flujo API de inscripción | Sequence Diagram |
| `10_secuencia_checkin.puml` | Flujo API de check-in QR | Sequence Diagram |
| `15_secuencia_autenticacion.puml` | Flujo API de autenticación JWT | Sequence Diagram |

## Convenciones Utilizadas

### Colores
- **#LightYellow**: Procesos de gestión/edición
- **#LightBlue**: Procesos de consulta/visualización
- **#LightGreen**: Procesos exitosos/confirmación
- **#LightPink**: Acciones de compartir/social
- **#Orange**: Advertencias
- **#Red**: Errores

### Nomenclatura
- **RF-XX**: Requerimiento Funcional
- **UC-XX**: Caso de Uso
- **PK**: Primary Key
- **FK**: Foreign Key

## Generación de Imágenes

### Comando para generar todas las imágenes PNG:

```bash
# Requiere Java y plantuml.jar
java -jar plantuml.jar -tpng *.puml

# Para SVG (recomendado para artículos)
java -jar plantuml.jar -tsvg *.puml

# Para PDF
java -jar plantuml.jar -tpdf *.puml
```

### Usando Docker:

```bash
docker run -v $(pwd):/data plantuml/plantuml -tpng /data/*.puml
```

## Correspondencia con Requerimientos

| Diagrama | Requerimientos Cubiertos |
|----------|-------------------------|
| Autenticación | RF-01, RF-02, RF-25 |
| Gestión de Eventos | RF-04, RF-05, RF-06, RF-07, RF-08 |
| Estados de Evento | RF-09, RF-10, RF-11 |
| Exploración | RF-12, RF-13, RF-14, RF-15, RF-16 |
| Participación | RF-18, RF-19, RF-20 |
| Check-in QR | RF-21, RF-22, RF-23 |
| Interacción Social | RF-17, RF-19, RF-20, RF-24 |
| Perfil | RF-03, RF-25 |

## Notas para Artículo Científico

1. **Formato recomendado**: SVG o PDF para máxima calidad
2. **Resolución**: Los diagramas PlantUML escalan sin pérdida de calidad
3. **Nomenclatura IEEE**: Los diagramas siguen convenciones UML 2.0
4. **Citas**: PlantUML puede citarse como herramienta de modelado

## Autor

Generado para el proyecto de tesis: *Prototipo móvil para la gestión de actividades y eventos comunitarios en Cuenca, Ecuador*

---

*Última actualización: Febrero 2026*
