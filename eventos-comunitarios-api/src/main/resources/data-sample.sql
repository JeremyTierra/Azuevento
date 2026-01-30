-- Script de datos de ejemplo para Azuevento
-- Ejecutar después de que las tablas estén creadas y haya al menos un usuario registrado

-- NOTA: Asegúrate de tener usuarios registrados primero
-- Cambia los user_id según los IDs de tus usuarios existentes

-- Eventos de ejemplo
INSERT INTO events (title, description, category_id, start_date, end_date, location, latitude, longitude, max_capacity, status, organizer_id, created_at, updated_at)
VALUES
-- Evento 1: Concierto de Rock (Publicado, Futuro)
('Concierto de Rock en el Parque', 
'Únete a nosotros para una noche inolvidable de rock en vivo con bandas locales. Entrada gratuita, comida y bebidas disponibles.',
2, -- Música
'2026-02-15 19:00:00',
'2026-02-15 23:00:00',
'Parque El Paraíso, Cuenca',
-2.9001,
-79.0059,
500,
'PUBLISHED',
1, -- Cambiar por un user_id válido
CURRENT_TIMESTAMP,
CURRENT_TIMESTAMP),

-- Evento 2: Maratón 10K (Publicado, Futuro)
('Maratón 10K Cuenca Corre',
'Participa en nuestra carrera anual de 10 kilómetros. Incluye kit de corredor, medalla de finalización y refrigerios. Inscripción: $15.',
1, -- Deportes
'2026-03-05 07:00:00',
'2026-03-05 11:00:00',
'Estadio Alejandro Serrano Aguilar',
-2.8973,
-79.0067,
200,
'PUBLISHED',
1,
CURRENT_TIMESTAMP,
CURRENT_TIMESTAMP),

-- Evento 3: Festival de Comida (Publicado, Próximo)
('Festival Gastronómico de Cuenca',
'Descubre los sabores de Cuenca con más de 30 puestos de comida local e internacional. Música en vivo y actividades para toda la familia.',
5, -- Gastronomía
'2026-02-20 12:00:00',
'2026-02-20 20:00:00',
'Plaza de San Francisco',
-2.8965,
-79.0050,
1000,
'PUBLISHED',
1,
CURRENT_TIMESTAMP,
CURRENT_TIMESTAMP),

-- Evento 4: Taller de Programación (Publicado, Futuro)
('Workshop: Introducción a React Native',
'Aprende a crear aplicaciones móviles con React Native. Trae tu laptop. Nivel: Principiante. Cupos limitados.',
4, -- Tecnología
'2026-02-28 14:00:00',
'2026-02-28 18:00:00',
'Centro de Innovación UC',
-2.8950,
-79.0070,
30,
'PUBLISHED',
1,
CURRENT_TIMESTAMP,
CURRENT_TIMESTAMP),

-- Evento 5: Exposición de Arte (Publicado, En curso)
('Exposición: Arte Contemporáneo Ecuatoriano',
'Exhibición de obras de artistas ecuatorianos emergentes. Entrada gratuita. Horario: Lunes a Sábado 10:00-18:00.',
3, -- Arte y Cultura
'2026-02-01 10:00:00',
'2026-02-28 18:00:00',
'Museo de Arte Moderno',
-2.8980,
-79.0045,
100,
'PUBLISHED',
1,
CURRENT_TIMESTAMP,
CURRENT_TIMESTAMP),

-- Evento 6: Torneo de Fútbol (Borrador)
('Torneo Inter-barrios de Fútbol',
'Torneo amateur de fútbol 7. Equipos de diferentes barrios de Cuenca compiten por el trofeo. Inscripción por equipos.',
1, -- Deportes
'2026-03-20 09:00:00',
'2026-03-20 17:00:00',
'Complejo Deportivo Municipal',
-2.9010,
-79.0065,
150,
'DRAFT',
1,
CURRENT_TIMESTAMP,
CURRENT_TIMESTAMP),

-- Evento 7: Conferencia Tech (Publicado, Futuro)
('Cuenca Tech Summit 2026',
'Conferencia de tecnología con speakers internacionales. Temas: IA, Cloud, Blockchain, Desarrollo móvil. Early bird: $50.',
4, -- Tecnología
'2026-04-10 09:00:00',
'2026-04-10 18:00:00',
'Hotel Oro Verde Convention Center',
-2.8990,
-79.0055,
300,
'PUBLISHED',
1,
CURRENT_TIMESTAMP,
CURRENT_TIMESTAMP);

-- Agregar algunos participantes a eventos (simula asistencia)
-- NOTA: Cambia los user_id por IDs válidos de tu sistema
INSERT INTO participants (user_id, event_id, status, registered_at)
VALUES
(1, 1, 'CONFIRMED', CURRENT_TIMESTAMP),
(1, 2, 'CONFIRMED', CURRENT_TIMESTAMP),
(1, 5, 'CONFIRMED', CURRENT_TIMESTAMP);

-- Agregar algunos comentarios de ejemplo
-- NOTA: Cambia los user_id por IDs válidos
INSERT INTO comments (event_id, user_id, content, created_at)
VALUES
(1, 1, '¡No puedo esperar por este concierto! ¿Alguien sabe qué bandas van a tocar?', CURRENT_TIMESTAMP),
(2, 1, 'Mi primera maratón, estoy super emocionado. ¿Algún consejo para principiantes?', CURRENT_TIMESTAMP),
(5, 1, 'La exposición está increíble, definitivamente vale la pena visitarla.', CURRENT_TIMESTAMP);

-- Agregar algunos ratings de ejemplo
-- NOTA: Cambia los user_id por IDs válidos
INSERT INTO ratings (event_id, user_id, score, created_at)
VALUES
(5, 1, 5, CURRENT_TIMESTAMP);

COMMIT;
