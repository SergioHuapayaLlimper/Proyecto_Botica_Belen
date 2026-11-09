SET NAMES utf8mb4;
-- ============================================================
--  Botica Belén — Farmacia & Salud
--  Base de datos del sistema de gestión
-- ============================================================

DROP DATABASE IF EXISTS botica_belen_db;
CREATE DATABASE IF NOT EXISTS botica_belen_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE botica_belen_db;

-- -----------------------------------------------------
-- Tabla: usuario (Maneja Administradores y Clientes)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS usuario (
  idUsuario INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  telefono VARCHAR(20) NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  passwordHash VARCHAR(255) NOT NULL,
  rol ENUM('Admin', 'Empleado', 'Cliente') NOT NULL DEFAULT 'Cliente',
  carrito_json TEXT NULL,
  estado INT NOT NULL DEFAULT 1,
  intentos_fallidos INT NOT NULL DEFAULT 0,
  PRIMARY KEY (idUsuario)
);

-- -----------------------------------------------------
-- Tabla: categoria
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS categoria (
  idCategoria INT NOT NULL AUTO_INCREMENT,
  nombreCategoria VARCHAR(100) NOT NULL,
  estadoCategoria VARCHAR(20) NOT NULL DEFAULT 'Activo',
  PRIMARY KEY (idCategoria)
);

