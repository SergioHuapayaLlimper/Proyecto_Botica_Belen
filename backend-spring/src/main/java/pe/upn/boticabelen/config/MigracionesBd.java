package pe.upn.boticabelen.config;

import java.text.Normalizer;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Consumer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Migraciones de la base de datos: se aplican solas al arrancar la API.
 * - Cada migración se registra en la tabla "migraciones" y no se repite.
 * - Están escritas para ser seguras de repetir (revisan si el cambio ya existe),
 *   así sirven tanto para una BD antigua como para una creada con /database/01_estructura.sql.
 * Para agregar un cambio nuevo: añadir una entrada al final de MIGRACIONES.
 */
@Component
@Order(0)
public class MigracionesBd implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(MigracionesBd.class);

    private record Migracion(String nombre, String descripcion, Consumer<JdbcTemplate> aplicar) {}

    private final JdbcTemplate jdbc;

    public MigracionesBd(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private final List<Migracion> MIGRACIONES = List.of(
            new Migracion("001_bloqueo_temporal", "RF02: bloqueo temporal de la cuenta tras 5 intentos fallidos", bd -> {
                if (!existeColumna("usuario", "bloqueado_hasta")) {
                    bd.execute("ALTER TABLE usuario ADD COLUMN bloqueado_hasta DATETIME NULL AFTER intentos_fallidos");
                }
                // Antes, 5 intentos fallidos desactivaban la cuenta para siempre (estado = 0).
                // Esas cuentas vuelven a estar activas: ahora el bloqueo es temporal.
                bd.update("UPDATE usuario SET estado = 1, intentos_fallidos = 0 WHERE estado = 0 AND intentos_fallidos >= 5");
            }),

            new Migracion("002_principio_activo", "RF05: principio activo del producto y búsqueda por él", bd -> {
                if (!existeColumna("producto", "principioActivo")) {
                    bd.execute("ALTER TABLE producto ADD COLUMN principioActivo VARCHAR(100) NULL AFTER nombreProducto");
                }
                // Principio activo de los productos del catálogo (los más específicos primero).
                String[][] principios = {
                        {"Paracetamol%", "Paracetamol"},
                        {"Ibuprofeno%", "Ibuprofeno"},
                        {"Amoxicilina%", "Amoxicilina"},
                        {"Naproxeno Sódico%", "Naproxeno sódico"},
                        {"Naproxeno%", "Naproxeno"},
                        {"Losartán%", "Losartán potásico"},
                        {"Omeprazol%", "Omeprazol"},
                        {"Atorvastatina%", "Atorvastatina"},
                        {"Azitromicina%", "Azitromicina"},
                        {"Cetirizina%", "Cetirizina"},
                        {"Loratadina%", "Loratadina"},
                        {"Diclofenaco%", "Diclofenaco"},
                        {"Metformina%", "Metformina"},
                        {"Vitamina C%", "Ácido ascórbico (vitamina C)"},
                        {"Colágeno%", "Colágeno hidrolizado"},
                        {"Omega 3%", "Ácidos grasos omega 3"},
                        {"Magnesio Cloruro%", "Cloruro de magnesio"},
                        {"Magnesio Citrato%", "Citrato de magnesio"},
                        {"Magnesio%", "Magnesio"},
                        {"Agua Oxigenada%", "Peróxido de hidrógeno"},
                        {"Alcohol%", "Alcohol etílico"},
                        {"Creatina%", "Creatina monohidratada"},
                        {"Crema Escaldaduras Bepanthen%", "Dexpantenol"},
                        {"Crema Escaldaduras%", "Óxido de zinc"},
                        {"Enjuague Bucal Periogard%", "Clorhexidina"},
                        {"Pasta Dental Sensodyne%", "Nitrato de potasio y fluoruro"},
                        {"Pasta Dental%", "Fluoruro de sodio"},
                };
                for (String[] par : principios) {
                    bd.update("UPDATE producto SET principioActivo = ? WHERE principioActivo IS NULL AND nombreProducto LIKE ?", par[1], par[0]);
                }
                // Medicamentos de marca: el caso que justifica buscar por principio activo.
                bd.update("""
                        INSERT IGNORE INTO producto
                          (idCategoria, codigoProducto, nombreProducto, principioActivo, descripcionProducto, precioProducto, stock, estadoProducto, requiere_receta, ubicacionAnaquel)
                        VALUES
                          (1, 'MED-0201', 'Panadol 500mg (Caja x 100 tab)', 'Paracetamol', 'Analgésico y antipirético de marca.', 18.50, 40, 'Activo', 0, 'Estante A-02'),
                          (1, 'MED-0202', 'Apronax 550mg (Caja x 10 tab)', 'Naproxeno sódico', 'Antiinflamatorio de marca.', 14.90, 30, 'Activo', 0, 'Estante A-03'),
                          (1, 'MED-0203', 'Clarityne 10mg (Caja x 10 tab)', 'Loratadina', 'Antialérgico de marca.', 21.00, 25, 'Activo', 0, 'Estante A-04'),
                          (1, 'MED-0204', 'Voltaren Emulgel 1% 50g', 'Diclofenaco', 'Gel antiinflamatorio de uso tópico.', 32.50, 15, 'Activo', 0, 'Estante A-05')""");
            }),

            new Migracion("003_catalogo_30_productos", "Catálogo de prueba reducido a 30 productos repartidos en las 10 categorías", bd -> {
                List<String> conservar = List.of(
                        // Medicamentos (7): dos pares genérico/marca para probar la búsqueda por principio activo
                        "MED-0001", "MED-0201", "MED-0005", "MED-0009", "MED-0019", "MED-0031", "MED-0203",
                        // Cuidado personal (3)
                        "CUI-0039", "CUI-0043", "CUI-0047",
                        // Vitaminas y suplementos (3)
                        "VIT-0057", "VIT-0060", "VIT-0066",
                        // Primeros auxilios (3)
                        "PRI-0072", "PRI-0083", "PRI-0086",
                        // Bebés y maternidad (3)
                        "BEB-0092", "BEB-0095", "BEB-0103",
                        // Higiene bucal (3)
                        "HIG-0109", "HIG-0111", "HIG-0117",
                        // Belleza y dermatología (2)
                        "BEL-0124", "BEL-0127",
                        // Nutrición deportiva (2)
                        "NUT-0133", "NUT-0138",
                        // Cuidado del adulto mayor (2)
                        "MAY-0141", "MAY-0144",
                        // Equipos y dispositivos médicos (2)
                        "EQU-0147", "EQU-0150");
                String en = String.join(",", Collections.nCopies(conservar.size(), "?"));
                Object[] codigos = conservar.toArray();

                // 1. Los pedidos de prueba que usan un producto que se va a borrar pasan a otro de la misma categoría.
                //    Cada línea guarda su propio precio y subtotal: los montos del pedido no cambian.
                Object[] dosVeces = new Object[codigos.length * 2];
                System.arraycopy(codigos, 0, dosVeces, 0, codigos.length);
                System.arraycopy(codigos, 0, dosVeces, codigos.length, codigos.length);
                bd.update("""
                        UPDATE detalle_pedido d
                        JOIN producto p ON p.idProducto = d.idProducto
                        JOIN (SELECT idCategoria, MIN(idProducto) AS idNuevo FROM producto
                              WHERE codigoProducto IN (%s) GROUP BY idCategoria) k ON k.idCategoria = p.idCategoria
                        SET d.idProducto = k.idNuevo
                        WHERE p.codigoProducto NOT IN (%s)""".formatted(en, en), dosVeces);

                // Por si alguna categoría se quedó sin productos: se usa el primero que se conserva.
                Integer respaldo = bd.queryForObject(
                        "SELECT MIN(idProducto) FROM producto WHERE codigoProducto IN (" + en + ")", Integer.class, codigos);
                if (respaldo != null) {
                    Object[] conRespaldo = new Object[codigos.length + 1];
                    conRespaldo[0] = respaldo;
                    System.arraycopy(codigos, 0, conRespaldo, 1, codigos.length);
                    bd.update("""
                            UPDATE detalle_pedido d JOIN producto p ON p.idProducto = d.idProducto
                            SET d.idProducto = ?
                            WHERE p.codigoProducto NOT IN (%s)""".formatted(en), conRespaldo);
                }

                // 2. Se borran los demás productos.
                int borrados = bd.update("DELETE FROM producto WHERE codigoProducto NOT IN (" + en + ")", codigos);
                log.info("Catálogo reducido: {} productos borrados.", borrados);
            }),

            new Migracion("004_roles_y_permisos", "Roles del personal con permisos por sección (como en Pastelería Web)", bd -> {
                // 1. Tabla de roles
                if (!existeTabla("rol")) {
                    bd.execute("""
                            CREATE TABLE rol (
                              idRol INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                              nombre VARCHAR(40) NOT NULL,
                              descripcion VARCHAR(150) NULL,
                              permisos JSON NOT NULL,
                              esSistema TINYINT(1) NOT NULL DEFAULT 0,
                              creadoEn DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                              UNIQUE KEY uk_rol_nombre (nombre)
                            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci""");
                }
                bd.update("""
                        INSERT IGNORE INTO rol (idRol, nombre, descripcion, permisos, esSistema) VALUES
                        (1, 'Administrador', 'Acceso total al panel. Es el rol del sistema y no se puede modificar.',
                            JSON_ARRAY('resumen','mostrador','pedidos','pedidos_estado','productos','productos_editar','reporte','personal'), 1),
                        (2, 'Empleado', 'Atiende el mostrador y los pedidos, y consulta el stock.',
                            JSON_ARRAY('mostrador','pedidos','pedidos_estado','productos'), 0),
                        (3, 'Contador', 'Revisa las ventas y exporta el reporte.',
                            JSON_ARRAY('resumen','pedidos','reporte'), 0)""");

                // 2. Nuevas columnas en usuario
                if (!existeColumna("usuario", "idRol")) {
                    String despues = existeColumna("usuario", "rol") ? "rol" : "tipo";
                    bd.execute("ALTER TABLE usuario ADD COLUMN idRol INT NULL AFTER " + despues);
                }
                if (!existeColumna("usuario", "creadoEn")) {
                    bd.execute("ALTER TABLE usuario ADD COLUMN creadoEn DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP");
                }

                // 3. El rol en texto (Admin/Empleado/Cliente) pasa a: tipo de cuenta (Personal/Cliente) + idRol
                if (existeColumna("usuario", "rol")) {
                    bd.execute("ALTER TABLE usuario MODIFY rol ENUM('Admin','Empleado','Cliente','Personal') NOT NULL DEFAULT 'Cliente'");
                    bd.update("UPDATE usuario SET idRol = 1 WHERE rol = 'Admin' AND idRol IS NULL");
                    bd.update("UPDATE usuario SET idRol = 2 WHERE rol = 'Empleado' AND idRol IS NULL");
                    bd.update("UPDATE usuario SET rol = 'Personal' WHERE rol IN ('Admin','Empleado')");
                    bd.execute("ALTER TABLE usuario CHANGE rol tipo ENUM('Personal','Cliente') NOT NULL DEFAULT 'Cliente'");
                }
                bd.update("UPDATE usuario SET idRol = 2 WHERE tipo = 'Personal' AND idRol IS NULL");
                bd.update("UPDATE usuario SET idRol = NULL WHERE tipo = 'Cliente'");

                if (!existeRestriccion("usuario", "fk_usuario_rol")) {
                    bd.execute("ALTER TABLE usuario ADD CONSTRAINT fk_usuario_rol FOREIGN KEY (idRol) REFERENCES rol (idRol)");
                }
            }),

            new Migracion("005_prefijo_y_codigos", "Prefijo de código por categoría y códigos de producto correlativos", bd -> {
                // 1. Prefijo de cada categoría: el que ya usan sus productos (CUI-0039 → CUI) o, si no tiene, el de su nombre.
                if (!existeColumna("categoria", "prefijo")) {
                    bd.execute("ALTER TABLE categoria ADD COLUMN prefijo VARCHAR(5) NULL AFTER nombreCategoria");
                }
                bd.update("""
                        UPDATE categoria c
                        SET c.prefijo = (SELECT UPPER(SUBSTRING_INDEX(MIN(p.codigoProducto), '-', 1))
                                         FROM producto p WHERE p.idCategoria = c.idCategoria)
                        WHERE c.prefijo IS NULL""");
                Set<String> usados = new HashSet<>(bd.queryForList("SELECT prefijo FROM categoria WHERE prefijo IS NOT NULL", String.class));
                for (var fila : bd.queryForList("SELECT idCategoria, nombreCategoria FROM categoria WHERE prefijo IS NULL")) {
                    String base = Normalizer.normalize(String.valueOf(fila.get("nombreCategoria")), Normalizer.Form.NFD)
                            .replaceAll("[^A-Za-z]", "").toUpperCase();
                    String prefijo = (base + "XXX").substring(0, 3);
                    for (int i = 0; usados.contains(prefijo); i++) prefijo = prefijo.substring(0, 2) + (char) ('A' + i);
                    usados.add(prefijo);
                    bd.update("UPDATE categoria SET prefijo = ? WHERE idCategoria = ?", prefijo, fila.get("idCategoria"));
                }
                bd.execute("ALTER TABLE categoria MODIFY prefijo VARCHAR(5) NOT NULL");
                if (!existeRestriccion("categoria", "uk_categoria_prefijo")) {
                    bd.execute("ALTER TABLE categoria ADD CONSTRAINT uk_categoria_prefijo UNIQUE (prefijo)");
                }

                // 2. Códigos correlativos por categoría, en el orden en que se registraron los productos.
                //    Primero códigos temporales para no chocar con la restricción UNIQUE.
                bd.update("UPDATE producto SET codigoProducto = CONCAT('TMP-', idProducto)");
                Map<String, Integer> contador = new HashMap<>();
                for (var fila : bd.queryForList("""
                        SELECT p.idProducto, COALESCE(c.prefijo, 'PRD') AS prefijo
                        FROM producto p LEFT JOIN categoria c ON c.idCategoria = p.idCategoria
                        ORDER BY prefijo, p.idProducto""")) {
                    String prefijo = String.valueOf(fila.get("prefijo"));
                    int n = contador.merge(prefijo, 1, Integer::sum);
                    bd.update("UPDATE producto SET codigoProducto = ? WHERE idProducto = ?",
                            prefijo + "-" + String.format("%04d", n), fila.get("idProducto"));
                }
            }),

            new Migracion("006_configuracion_negocio", "Información del negocio editable por el admin (como en Pastelería Web)", bd -> {
                bd.execute("""
                        CREATE TABLE IF NOT EXISTS configuracion_negocio (
                          clave VARCHAR(50) NOT NULL PRIMARY KEY,
                          valor TEXT NULL
                        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci""");
                // Valores iniciales (los que antes estaban fijos en el frontend). INSERT IGNORE respeta lo ya guardado.
                bd.update("""
                        INSERT IGNORE INTO configuracion_negocio (clave, valor) VALUES
                        ('nombre_negocio', 'Botica Belén'),
                        ('direccion', 'Jr. Dos de Mayo 245, San Vicente de Cañete'),
                        ('referencia', 'A media cuadra de la Plaza de Armas'),
                        ('mapa_lat', '-13.0775'),
                        ('mapa_lng', '-76.3871'),
                        ('horario_atencion', 'Lunes a sábado de 8:00 a. m. a 10:00 p. m. Domingos de 8:00 a. m. a 1:00 p. m.'),
                        ('metodos_pago', 'Efectivo, Yape, Plin o tarjeta'),
                        ('telefono_contacto', '(01) 581-2245'),
                        ('correo_contacto', 'contacto@boticabelen.pe'),
                        ('whatsapp_numero', '51987654321'),
                        ('whatsapp_mensaje', 'Hola, Botica Belén. Quisiera hacer una consulta.'),
                        ('yape_numero', '987 654 321')""");
            }),

            new Migracion("007_solo_efectivo_y_yape", "Formas de pago: solo Efectivo y Yape", bd -> {
                // Los pedidos de prueba con Plin pasan a Yape (también es billetera digital); los de Tarjeta, a Efectivo.
                bd.update("UPDATE pedido SET metodoPago = 'Yape' WHERE metodoPago = 'Plin'");
                bd.update("UPDATE pedido SET metodoPago = 'Efectivo' WHERE metodoPago = 'Tarjeta'");
                bd.update("UPDATE configuracion_negocio SET valor = 'Efectivo o Yape' WHERE clave = 'metodos_pago'");
            }),

            new Migracion("008_codigos_de_pedido", "Códigos de pedido con formato PED-AAAA-NNNN", bd -> {
                // Los pedidos con otro formato (BB-261109-023111-493) reciben el siguiente correlativo de su año,
                // en el orden en que se hicieron.
                Map<String, Integer> ultimo = new HashMap<>();
                for (var fila : bd.queryForList("""
                        SELECT CAST(YEAR(fechaHoraToma) AS CHAR) AS anio, MAX(CAST(SUBSTRING(codigoPedido, 10) AS UNSIGNED)) AS n
                        FROM pedido WHERE codigoPedido REGEXP '^PED-[0-9]{4}-[0-9]+$' GROUP BY YEAR(fechaHoraToma)""")) {
                    ultimo.put(String.valueOf(fila.get("anio")), ((Number) fila.get("n")).intValue());
                }
                for (var fila : bd.queryForList("""
                        SELECT idPedido, CAST(YEAR(fechaHoraToma) AS CHAR) AS anio FROM pedido
                        WHERE codigoPedido NOT REGEXP '^PED-[0-9]{4}-[0-9]+$'
                        ORDER BY fechaHoraToma, idPedido""")) {
                    String anio = String.valueOf(fila.get("anio"));
                    int n = ultimo.merge(anio, 1, Integer::sum);
                    bd.update("UPDATE pedido SET codigoPedido = ? WHERE idPedido = ?",
                            "PED-" + anio + "-" + String.format("%04d", n), fila.get("idPedido"));
                }
            }),

            new Migracion("009_checklist_preparacion", "Checklist del mostrador guardada por producto del pedido", bd -> {
                if (!existeColumna("detalle_pedido", "preparado")) {
                    bd.execute("ALTER TABLE detalle_pedido ADD COLUMN preparado TINYINT(1) NOT NULL DEFAULT 0");
                }
                // Los pedidos que ya estaban listos o entregados tuvieron sus productos separados.
                bd.update("""
                        UPDATE detalle_pedido d JOIN pedido p ON p.idPedido = d.idPedido
                        SET d.preparado = 1 WHERE p.estadoPedido IN ('Listo para entregar', 'Entregado')""");
            }),

            new Migracion("010_ganancias_conversion_vencimiento", "Costo y ganancia (RF21), carritos para la conversión (RF22) y vencimiento de reservas", bd -> {
                // RF21: costo de compra del producto y costo congelado en cada venta (el histórico no cambia si cambia el costo).
                if (!existeColumna("producto", "costoProducto")) {
                    bd.execute("ALTER TABLE producto ADD COLUMN costoProducto DECIMAL(10,2) NULL AFTER precioProducto");
                    // Datos de prueba: costo aproximado del 70 % del precio de venta.
                    bd.update("UPDATE producto SET costoProducto = ROUND(precioProducto * 0.70, 2)");
                }
                if (!existeColumna("detalle_pedido", "costoUnitario")) {
                    bd.execute("ALTER TABLE detalle_pedido ADD COLUMN costoUnitario DECIMAL(10,2) NULL AFTER precioUnitario");
                    bd.update("""
                            UPDATE detalle_pedido d JOIN producto p ON p.idProducto = d.idProducto
                            SET d.costoUnitario = p.costoProducto""");
                }
                // RF22: cada carrito que un cliente empieza y, si terminó en reserva, el pedido.
                bd.execute("""
                        CREATE TABLE IF NOT EXISTS carrito_sesion (
                          idCarrito INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                          idUsuario INT NOT NULL,
                          iniciadoEn DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                          idPedido INT NULL,
                          cerradoEn DATETIME NULL,
                          CONSTRAINT fk_carrito_usuario FOREIGN KEY (idUsuario) REFERENCES usuario (idUsuario) ON DELETE CASCADE,
                          CONSTRAINT fk_carrito_pedido FOREIGN KEY (idPedido) REFERENCES pedido (idPedido) ON DELETE SET NULL,
                          KEY ix_carrito_iniciado (iniciadoEn)
                        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci""");
                // Vencimiento de reservas no recogidas (horas), editable en "Información del negocio".
                bd.update("INSERT IGNORE INTO configuracion_negocio (clave, valor) VALUES ('horas_vencimiento', '24')");
            }),

            new Migracion("011_renumerar_codigos_pedido", "Corrige códigos PED-AAAA-01-01-NNNN y deja el correlativo en orden de fecha", bd -> {
                // MySQL devuelve YEAR() como fecha (2026-01-01): la 008 generó códigos como PED-2026-01-01-0001.
                // Se renumeran todos los pedidos de cada año según el orden en que se hicieron.
                bd.update("UPDATE pedido SET codigoPedido = CONCAT('TMP-', idPedido)"); // evita choques con el UNIQUE
                Map<String, Integer> correlativo = new HashMap<>();
                for (var fila : bd.queryForList("""
                        SELECT idPedido, CAST(YEAR(fechaHoraToma) AS CHAR) AS anio FROM pedido
                        ORDER BY fechaHoraToma, idPedido""")) {
                    String anio = String.valueOf(fila.get("anio"));
                    int n = correlativo.merge(anio, 1, Integer::sum);
                    bd.update("UPDATE pedido SET codigoPedido = ? WHERE idPedido = ?",
                            "PED-" + anio + "-" + String.format("%04d", n), fila.get("idPedido"));
                }
            })
    );

    @Override
    public void run(ApplicationArguments args) {
        jdbc.execute("""
                CREATE TABLE IF NOT EXISTS migraciones (
                  nombre VARCHAR(100) NOT NULL PRIMARY KEY,
                  descripcion VARCHAR(255) NULL,
                  aplicada_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci""");

        Set<String> aplicadas = new HashSet<>(jdbc.queryForList("SELECT nombre FROM migraciones", String.class));
        int nuevas = 0;
        for (Migracion m : MIGRACIONES) {
            if (aplicadas.contains(m.nombre())) continue;
            m.aplicar().accept(jdbc);
            jdbc.update("INSERT INTO migraciones (nombre, descripcion) VALUES (?, ?)", m.nombre(), m.descripcion());
            log.info("Migración aplicada: {} ({})", m.nombre(), m.descripcion());
            nuevas++;
        }
        if (nuevas == 0) log.info("Base de datos al día (sin migraciones pendientes).");
    }

    private boolean existeTabla(String tabla) {
        Integer n = jdbc.queryForObject(
                "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?",
                Integer.class, tabla);
        return n != null && n > 0;
    }

    private boolean existeRestriccion(String tabla, String restriccion) {
        Integer n = jdbc.queryForObject(
                "SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND CONSTRAINT_NAME = ?",
                Integer.class, tabla, restriccion);
        return n != null && n > 0;
    }

    private boolean existeColumna(String tabla, String columna) {
        Integer n = jdbc.queryForObject(
                "SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",
                Integer.class, tabla, columna);
        return n != null && n > 0;
    }
}
