-- Opción 2: Unicidad de DUI solo para pacientes activos (estado <> '0')
-- Requisitos: MySQL/MariaDB con columnas generadas STORED (MySQL 5.7.9+ o MySQL 8+)

-- 1) (Opcional) Verificar duplicados actuales entre pacientes ACTIVOS antes de crear el índice
--    Si esta consulta devuelve filas, resuélvelas manualmente (cambiar DUI o dar de baja alguno)
-- SELECT dui, COUNT(*) AS n
-- FROM paciente
-- WHERE dui IS NOT NULL AND estado <> '0'
-- GROUP BY dui
-- HAVING COUNT(*) > 1;

START TRANSACTION;

-- 2) Agregar columna generada que solo toma el DUI cuando el paciente está ACTIVO (estado <> '0'); en caso contrario, es NULL
--    NOTA: Usamos STORED para poder indexarla de forma fiable
ALTER TABLE paciente
  ADD COLUMN dui_activo VARCHAR(20)
  GENERATED ALWAYS AS (CASE WHEN estado <> '0' THEN dui ELSE NULL END) STORED;

-- 3) Crear índice único sobre la columna generada. Esto fuerza que no se repita un DUI entre activos,
--    pero permite el mismo DUI si el registro previo quedó con estado = '0'
ALTER TABLE paciente
  ADD UNIQUE INDEX uq_paciente_dui_activo (dui_activo);

COMMIT;

-- 4) (Opcional) Verificación post-migración: esta consulta debería devolver 0 filas
-- SELECT dui_activo, COUNT(*) AS n FROM paciente GROUP BY dui_activo HAVING dui_activo IS NOT NULL AND COUNT(*) > 1;

-- ROLLBACK PLAN (si necesitas revertir):
-- START TRANSACTION;
-- ALTER TABLE paciente DROP INDEX uq_paciente_dui_activo;
-- ALTER TABLE paciente DROP COLUMN dui_activo;
-- COMMIT;
