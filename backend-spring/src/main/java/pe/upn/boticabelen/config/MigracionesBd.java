package pe.upn.boticabelen.config;

import java.util.Collections;
import java.util.HashSet;
import java.util.List;
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

    private boolean existeColumna(String tabla, String columna) {
        Integer n = jdbc.queryForObject(
                "SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",
                Integer.class, tabla, columna);
        return n != null && n > 0;
    }
}
