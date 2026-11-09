-- ============================================================
--  Botica Belén: base de datos completa (estructura + datos de prueba)
--  Incluye las migraciones 001-011 ya aplicadas (tabla `migraciones`).
--  Uso local: lo carga docker-init.sh. En la nube (TiDB, etc.): ejecutarlo tal cual.
-- ============================================================
CREATE DATABASE IF NOT EXISTS botica_belen_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE botica_belen_db;


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `carrito_sesion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `carrito_sesion` (
  `idCarrito` int NOT NULL AUTO_INCREMENT,
  `idUsuario` int NOT NULL,
  `iniciadoEn` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `idPedido` int DEFAULT NULL,
  `cerradoEn` datetime DEFAULT NULL,
  PRIMARY KEY (`idCarrito`),
  KEY `fk_carrito_usuario` (`idUsuario`),
  KEY `fk_carrito_pedido` (`idPedido`),
  KEY `ix_carrito_iniciado` (`iniciadoEn`),
  CONSTRAINT `fk_carrito_pedido` FOREIGN KEY (`idPedido`) REFERENCES `pedido` (`idPedido`) ON DELETE SET NULL,
  CONSTRAINT `fk_carrito_usuario` FOREIGN KEY (`idUsuario`) REFERENCES `usuario` (`idUsuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `carrito_sesion` WRITE;
