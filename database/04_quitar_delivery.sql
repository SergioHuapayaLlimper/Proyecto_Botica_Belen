SET NAMES utf8mb4;
-- ============================================================
--  Botica Belén — quitar el delivery
--  La botica trabaja solo con recojo en tienda: sin reparto ni dirección de entrega.
--
--  Ejecutar UNA sola vez sobre una base creada con la versión anterior de 01_estructura.sql.
--  Una base nueva creada con 01_estructura.sql actual ya viene sin delivery.
-- ============================================================
USE botica_belen_db;

-- 1. Los pedidos que estuvieran "en camino" quedan listos para recoger en tienda.
UPDATE pedido SET estadoPedido = 'Listo para entregar' WHERE estadoPedido = 'Enviado o en camino';

-- 2. Desaparece el estado "Enviado o en camino".
ALTER TABLE pedido
  MODIFY estadoPedido ENUM('Pendiente', 'Aceptado', 'Rechazado', 'En preparación', 'Listo para entregar', 'Entregado', 'Cancelado') NOT NULL DEFAULT 'Pendiente';

-- 3. Ya no se guarda una dirección de entrega.
ALTER TABLE pedido DROP COLUMN direccionEntrega;

-- 4. Notas de los pedidos de ejemplo que hablaban del reparto.
UPDATE pedido SET observaciones = REPLACE(observaciones, 'Entregar en portería', 'Paso a recoger en la tarde') WHERE codigoPedido = 'PED-2026-0001';
UPDATE pedido SET observaciones = REPLACE(observaciones, 'Llamar al llegar', 'Avisar cuando esté listo') WHERE codigoPedido = 'PED-2026-0004';