-- -----------------------------------------------------
-- Tabla: producto
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS producto (
  idProducto INT NOT NULL AUTO_INCREMENT,
  idCategoria INT NULL,
  codigoProducto VARCHAR(20) UNIQUE NOT NULL,
  nombreProducto VARCHAR(100) NOT NULL,
  descripcionProducto TEXT NULL,
  precioProducto DECIMAL(10,2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  estadoProducto VARCHAR(20) NOT NULL DEFAULT 'Activo',
  requiere_receta BOOLEAN NOT NULL DEFAULT FALSE,
  imagenURL VARCHAR(255) NULL,
  ubicacionAnaquel VARCHAR(50) NULL,
  PRIMARY KEY (idProducto),
  FOREIGN KEY (idCategoria) REFERENCES categoria (idCategoria)
);

-- -----------------------------------------------------
-- Tabla: pedido
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS pedido (
  idPedido INT NOT NULL AUTO_INCREMENT,
  codigoPedido VARCHAR(20) UNIQUE NOT NULL,
  idUsuario INT NOT NULL, -- Referencia al cliente
  fechaHoraToma DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estadoPedido ENUM('Pendiente', 'Aceptado', 'Rechazado', 'En preparación', 'Listo para entregar', 'Entregado', 'Cancelado') NOT NULL DEFAULT 'Pendiente',
  metodoPago VARCHAR(50) NULL,
  observaciones TEXT NULL,
  subtotalGeneral DECIMAL(10,2) NOT NULL,
  igv DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (idPedido),
  FOREIGN KEY (idUsuario) REFERENCES usuario (idUsuario)
);

-- -----------------------------------------------------
-- Tabla: detalle_pedido
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS detalle_pedido (
  idDetallePedido INT NOT NULL AUTO_INCREMENT,
  idPedido INT NOT NULL,
  idProducto INT NOT NULL,
  cantidad INT NOT NULL,
  precioUnitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (idDetallePedido),
  FOREIGN KEY (idPedido) REFERENCES pedido (idPedido) ON DELETE CASCADE,
  FOREIGN KEY (idProducto) REFERENCES producto (idProducto)
);


-- ============================================================
-- DATOS DE EJEMPLO — Botica Belén
-- ============================================================

-- Usuarios: 1 Administrador, 2 Empleados, 2 Clientes (Contraseña: admin123)
-- El hash generado corresponde a 'admin123' usando password_hash en PHP.
INSERT INTO usuario (nombre, telefono, email, passwordHash, rol, estado) VALUES
('Administrador Principal', '999888777', 'admin@botica.com', '$2y$10$qvaiYaXUYtJ7LVcdOLvTQubVyceKkM6WLNrxmOBDkkxpR7eFbC3o6', 'Admin', 1),
('Empleado Uno', '999888111', 'empleado1@botica.com', '$2y$10$qvaiYaXUYtJ7LVcdOLvTQubVyceKkM6WLNrxmOBDkkxpR7eFbC3o6', 'Empleado', 1),
('Empleado Dos', '999888222', 'empleado2@botica.com', '$2y$10$qvaiYaXUYtJ7LVcdOLvTQubVyceKkM6WLNrxmOBDkkxpR7eFbC3o6', 'Empleado', 1),
('Juan Pérez', '987654321', 'juan.perez@gmail.com', '$2y$10$qvaiYaXUYtJ7LVcdOLvTQubVyceKkM6WLNrxmOBDkkxpR7eFbC3o6', 'Cliente', 1),
('Rosa Mamani', '976543210', 'rosa.mamani@hotmail.com', '$2y$10$qvaiYaXUYtJ7LVcdOLvTQubVyceKkM6WLNrxmOBDkkxpR7eFbC3o6', 'Cliente', 1);

-- Categorías
INSERT INTO categoria (nombreCategoria, estadoCategoria) VALUES
('Medicamentos Generales', 'Activo'),
('Cuidado Personal', 'Activo'),
('Vitaminas y Suplementos', 'Activo'),
('Primeros Auxilios', 'Activo'),
('Bebés y Maternidad', 'Activo'),
('Higiene Bucal', 'Activo');

-- Productos
INSERT INTO producto (idCategoria, codigoProducto, nombreProducto, descripcionProducto, precioProducto, stock, estadoProducto, requiere_receta, imagenURL, ubicacionAnaquel) VALUES
(1, 'MED-001', 'Paracetamol 500mg (Caja x 100 tab)', 'Analgésico y antipirético indicado para el alivio sintomático del dolor ocasional leve o moderado.', 12.50, 50, 'Activo', FALSE, 'https://cdn-icons-png.flaticon.com/512/883/883382.png', 'Estante A1'),
(1, 'MED-002', 'Ibuprofeno 400mg (Caja x 20 tab)', 'Antiinflamatorio no esteroideo (AINE) utilizado para aliviar el dolor, la fiebre y la inflamación.', 8.00, 30, 'Activo', FALSE, 'https://cdn-icons-png.flaticon.com/512/883/883382.png', 'Estante A1'),
(1, 'MED-003', 'Amoxicilina 500mg (Caja x 50 tab)', 'Antibiótico de amplio espectro para el tratamiento de infecciones bacterianas. (Venta bajo receta).', 25.00, 15, 'Activo', TRUE, 'https://cdn-icons-png.flaticon.com/512/883/883382.png', 'Estante B2'),
(2, 'CUI-001', 'Shampoo Anticaspa Head & Shoulders 400ml', 'Shampoo para limpieza profunda y control de caspa.', 18.50, 40, 'Activo', FALSE, 'https://cdn-icons-png.flaticon.com/512/883/883401.png', 'Góndola 1'),
(2, 'CUI-002', 'Crema Hidratante Nivea 200ml', 'Crema corporal de hidratación intensiva.', 22.00, 25, 'Activo', FALSE, 'https://cdn-icons-png.flaticon.com/512/883/883401.png', 'Góndola 1'),
(3, 'VIT-001', 'Vitamina C 1000mg (Frasco x 100 tab)', 'Suplemento vitamínico para fortalecer el sistema inmunológico.', 35.00, 8, 'Activo', FALSE, 'https://cdn-icons-png.flaticon.com/512/883/883363.png', 'Estante C1'), -- Bajo stock
(3, 'VIT-002', 'Centrum Silver (Frasco x 30 tab)', 'Multivitamínico para adultos mayores.', 55.00, 12, 'Activo', FALSE, 'https://cdn-icons-png.flaticon.com/512/883/883363.png', 'Estante C1'),
(4, 'PRI-001', 'Alcohol Medicinal 70° 500ml', 'Antiséptico de uso externo.', 5.00, 100, 'Activo', FALSE, 'https://cdn-icons-png.flaticon.com/512/883/883395.png', 'Estante D3'),
(4, 'PRI-002', 'Algodón Hidrófilo 100g', 'Para limpieza y curación de heridas.', 3.50, 60, 'Activo', FALSE, 'https://cdn-icons-png.flaticon.com/512/883/883395.png', 'Estante D3'),
(4, 'PRI-003', 'Gasa Esterilizada 10x10cm (Paquete x 5)', 'Gasa para protección de heridas.', 2.00, 0, 'Activo', FALSE, 'https://cdn-icons-png.flaticon.com/512/883/883395.png', 'Estante D3'), -- Agotado
(5, 'BEB-001', 'Pañales Huggies Etapa 3 (Paquete x 40)', 'Pañales desechables para bebés.', 45.00, 20, 'Activo', FALSE, 'https://cdn-icons-png.flaticon.com/512/883/883377.png', 'Góndola 2'),
(5, 'BEB-002', 'Crema Cero 50g', 'Crema protectora contra escaldaduras.', 15.00, 35, 'Activo', FALSE, 'https://cdn-icons-png.flaticon.com/512/883/883377.png', 'Góndola 2'),
(6, 'HIG-001', 'Pasta Dental Colgate Total 12 150g', 'Crema dental con protección antibacterial.', 9.50, 45, 'Activo', FALSE, 'https://cdn-icons-png.flaticon.com/512/883/883401.png', 'Góndola 3'),
(6, 'HIG-002', 'Enjuague Bucal Listerine 500ml', 'Enjuague bucal antiséptico.', 16.00, 28, 'Activo', FALSE, 'https://cdn-icons-png.flaticon.com/512/883/883401.png', 'Góndola 3');

-- ============================================================
-- PEDIDOS DE PRUEBA (Diferentes meses y estados)
-- ============================================================
INSERT INTO pedido (codigoPedido, idUsuario, fechaHoraToma, estadoPedido, metodoPago, observaciones, subtotalGeneral, igv, total) VALUES
('PED-2026-0001', 4, '2026-01-15 10:30:00', 'Entregado', 'Yape', 'Paso a recoger en la tarde', 42.37, 7.63, 50.00),
('PED-2026-0002', 5, '2026-02-20 14:15:00', 'Cancelado', 'Plin', 'Cancelado por demora', 21.19, 3.81, 25.00),
('PED-2026-0003', 4, '2026-03-10 09:45:00', 'Entregado', 'Efectivo', 'Pago exacto', 84.75, 15.25, 100.00),
('PED-2026-0004', 5, '2026-04-05 16:20:00', 'Pendiente', 'Tarjeta', 'Avisar cuando esté listo', 15.25, 2.75, 18.00),
('PED-2026-0005', 4, '2026-05-12 11:00:00', 'Entregado', 'Yape', '', 29.66, 5.34, 35.00),
('PED-2026-0006', 5, '2026-06-18 13:10:00', 'En preparación', 'Plin', '', 67.80, 12.20, 80.00),
('PED-2026-0007', 4, '2026-07-22 17:30:00', 'Cancelado', 'Tarjeta', 'Sin stock', 55.08, 9.92, 65.00),
('PED-2026-0008', 5, '2026-08-30 08:50:00', 'Entregado', 'Efectivo', '', 110.17, 19.83, 130.00),
('PED-2026-0009', 4, '2026-09-20 12:40:00', 'Entregado', 'Yape', '', 38.14, 6.86, 45.00),
('PED-2026-0010', 5, '2026-09-21 15:00:00', 'Pendiente', 'Plin', 'Urgente', 12.71, 2.29, 15.00);

-- Detalle de Pedidos
INSERT INTO detalle_pedido (idPedido, idProducto, cantidad, precioUnitario, subtotal) VALUES
(1, 1, 4, 12.50, 50.00),
(2, 3, 1, 25.00, 25.00),
(3, 14, 2, 9.50, 19.00), 
(3, 5, 2, 40.50, 81.00),
(4, 8, 1, 18.00, 18.00),
(5, 5, 1, 35.00, 35.00),
(6, 4, 4, 20.00, 80.00),
(7, 2, 5, 13.00, 65.00),
(8, 11, 2, 65.00, 130.00),
(9, 12, 1, 45.00, 45.00),
(10, 13, 1, 15.00, 15.00);
