-- =============================================
-- MIGRACIÓN: Sistema de Check-in con QR
-- Ejecutar en PostgreSQL
-- =============================================

-- Agregar campos para check-in QR a la tabla participants
ALTER TABLE participants
ADD COLUMN IF NOT EXISTS checkin_token VARCHAR(64) UNIQUE;

ALTER TABLE participants
ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMP;

-- Crear índice para búsqueda rápida por token
CREATE INDEX IF NOT EXISTS idx_participants_checkin_token
ON participants(checkin_token);

-- Generar tokens para participantes existentes (opcional)
-- UPDATE participants
-- SET checkin_token = encode(gen_random_bytes(32), 'base64')
-- WHERE checkin_token IS NULL;

-- Verificación
SELECT 'Migración completada. Nuevos campos agregados a participants:' as status;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'participants'
AND column_name IN ('checkin_token', 'checked_in_at');
