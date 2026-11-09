package pe.upn.boticabelen.config;

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