/*!40000 ALTER TABLE `carrito_sesion` DISABLE KEYS */;
/*!40000 ALTER TABLE `carrito_sesion` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `categoria`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categoria` (
  `idCategoria` int NOT NULL AUTO_INCREMENT,
  `nombreCategoria` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `prefijo` varchar(5) COLLATE utf8mb4_unicode_ci NOT NULL,
  `estadoCategoria` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Activo',
  PRIMARY KEY (`idCategoria`),
  UNIQUE KEY `uk_categoria_prefijo` (`prefijo`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `categoria` WRITE;
/*!40000 ALTER TABLE `categoria` DISABLE KEYS */;
INSERT INTO `categoria` VALUES (1,'Medicamentos Generales','MED','Activo'),(2,'Cuidado Personal','CUI','Activo'),(3,'Vitaminas y Suplementos','VIT','Activo'),(4,'Primeros Auxilios','PRI','Activo'),(5,'Bebés y Maternidad','BEB','Activo'),(6,'Higiene Bucal','HIG','Activo'),(7,'Belleza y Dermatología','BEL','Activo'),(8,'Nutrición Deportiva','NUT','Activo'),(9,'Cuidado del Adulto Mayor','MAY','Activo'),(10,'Equipos y Dispositivos Médicos','EQU','Activo');
/*!40000 ALTER TABLE `categoria` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `configuracion_negocio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `configuracion_negocio` (
  `clave` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `valor` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`clave`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `configuracion_negocio` WRITE;
/*!40000 ALTER TABLE `configuracion_negocio` DISABLE KEYS */;
INSERT INTO `configuracion_negocio` VALUES ('correo_contacto','contacto@boticabelen.pe'),('direccion','Jr. Dos de Mayo 245, San Vicente de Cañete'),('horario_atencion','Lunes a sábado de 8:30 a. m. a 10:00 p. m. Domingos de 8:00 a. m. a 1:00 p. m.'),('horas_vencimiento','24'),('mapa_lat','-13.0775'),('mapa_lng','-76.3871'),('metodos_pago','Efectivo o Yape'),('nombre_negocio','Botica Belén'),('referencia','A media cuadra de la Plaza de Armas'),('telefono_contacto','+51 932614848'),('whatsapp_mensaje','Hola, Botica Belén. Quisiera hacer una consulta.'),('whatsapp_numero','51932614848'),('yape_numero','932614848');
/*!40000 ALTER TABLE `configuracion_negocio` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `detalle_pedido`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `detalle_pedido` (
  `idDetallePedido` int NOT NULL AUTO_INCREMENT,
  `idPedido` int NOT NULL,
  `idProducto` int NOT NULL,
  `cantidad` int NOT NULL,
  `precioUnitario` decimal(10,2) NOT NULL,
  `costoUnitario` decimal(10,2) DEFAULT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `preparado` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`idDetallePedido`),
  KEY `idPedido` (`idPedido`),
  KEY `idProducto` (`idProducto`),
  CONSTRAINT `detalle_pedido_ibfk_1` FOREIGN KEY (`idPedido`) REFERENCES `pedido` (`idPedido`) ON DELETE CASCADE,
  CONSTRAINT `detalle_pedido_ibfk_2` FOREIGN KEY (`idProducto`) REFERENCES `producto` (`idProducto`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `detalle_pedido` WRITE;
/*!40000 ALTER TABLE `detalle_pedido` DISABLE KEYS */;
INSERT INTO `detalle_pedido` VALUES (1,1,1,4,12.50,4.24,50.00,1),(2,2,1,1,25.00,4.24,25.00,0),(3,3,1,2,9.50,4.24,19.00,1),(4,3,5,2,40.50,4.04,81.00,1),(5,4,1,1,18.00,4.24,18.00,1),(6,5,5,1,35.00,4.04,35.00,1),(7,6,1,4,20.00,4.24,80.00,1),(8,7,1,5,13.00,4.24,65.00,0),(9,8,1,2,65.00,4.24,130.00,1),(10,9,1,1,45.00,4.24,45.00,1),(11,10,1,1,15.00,4.24,15.00,0),(12,11,39,4,15.57,13.25,62.28,1),(13,11,39,1,18.20,13.25,18.20,1),(14,11,72,1,3.38,6.01,3.38,1),(15,11,72,1,3.75,6.01,3.75,1),(16,12,83,1,6.98,4.89,6.98,1),(17,12,72,1,8.59,6.01,8.59,1),(18,12,138,1,2.80,1.96,2.80,1),(19,13,83,2,6.98,4.89,13.96,1),(20,13,72,1,8.59,6.01,8.59,1),(21,13,138,1,2.80,1.96,2.80,1),(22,14,203,1,21.00,14.70,21.00,1),(23,14,103,1,33.76,23.63,33.76,1),(24,14,86,1,13.11,9.18,13.11,1),(25,15,83,4,6.98,4.89,27.92,1);
/*!40000 ALTER TABLE `detalle_pedido` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `migraciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `migraciones` (
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `aplicada_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `migraciones` WRITE;
/*!40000 ALTER TABLE `migraciones` DISABLE KEYS */;
INSERT INTO `migraciones` VALUES ('001_bloqueo_temporal','RF02: bloqueo temporal de la cuenta tras 5 intentos fallidos','2026-11-09 00:43:26'),('002_principio_activo','RF05: principio activo del producto y búsqueda por él','2026-11-09 01:16:52'),('003_catalogo_30_productos','Catálogo de prueba reducido a 30 productos repartidos en las 10 categorías','2026-11-09 01:20:53'),('004_roles_y_permisos','Roles del personal con permisos por sección (como en Pastelería Web)','2026-11-09 01:44:49'),('005_prefijo_y_codigos','Prefijo de código por categoría y códigos de producto correlativos','2026-11-09 02:09:00'),('006_configuracion_negocio','Información del negocio editable por el admin (como en Pastelería Web)','2026-11-09 02:23:20'),('007_solo_efectivo_y_yape','Formas de pago: solo Efectivo y Yape','2026-11-09 02:44:46'),('008_codigos_de_pedido','Códigos de pedido con formato PED-AAAA-NNNN','2026-11-09 02:51:02'),('009_checklist_preparacion','Checklist del mostrador guardada por producto del pedido','2026-11-09 03:00:28'),('010_ganancias_conversion_vencimiento','Costo y ganancia (RF21), carritos para la conversión (RF22) y vencimiento de reservas','2026-11-09 03:13:54'),('011_renumerar_codigos_pedido','Corrige códigos PED-AAAA-01-01-NNNN y deja el correlativo en orden de fecha','2026-11-09 03:16:01');
/*!40000 ALTER TABLE `migraciones` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `pedido`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pedido` (
  `idPedido` int NOT NULL AUTO_INCREMENT,
  `codigoPedido` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `idUsuario` int NOT NULL,
  `fechaHoraToma` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `estadoPedido` enum('Pendiente','Aceptado','Rechazado','En preparación','Listo para entregar','Entregado','Cancelado') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pendiente',
  `metodoPago` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `observaciones` text COLLATE utf8mb4_unicode_ci,
  `subtotalGeneral` decimal(10,2) NOT NULL,
  `igv` decimal(10,2) NOT NULL,
  `total` decimal(10,2) NOT NULL,
  PRIMARY KEY (`idPedido`),
  UNIQUE KEY `codigoPedido` (`codigoPedido`),
  KEY `idUsuario` (`idUsuario`),
  CONSTRAINT `pedido_ibfk_1` FOREIGN KEY (`idUsuario`) REFERENCES `usuario` (`idUsuario`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `pedido` WRITE;
/*!40000 ALTER TABLE `pedido` DISABLE KEYS */;
INSERT INTO `pedido` VALUES (1,'PED-2026-0001',4,'2026-01-15 10:30:00','Entregado','Yape','Paso a recoger en la tarde',42.37,7.63,50.00),(2,'PED-2026-0002',5,'2026-02-20 14:15:00','Cancelado','Yape','Cancelado por demora',21.19,3.81,25.00),(3,'PED-2026-0003',4,'2026-03-10 09:45:00','Entregado','Efectivo','Pago exacto',84.75,15.25,100.00),(4,'PED-2026-0004',5,'2026-04-05 16:20:00','Entregado','Efectivo','Avisar cuando esté listo',15.25,2.75,18.00),(5,'PED-2026-0005',4,'2026-05-12 11:00:00','Entregado','Yape','',29.66,5.34,35.00),(6,'PED-2026-0006',5,'2026-06-18 13:10:00','Entregado','Yape','',67.80,12.20,80.00),(7,'PED-2026-0007',4,'2026-07-22 17:30:00','Cancelado','Efectivo','Sin stock',55.08,9.92,65.00),(8,'PED-2026-0008',5,'2026-08-30 08:50:00','Entregado','Efectivo','',110.17,19.83,130.00),(9,'PED-2026-0009',4,'2026-09-20 12:40:00','Entregado','Yape','',38.14,6.86,45.00),(10,'PED-2026-0010',5,'2026-09-21 15:00:00','Rechazado','Yape','Urgente\n[Rechazado 9/11/2026, 00:00:07] Demasiados días sin contacto alguno (por Empleado Uno)',12.71,2.29,15.00),(11,'PED-2026-0011',4,'2026-11-09 00:00:40','Entregado','Efectivo',NULL,74.25,13.36,87.61),(12,'PED-2026-0012',7,'2026-11-09 01:50:38','Entregado','Yape',NULL,15.57,2.80,18.37),(13,'PED-2026-0013',7,'2026-11-09 02:31:11','Entregado','Yape',NULL,21.48,3.87,25.35),(14,'PED-2026-0014',7,'2026-11-09 02:52:34','Entregado','Yape',NULL,57.52,10.35,67.87),(15,'PED-2026-0015',7,'2026-11-09 03:00:54','Entregado','Yape',NULL,23.66,4.26,27.92);
/*!40000 ALTER TABLE `pedido` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `producto`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `producto` (
  `idProducto` int NOT NULL AUTO_INCREMENT,
  `idCategoria` int DEFAULT NULL,
  `codigoProducto` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombreProducto` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `principioActivo` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `descripcionProducto` text COLLATE utf8mb4_unicode_ci,
  `precioProducto` decimal(10,2) NOT NULL,
  `costoProducto` decimal(10,2) DEFAULT NULL,
  `stock` int NOT NULL DEFAULT '0',
  `estadoProducto` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Activo',
  `requiere_receta` tinyint(1) NOT NULL DEFAULT '0',
  `imagenURL` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ubicacionAnaquel` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`idProducto`),
  UNIQUE KEY `codigoProducto` (`codigoProducto`),
  KEY `idCategoria` (`idCategoria`),
  CONSTRAINT `producto_ibfk_1` FOREIGN KEY (`idCategoria`) REFERENCES `categoria` (`idCategoria`)
) ENGINE=InnoDB AUTO_INCREMENT=205 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `producto` WRITE;
/*!40000 ALTER TABLE `producto` DISABLE KEYS */;
INSERT INTO `producto` VALUES (1,1,'MED-0001','Paracetamol 500mg (Caja x 100 tab)','Paracetamol','Producto farmacéutico de la categoría Medicamentos Generales.',6.06,4.24,5,'Activo',0,'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTuYQwNDOd_s0yBQcWzi5LT7GpVrU-knGccjprKDBVVOJG_T7DDRXqu1W4&s=10','Estante A-02'),(5,1,'MED-0002','Ibuprofeno 400mg (Caja x 100 tab)','Ibuprofeno','Producto farmacéutico de la categoría Medicamentos Generales.',5.77,4.04,5,'Activo',0,'https://yajemadrogueria.com/wp-content/uploads/2023/08/01-0002.jpg','Estante A-06'),(9,1,'MED-0003','Amoxicilina 500mg (Caja x 100 tab)','Amoxicilina','Producto farmacéutico de la categoría Medicamentos Generales.',20.82,14.57,5,'Activo',1,'https://www.farmaciaslider.pe/my-assets/image/gallery/c22f29d948b55057c808fcec4f97a841.jpg','Estante A-10'),(19,1,'MED-0004','Omeprazol 20mg (Caja x 30 cap)','Omeprazol','Producto farmacéutico de la categoría Medicamentos Generales.',12.40,8.68,50,'Activo',0,'https://guepardiapp.com/web_files/B00003/catalogo/max_1687970764-4435088.jpg','Estante A-08'),(31,1,'MED-0005','Loratadina 10mg (Caja x 100 tab)','Loratadina','Producto farmacéutico de la categoría Medicamentos Generales.',9.87,6.91,10,'Activo',0,'https://guepardiapp.com/web_files/B00003/catalogo/max_1687970464-4746923.jpg','Estante A-08'),(39,2,'CUI-0001','Shampoo Head & Shoulders 400ml',NULL,'Producto farmacéutico de la categoría Cuidado Personal.',18.93,13.25,20,'Activo',0,'https://product-data.raiadrogasil.io/images/18393281.webp','Estante B-04'),(43,2,'CUI-0002','Desodorante Rexona Clinical Crema 48g',NULL,'Producto farmacéutico de la categoría Cuidado Personal.',13.23,9.26,10,'Activo',0,'https://plazavea.vteximg.com.br/arquivos/ids/31352515-418-418/20075774-1.jpg','Estante B-08'),(47,2,'CUI-0003','Jabón Dove Barra 90g (Pack x 3)',NULL,'Producto farmacéutico de la categoría Cuidado Personal.',8.22,5.75,5,'Activo',0,'https://plazavea.vteximg.com.br/arquivos/ids/29522461-450-450/20281722.jpg?v=638624161977170000','Estante B-12'),(57,3,'VIT-0001','Vitamina C Redoxon 1000mg (Tubo x 10 Efervescentes)','Ácido ascórbico (vitamina C)','Producto farmacéutico de la categoría Vitaminas y Suplementos.',24.55,17.19,5,'Activo',0,'https://www.redoxon.com.ar/sites/g/files/vrxlpx49611/files/2021-03/Ima%CC%81genes---Tubos-Redoxon-1gr.png','Estante C-10'),(60,3,'VIT-0002','Multivitamínico Centrum Silver (Frasco x 30 tab)',NULL,'Producto farmacéutico de la categoría Vitaminas y Suplementos.',43.07,30.15,10,'Activo',0,'https://http2.mlstatic.com/D_NQ_NP_721752-MLU75807479434_042024-O.webp','Estante C-01'),(66,3,'VIT-0003','Omega 3 Fish Oil 1000mg (Frasco x 100 cap)','Ácidos grasos omega 3','Producto farmacéutico de la categoría Vitaminas y Suplementos.',50.68,35.48,20,'Activo',0,'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSVLVLsjiSUnSo0dCbcXQQ0RWT1L9Z4l8IED6L6M0J4sYknANDIem2YITI&s=10','Estante C-07'),(72,4,'PRI-0001','Alcohol Medicinal 70° 500ml','Alcohol etílico','Producto farmacéutico de la categoría Primeros Auxilios.',8.59,6.01,23,'Activo',0,'https://farmaciauniversalpe.vtexassets.com/arquivos/ids/157812/17424-Alcohol-Medicinal-70%C2%B0_500ml-farmacia-universal.jpg?v=638428720944200000','Estante D-01'),(83,4,'PRI-0002','Agua Oxigenada 10 Volúmenes 120ml','Peróxido de hidrógeno','Producto farmacéutico de la categoría Primeros Auxilios.',6.98,4.89,13,'Activo',0,'https://farmaciauniversalpe.vtexassets.com/arquivos/ids/157118/17243_1.jpg?v=638417277117000000','Estante D-12'),(86,4,'PRI-0003','Curitas Transpirables (Caja x 100 und)',NULL,'Producto farmacéutico de la categoría Primeros Auxilios.',13.11,9.18,4,'Activo',0,'https://images-1.eucerin.com/~/media/hansaplast/local/region-latam/2024/pdps%20packshots/transpiel%20x100.jpg','Estante D-03'),(92,5,'BEB-0001','Pañales Huggies Etapa 3 (Paquete x 40)',NULL,'Producto farmacéutico de la categoría Bebés y Maternidad.',39.01,27.31,20,'Activo',0,'https://i5-mx.walmartimages.com/asr/283efc93-fab9-4057-b417-2cffacfeae09.c30f23873bdd39e45b7de18fe81973a0.jpeg?odnHeight=612&odnWidth=612&odnBg=FFFFFF','Estante E-09'),(95,5,'BEB-0002','Toallitas Húmedas Pampers Sensitive (Paquete x 56)',NULL,'Producto farmacéutico de la categoría Bebés y Maternidad.',13.96,9.77,10,'Activo',0,'https://m.media-amazon.com/images/I/61Bacu1RQPL.jpg','Estante E-12'),(103,5,'BEB-0003','Crema Escaldaduras Bepanthen 30g','Dexpantenol','Producto farmacéutico de la categoría Bebés y Maternidad.',33.76,23.63,9,'Activo',0,'https://http2.mlstatic.com/D_Q_NP_2X_753256-MPE115723546233_082026-T.webp','Estante E-08'),(109,6,'HIG-0001','Pasta Dental Colgate Total 12 150g','Fluoruro de sodio','Producto farmacéutico de la categoría Higiene Bucal.',19.40,13.58,10,'Activo',0,'https://plazavea.vteximg.com.br/arquivos/ids/36583999-418-418/20570710.jpg','Estante F-02'),(111,6,'HIG-0002','Pasta Dental Sensodyne Repara y Protege 100g','Nitrato de potasio y fluoruro','Producto farmacéutico de la categoría Higiene Bucal.',7.69,5.38,5,'Activo',0,'https://m.media-amazon.com/images/I/71J+LS1s0NL.jpg','Estante F-04'),(117,6,'HIG-0003','Enjuague Bucal Listerine Cool Mint 500ml',NULL,'Producto farmacéutico de la categoría Higiene Bucal.',13.14,9.20,5,'Activo',0,'https://media.falabella.com/tottusPE/10176564_2/w=1500,h=1500,fit=cover','Estante F-10'),(124,7,'BEL-0001','Protector Solar Eucerin Sun Gel-Cream Oil Control SPF 50 50ml',NULL,'Producto farmacéutico de la categoría Belleza y Dermatología.',74.36,52.05,20,'Activo',0,'https://i5.walmartimages.com/seo/Eucerin-Sun-Protection-Oil-Control-Sun-Gel-Cream-SPF-50-50ml_544b0cc9-6268-4c3c-9fae-6f952676121e_1.fb72489f2749a7ce7e3e89c954351f6b.jpeg','Estante G-05'),(127,7,'BEL-0002','Limpiador Facial Cerave Gel Limpiador Espumoso 236ml',NULL,'Producto farmacéutico de la categoría Belleza y Dermatología.',47.25,33.08,5,'Activo',0,'https://plazavea.vteximg.com.br/arquivos/ids/30880058/image-c079fef38f374bd2b8a4888b33791979.jpg?v=638775839193530000','Estante G-08'),(133,8,'NUT-0001','Proteína en Polvo Whey Protein Gold Standard 2lb',NULL,'Producto farmacéutico de la categoría Nutrición Deportiva.',182.03,127.42,10,'Activo',0,'https://http2.mlstatic.com/D_Q_NP_2X_726019-MLA99974412753_112025-P.webp','Estante H-02'),(138,8,'NUT-0002','Bebida Isotónica Gatorade 500ml',NULL,'Producto farmacéutico de la categoría Nutrición Deportiva.',2.80,1.96,3,'Activo',0,'https://corporacionliderperu.com/51173-large_default/gatorade-bebida-rehid-x-500-ml-tropical.jpg','Estante H-07'),(141,9,'MAY-0001','Pañales para Adulto Plenitud Protect Talla M (Paquete x 20)',NULL,'Producto farmacéutico de la categoría Cuidado del Adulto Mayor.',75.38,52.77,10,'Activo',0,'https://farmaciauniversalpe.vtexassets.com/arquivos/ids/163649/09961_1.jpg?v=638938994367870000','Estante I-10'),(144,9,'MAY-0002','Suplemento Nutricional Ensure Advance Vainilla 850g',NULL,'Producto farmacéutico de la categoría Cuidado del Adulto Mayor.',63.34,44.34,5,'Activo',0,'https://perufarma.com.pe/wp-content/uploads/2023/05/216400.jpg','Estante I-01'),(147,10,'EQU-0001','Tensiómetro Omron Digital de Brazo',NULL,'Producto farmacéutico de la categoría Equipos y Dispositivos Médicos.',205.45,143.82,20,'Activo',0,'https://promart.vteximg.com.br/arquivos/ids/8598801/imageUrl_1.jpg?v=638752843207070000','Estante J-04'),(150,10,'EQU-0002','Termómetro Digital Flexible',NULL,'Producto farmacéutico de la categoría Equipos y Dispositivos Médicos.',23.46,16.42,5,'Activo',0,'https://i0.wp.com/avimetaxperu.com/wp-content/uploads/2024/11/1.jpg?fit=1000%2C1000&ssl=1','Estante J-07'),(201,1,'MED-0006','Panadol 500mg (Caja x 100 tab)','Paracetamol','Analgésico y antipirético de marca.',18.50,12.95,40,'Activo',0,'https://www.farmaciasjulios.com/wp-content/uploads/2026/01/farmaciasjulios_panama-panadol-rapid-500mg-alivio-rapido-del-dolor-y-la-fiebre-16-tabletas.jpg','Estante A-02'),(203,1,'MED-0007','Clarityne 10mg (Caja x 10 tab)','Loratadina','Antialérgico de marca.',21.00,14.70,24,'Activo',0,'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR6eeToTc3HrgAp7EdhLX6UdJnv-cqUFfi8E5HMfBS1JvbU8jCShzodxKg&s=10','Estante A-04');
/*!40000 ALTER TABLE `producto` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `rol`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rol` (
  `idRol` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `permisos` json NOT NULL,
  `esSistema` tinyint(1) NOT NULL DEFAULT '0',
  `creadoEn` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`idRol`),
  UNIQUE KEY `uk_rol_nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `rol` WRITE;
/*!40000 ALTER TABLE `rol` DISABLE KEYS */;
INSERT INTO `rol` VALUES (1,'Administrador','Acceso total al panel. Es el rol del sistema y no se puede modificar.','[\"resumen\", \"mostrador\", \"pedidos\", \"pedidos_estado\", \"productos\", \"productos_editar\", \"reporte\", \"personal\"]',1,'2026-11-09 01:44:49'),(2,'Empleado','Atiende el mostrador y los pedidos, y consulta el stock.','[\"mostrador\", \"pedidos\", \"pedidos_estado\", \"productos\"]',0,'2026-11-09 01:44:49');
/*!40000 ALTER TABLE `rol` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuario` (
  `idUsuario` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telefono` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `passwordHash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo` enum('Personal','Cliente') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Cliente',
  `idRol` int DEFAULT NULL,
  `carrito_json` text COLLATE utf8mb4_unicode_ci,
  `estado` int NOT NULL DEFAULT '1',
  `intentos_fallidos` int NOT NULL DEFAULT '0',
  `bloqueado_hasta` datetime DEFAULT NULL,
  `creadoEn` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`idUsuario`),
  UNIQUE KEY `email` (`email`),
  KEY `fk_usuario_rol` (`idRol`),
  CONSTRAINT `fk_usuario_rol` FOREIGN KEY (`idRol`) REFERENCES `rol` (`idRol`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `usuario` WRITE;
/*!40000 ALTER TABLE `usuario` DISABLE KEYS */;
INSERT INTO `usuario` VALUES (1,'Sergio Rodrigo','951753852','admin@boticabelen.com','$2y$10$S7j4jLza4RtZbGTsNSeGguscY65n1Cn2u0inKiEz3nPkjVH8/ysBu','Personal',1,NULL,1,0,NULL,'2026-11-09 01:44:49'),(2,'Juan Rivas','963852741','juan.rivas@boticabelen.com','$2y$10$WB0TnDFHzOgdJZiaZx03mesGaanj2jk0zOWXGMQiLAnmKH0UW2TDK','Personal',2,NULL,1,0,NULL,'2026-11-09 01:44:49'),(3,'Ricardo Ugarte','936548214','ricardo.ugarte@boticabelen.com','$2y$10$yFfXZ3R0om9PhyaLQYW.5OXkSU/zO4ggWxbFNn0sTQGnVeQMyD0h6','Personal',2,NULL,1,0,NULL,'2026-11-09 01:44:49'),(4,'Juan Pérez','987654321','juan.perez@gmail.com','$2y$10$qvaiYaXUYtJ7LVcdOLvTQubVyceKkM6WLNrxmOBDkkxpR7eFbC3o6','Cliente',NULL,NULL,1,0,NULL,'2026-11-09 01:44:49'),(5,'Rosa Mamani','976543210','rosa.mamani@hotmail.com','$2y$10$qvaiYaXUYtJ7LVcdOLvTQubVyceKkM6WLNrxmOBDkkxpR7eFbC3o6','Cliente',NULL,NULL,1,0,NULL,'2026-11-09 01:44:49'),(6,'Sergio Huapaya','932614848','sergio.huapaya@gmail.com','$2y$10$x6l9bPGGSAIHDRxASxygAecUFGcTjxtrNzXtx0zFBHNHLvxnU3v/m','Cliente',NULL,NULL,1,0,NULL,'2026-11-09 01:44:49'),(7,'Alexis Herencia','943761825','alexis.herencia@gmail.com','$2y$10$INe04x7j/8vk0N1DDaRAWuAEl9EwozvD5/SSNX.27/LpId9tR/GbO','Cliente',NULL,NULL,1,0,NULL,'2026-11-09 01:50:25');
/*!40000 ALTER TABLE `usuario` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

