-- =============================================
-- DATOS DE DEMOSTRACIÓN PARA AZUEVENTO
-- Ejecutar en PostgreSQL después de las tablas
-- =============================================

-- Limpiar datos demo anteriores (no afecta tus cuentas personales)
DELETE FROM favorites WHERE user_id >= 100 OR event_id >= 100;
DELETE FROM ratings WHERE user_id >= 100 OR event_id >= 100;
DELETE FROM comments WHERE user_id >= 100 OR event_id >= 100;
DELETE FROM participants WHERE user_id >= 100 OR event_id >= 100;
DELETE FROM events WHERE id >= 100;
DELETE FROM users WHERE id >= 100;

-- =============================================
-- USUARIOS DEMO (password para todos: "password123")
-- IDs 100-107 para no conflictar con usuarios existentes
-- =============================================
INSERT INTO users (id, name, email, password_hash, phone, description, role, active, registration_date)
OVERRIDING SYSTEM VALUE VALUES
(100, 'María García López', 'maria.garcia@demo.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '0987654321', 'Amante de la cultura y el arte cuencano', 'USER', true, CURRENT_TIMESTAMP - INTERVAL '30 days'),
(101, 'Carlos Mendoza Rivera', 'carlos.mendoza@demo.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '0991234567', 'Deportista y organizador de eventos comunitarios', 'USER', true, CURRENT_TIMESTAMP - INTERVAL '25 days'),
(102, 'Ana Lucía Córdova', 'ana.cordova@demo.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '0998765432', 'Profesora universitaria interesada en tecnología', 'USER', true, CURRENT_TIMESTAMP - INTERVAL '20 days'),
(103, 'José Fernando Vega', 'jose.vega@demo.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '0976543210', 'Chef y emprendedor gastronómico', 'USER', true, CURRENT_TIMESTAMP - INTERVAL '18 days'),
(104, 'Sofía Valentina Rojas', 'sofia.rojas@demo.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '0965432109', 'Músico profesional y gestora cultural', 'USER', true, CURRENT_TIMESTAMP - INTERVAL '15 days'),
(105, 'Diego Alejandro Paz', 'diego.paz@demo.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '0954321098', 'Estudiante de ingeniería ambiental', 'USER', true, CURRENT_TIMESTAMP - INTERVAL '12 days'),
(106, 'Gabriela Torres Mejía', 'gabriela.torres@demo.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '0943210987', 'Voluntaria en causas sociales', 'USER', true, CURRENT_TIMESTAMP - INTERVAL '10 days'),
(107, 'Roberto Sánchez Luna', 'roberto.sanchez@demo.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '0932109876', 'Fotógrafo y amante de la naturaleza', 'USER', true, CURRENT_TIMESTAMP - INTERVAL '7 days')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- EVENTOS EN CUENCA (con coordenadas reales)
-- IDs 100-109 para no conflictar con eventos existentes
-- =============================================

INSERT INTO events (id, title, description, category_id, organizer_id, start_date, end_date, location, latitude, longitude, max_capacity, visibility, status, cover_image, created_at, updated_at)
OVERRIDING SYSTEM VALUE VALUES
-- Evento 100: Deportes - Parque de la Madre
(100, 'Maratón 5K Cuenca Solidaria',
'Gran maratón solidaria por las calles del centro histórico de Cuenca. Los fondos recaudados serán destinados a la fundación de niños huérfanos. Incluye hidratación, medalla de participación y camiseta oficial del evento.',
1, 101, CURRENT_TIMESTAMP + INTERVAL '3 days' + TIME '07:00:00', CURRENT_TIMESTAMP + INTERVAL '3 days' + TIME '11:00:00',
'Parque de la Madre, Cuenca', -2.9055, -79.0045, 200, 'PUBLIC', 'PUBLISHED',
'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=800', CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP - INTERVAL '5 days'),

-- Evento 101: Cultura - Plaza San Francisco
(101, 'Festival de Artes Vivas 2025',
'Festival cultural con presentaciones de danza, teatro y música en vivo. Artistas locales e internacionales se reúnen para celebrar la diversidad cultural de nuestra ciudad. Entrada gratuita para toda la familia.',
2, 100, CURRENT_TIMESTAMP + INTERVAL '5 days' + TIME '16:00:00', CURRENT_TIMESTAMP + INTERVAL '5 days' + TIME '22:00:00',
'Plaza San Francisco, Centro Histórico', -2.8973, -79.0041, 500, 'PUBLIC', 'PUBLISHED',
'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800', CURRENT_TIMESTAMP - INTERVAL '7 days', CURRENT_TIMESTAMP - INTERVAL '7 days'),

-- Evento 102: Educación - Universidad de Cuenca
(102, 'Taller de Inteligencia Artificial para Principiantes',
'Aprende los fundamentos de la inteligencia artificial y el machine learning. Taller práctico donde construirás tu primer modelo de IA. No requiere conocimientos previos de programación. Certificado de participación incluido.',
3, 102, CURRENT_TIMESTAMP + INTERVAL '7 days' + TIME '09:00:00', CURRENT_TIMESTAMP + INTERVAL '7 days' + TIME '13:00:00',
'Universidad de Cuenca - Facultad de Ingeniería', -2.9001, -79.0103, 40, 'PUBLIC', 'PUBLISHED',
'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800', CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP - INTERVAL '10 days'),

-- Evento 103: Tecnología - Mall del Río
(103, 'Hackathon Cuenca Tech 2025',
'48 horas de innovación tecnológica. Forma tu equipo y desarrolla soluciones para problemas reales de nuestra comunidad. Premios en efectivo para los tres primeros lugares. Comida y bebidas incluidas durante todo el evento.',
4, 102, CURRENT_TIMESTAMP + INTERVAL '14 days' + TIME '08:00:00', CURRENT_TIMESTAMP + INTERVAL '16 days' + TIME '20:00:00',
'Centro de Convenciones Mall del Río', -2.9234, -79.0089, 100, 'PUBLIC', 'PUBLISHED',
'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800', CURRENT_TIMESTAMP - INTERVAL '14 days', CURRENT_TIMESTAMP - INTERVAL '14 days'),

-- Evento 104: Gastronomía - Mercado 10 de Agosto
(104, 'Ruta Gastronómica del Cuy',
'Descubre los secretos de la preparación tradicional del cuy cuencano. Visita a los mejores restaurantes de comida típica con degustación incluida. Guía especializado en gastronomía ecuatoriana.',
5, 103, CURRENT_TIMESTAMP + INTERVAL '4 days' + TIME '12:00:00', CURRENT_TIMESTAMP + INTERVAL '4 days' + TIME '16:00:00',
'Mercado 10 de Agosto', -2.8989, -79.0056, 25, 'PUBLIC', 'PUBLISHED',
'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800', CURRENT_TIMESTAMP - INTERVAL '6 days', CURRENT_TIMESTAMP - INTERVAL '6 days'),

-- Evento 105: Música - Parque Calderón
(105, 'Concierto Sinfónico Bajo las Estrellas',
'La Orquesta Sinfónica de Cuenca presenta una noche mágica de música clásica al aire libre. Programa: Beethoven, Mozart y compositores ecuatorianos. Lleva tu manta y disfruta de la música bajo el cielo cuencano.',
6, 104, CURRENT_TIMESTAMP + INTERVAL '10 days' + TIME '19:00:00', CURRENT_TIMESTAMP + INTERVAL '10 days' + TIME '22:00:00',
'Parque Calderón, Centro Histórico', -2.8974, -79.0042, 1000, 'PUBLIC', 'PUBLISHED',
'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=800', CURRENT_TIMESTAMP - INTERVAL '12 days', CURRENT_TIMESTAMP - INTERVAL '12 days'),

-- Evento 106: Naturaleza - Cajas
(106, 'Caminata Ecológica al Parque Nacional Cajas',
'Excursión guiada por los senderos del Parque Nacional Cajas. Observación de flora y fauna endémica. Incluye transporte, guía naturalista y refrigerio. Dificultad media, apto para principiantes con buena condición física.',
7, 105, CURRENT_TIMESTAMP + INTERVAL '8 days' + TIME '06:00:00', CURRENT_TIMESTAMP + INTERVAL '8 days' + TIME '17:00:00',
'Parque Nacional Cajas - Laguna Toreadora', -2.7833, -79.2333, 30, 'PUBLIC', 'PUBLISHED',
'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=800', CURRENT_TIMESTAMP - INTERVAL '8 days', CURRENT_TIMESTAMP - INTERVAL '8 days'),

-- Evento 107: Social - Turi
(107, 'Networking Emprendedores Cuenca',
'Conecta con otros emprendedores de la ciudad. Comparte experiencias, encuentra socios y colaboradores. Presentaciones de 3 minutos para mostrar tu emprendimiento. Cóctel de bienvenida incluido.',
8, 106, CURRENT_TIMESTAMP + INTERVAL '6 days' + TIME '18:00:00', CURRENT_TIMESTAMP + INTERVAL '6 days' + TIME '21:00:00',
'Mirador de Turi', -2.9167, -79.0000, 60, 'PUBLIC', 'PUBLISHED',
'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800', CURRENT_TIMESTAMP - INTERVAL '4 days', CURRENT_TIMESTAMP - INTERVAL '4 days'),

-- Evento 108: Deportes - Estadio
(108, 'Torneo Relámpago de Fútbol 7',
'Torneo de fútbol 7 para equipos amateur. Inscripción por equipo, mínimo 8 jugadores. Premiación para primer, segundo y tercer lugar. Arbitraje profesional y canchas de césped sintético.',
1, 101, CURRENT_TIMESTAMP + INTERVAL '12 days' + TIME '08:00:00', CURRENT_TIMESTAMP + INTERVAL '12 days' + TIME '18:00:00',
'Complejo Deportivo Totoracocha', -2.8917, -78.9833, 128, 'PUBLIC', 'PUBLISHED',
'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800', CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '3 days'),

-- Evento 109: Cultura - Museo Pumapungo
(109, 'Noche de Museos: Historia Cañari',
'Recorrido nocturno especial por las salas del Museo Pumapungo. Aprende sobre la cultura Cañari con guías especializados. Incluye representación teatral y degustación de chicha tradicional.',
2, 100, CURRENT_TIMESTAMP + INTERVAL '9 days' + TIME '19:00:00', CURRENT_TIMESTAMP + INTERVAL '9 days' + TIME '22:00:00',
'Museo Pumapungo', -2.9078, -78.9964, 80, 'PUBLIC', 'PUBLISHED',
'https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?w=800', CURRENT_TIMESTAMP - INTERVAL '9 days', CURRENT_TIMESTAMP - INTERVAL '9 days')

ON CONFLICT (id) DO NOTHING;

-- =============================================
-- PARTICIPANTES (registros a eventos)
-- =============================================
INSERT INTO participants (event_id, user_id, attendance_status, registration_date) VALUES
-- Maratón (event 100)
(100, 100, 'CONFIRMED', CURRENT_TIMESTAMP - INTERVAL '2 days'),
(100, 102, 'CONFIRMED', CURRENT_TIMESTAMP - INTERVAL '2 days'),
(100, 105, 'CONFIRMED', CURRENT_TIMESTAMP - INTERVAL '1 day'),
(100, 107, 'CONFIRMED', CURRENT_TIMESTAMP - INTERVAL '1 day'),
-- Festival Artes (event 101)
(101, 101, 'CONFIRMED', CURRENT_TIMESTAMP - INTERVAL '3 days'),
(101, 103, 'CONFIRMED', CURRENT_TIMESTAMP - INTERVAL '3 days'),
(101, 104, 'CONFIRMED', CURRENT_TIMESTAMP - INTERVAL '2 days'),
(101, 106, 'CONFIRMED', CURRENT_TIMESTAMP - INTERVAL '2 days'),
(101, 107, 'CONFIRMED', CURRENT_TIMESTAMP - INTERVAL '1 day'),
-- Taller IA (event 102)
(102, 100, 'CONFIRMED', CURRENT_TIMESTAMP - INTERVAL '4 days'),
(102, 101, 'CONFIRMED', CURRENT_TIMESTAMP - INTERVAL '3 days'),
(102, 105, 'CONFIRMED', CURRENT_TIMESTAMP - INTERVAL '2 days'),
-- Hackathon (event 103)
(103, 100, 'CONFIRMED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
(103, 105, 'CONFIRMED', CURRENT_TIMESTAMP - INTERVAL '4 days'),
-- Ruta Gastronómica (event 104)
(104, 100, 'CONFIRMED', CURRENT_TIMESTAMP - INTERVAL '3 days'),
(104, 101, 'CONFIRMED', CURRENT_TIMESTAMP - INTERVAL '2 days'),
(104, 102, 'CONFIRMED', CURRENT_TIMESTAMP - INTERVAL '2 days'),
(104, 106, 'CONFIRMED', CURRENT_TIMESTAMP - INTERVAL '1 day'),
-- Concierto (event 105)
(105, 100, 'CONFIRMED', CURRENT_TIMESTAMP - INTERVAL '6 days'),
(105, 101, 'CONFIRMED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
(105, 102, 'CONFIRMED', CURRENT_TIMESTAMP - INTERVAL '4 days'),
(105, 103, 'CONFIRMED', CURRENT_TIMESTAMP - INTERVAL '3 days'),
(105, 106, 'CONFIRMED', CURRENT_TIMESTAMP - INTERVAL '2 days'),
(105, 107, 'CONFIRMED', CURRENT_TIMESTAMP - INTERVAL '1 day'),
-- Caminata (event 106)
(106, 100, 'CONFIRMED', CURRENT_TIMESTAMP - INTERVAL '4 days'),
(106, 101, 'CONFIRMED', CURRENT_TIMESTAMP - INTERVAL '3 days'),
(106, 107, 'CONFIRMED', CURRENT_TIMESTAMP - INTERVAL '2 days'),
-- Networking (event 107)
(107, 100, 'CONFIRMED', CURRENT_TIMESTAMP - INTERVAL '2 days'),
(107, 102, 'CONFIRMED', CURRENT_TIMESTAMP - INTERVAL '2 days'),
(107, 103, 'CONFIRMED', CURRENT_TIMESTAMP - INTERVAL '1 day'),
-- Torneo Fútbol (event 108)
(108, 105, 'CONFIRMED', CURRENT_TIMESTAMP - INTERVAL '1 day'),
(108, 107, 'CONFIRMED', CURRENT_TIMESTAMP - INTERVAL '1 day'),
-- Noche Museos (event 109)
(109, 100, 'CONFIRMED', CURRENT_TIMESTAMP - INTERVAL '3 days'),
(109, 102, 'CONFIRMED', CURRENT_TIMESTAMP - INTERVAL '2 days'),
(109, 104, 'CONFIRMED', CURRENT_TIMESTAMP - INTERVAL '2 days'),
(109, 106, 'CONFIRMED', CURRENT_TIMESTAMP - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

-- =============================================
-- COMENTARIOS
-- =============================================
INSERT INTO comments (event_id, user_id, content, created_at, updated_at) VALUES
-- Maratón (event 100)
(100, 100, 'Ya estoy entrenando para esta maratón. Será mi primera carrera oficial.', CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '2 days'),
(100, 102, 'Excelente iniciativa solidaria. Cuenten conmigo.', CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '1 day'),
-- Festival (event 101)
(101, 104, 'Como músico local, me emociona ver este tipo de eventos culturales en nuestra ciudad.', CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '3 days'),
(101, 106, 'Llevaré a toda mi familia. Habrá actividades para niños?', CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '2 days'),
(101, 101, 'El año pasado fue increíble, este año será mejor!', CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '1 day'),
-- Taller IA (event 102)
(102, 105, 'Es necesario llevar laptop propia o habrá equipos disponibles?', CURRENT_TIMESTAMP - INTERVAL '4 days', CURRENT_TIMESTAMP - INTERVAL '4 days'),
(102, 102, 'Habrá equipos disponibles pero si tienes laptop tráela para practicar en casa después.', CURRENT_TIMESTAMP - INTERVAL '4 days', CURRENT_TIMESTAMP - INTERVAL '4 days'),
-- Ruta Gastronómica (event 104)
(104, 106, 'Me encanta la comida típica cuencana. El cuy es lo mejor!', CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '1 day'),
(104, 101, 'Incluye la visita al mercado 9 de Octubre también?', CURRENT_TIMESTAMP - INTERVAL '12 hours', CURRENT_TIMESTAMP - INTERVAL '12 hours'),
-- Concierto (event 105)
(105, 103, 'Beethoven bajo las estrellas... no hay nada mejor. Ya tengo mi manta lista.', CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP - INTERVAL '5 days'),
(105, 107, 'Se puede llevar comida y bebida?', CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '3 days'),
(105, 104, 'Sí se puede, es al aire libre. Solo no vidrio por seguridad.', CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '3 days'),
-- Caminata (event 106)
(106, 107, 'He ido varias veces al Cajas pero nunca con guía. Será interesante aprender más.', CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '2 days'),
(106, 101, 'Qué ropa recomiendan llevar? Escuché que hace mucho frío.', CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '1 day'),
(106, 105, 'Lleva ropa en capas, impermeable y buen calzado. El clima cambia rápido allá.', CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '1 day'),
-- Networking (event 107)
(107, 103, 'Perfecto para presentar mi nuevo emprendimiento gastronómico!', CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '3 days'),
(107, 102, 'Busco socios para un proyecto de tecnología educativa. Alguien interesado?', CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '2 days')
ON CONFLICT DO NOTHING;

-- =============================================
-- FAVORITOS
-- =============================================
INSERT INTO favorites (event_id, user_id, created_at) VALUES
-- María
(100, 100, CURRENT_TIMESTAMP - INTERVAL '3 days'),
(101, 100, CURRENT_TIMESTAMP - INTERVAL '3 days'),
(105, 100, CURRENT_TIMESTAMP - INTERVAL '2 days'),
(106, 100, CURRENT_TIMESTAMP - INTERVAL '1 day'),
-- Carlos
(101, 101, CURRENT_TIMESTAMP - INTERVAL '4 days'),
(105, 101, CURRENT_TIMESTAMP - INTERVAL '3 days'),
(108, 101, CURRENT_TIMESTAMP - INTERVAL '1 day'),
-- Ana
(102, 102, CURRENT_TIMESTAMP - INTERVAL '5 days'),
(103, 102, CURRENT_TIMESTAMP - INTERVAL '4 days'),
(107, 102, CURRENT_TIMESTAMP - INTERVAL '2 days'),
-- José
(104, 103, CURRENT_TIMESTAMP - INTERVAL '3 days'),
(107, 103, CURRENT_TIMESTAMP - INTERVAL '2 days'),
-- Sofía
(101, 104, CURRENT_TIMESTAMP - INTERVAL '4 days'),
(105, 104, CURRENT_TIMESTAMP - INTERVAL '3 days'),
(109, 104, CURRENT_TIMESTAMP - INTERVAL '1 day'),
-- Diego
(102, 105, CURRENT_TIMESTAMP - INTERVAL '5 days'),
(103, 105, CURRENT_TIMESTAMP - INTERVAL '4 days'),
(106, 105, CURRENT_TIMESTAMP - INTERVAL '2 days'),
-- Gabriela
(101, 106, CURRENT_TIMESTAMP - INTERVAL '3 days'),
(104, 106, CURRENT_TIMESTAMP - INTERVAL '2 days'),
(107, 106, CURRENT_TIMESTAMP - INTERVAL '1 day'),
-- Roberto
(105, 107, CURRENT_TIMESTAMP - INTERVAL '4 days'),
(106, 107, CURRENT_TIMESTAMP - INTERVAL '3 days'),
(108, 107, CURRENT_TIMESTAMP - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

-- =============================================
-- VERIFICACIÓN
-- =============================================
SELECT 'Usuarios demo creados: ' || COUNT(*) FROM users WHERE id >= 100;
SELECT 'Eventos demo creados: ' || COUNT(*) FROM events WHERE id >= 100 AND status = 'PUBLISHED';
SELECT 'Participantes registrados: ' || COUNT(*) FROM participants WHERE event_id >= 100;
SELECT 'Comentarios agregados: ' || COUNT(*) FROM comments WHERE event_id >= 100;
SELECT 'Favoritos guardados: ' || COUNT(*) FROM favorites WHERE event_id >= 100;
