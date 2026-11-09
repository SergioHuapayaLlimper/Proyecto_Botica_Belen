SET NAMES utf8mb4;
-- ============================================================
--  RF02 — Bloqueo TEMPORAL de la cuenta (5 minutos) tras 5 intentos fallidos.
--
--  NO hace falta ejecutarlo a mano: la API Spring Boot lo aplica sola al arrancar
--  (backend-spring/.../config/MigracionesBd.java, migración 001_bloqueo_temporal).
--  Se deja como referencia del cambio. Si lo ejecutas a mano, hazlo UNA sola vez.
-- ============================================================
USE botica_belen_db;

ALTER TABLE usuario ADD COLUMN bloqueado_hasta DATETIME NULL AFTER intentos_fallidos;
UPDATE usuario SET estado = 1, intentos_fallidos = 0 WHERE estado = 0 AND intentos_fallidos >= 5;
