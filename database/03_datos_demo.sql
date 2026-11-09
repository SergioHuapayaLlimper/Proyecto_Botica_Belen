SET NAMES utf8mb4;
-- Ajustes de demostración para la versión Angular + Node (no cambia la estructura).
USE botica_belen_db;

-- Los antibióticos se venden con receta: no aparecen en el catálogo público.
UPDATE producto SET requiere_receta = 1
WHERE nombreProducto LIKE 'Amoxicilina%' OR nombreProducto LIKE 'Azitromicina%';

-- Ubicación en anaquel según la categoría (Estante A, B, C...).
UPDATE producto SET ubicacionAnaquel = CONCAT('Estante ', CHAR(64 + idCategoria), '-', LPAD(MOD(idProducto, 12) + 1, 2, '0'))
WHERE ubicacionAnaquel IS NULL OR ubicacionAnaquel = '';
