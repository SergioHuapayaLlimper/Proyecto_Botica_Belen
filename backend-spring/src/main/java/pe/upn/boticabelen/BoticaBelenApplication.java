package pe.upn.boticabelen;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * API REST de Botica Belén.
 * Arquitectura en capas: controller (presentación) -> service (negocio) -> repository (datos) -> entity (modelo).
 */
@SpringBootApplication
@EnableScheduling // tareas programadas: vencimiento de reservas no recogidas
public class BoticaBelenApplication {

    private static final Logger log = LoggerFactory.getLogger(BoticaBelenApplication.class);

    @Value("${server.port}")
    private int puerto;

    public static void main(String[] args) {
        SpringApplication.run(BoticaBelenApplication.class, args);
    }

    @EventListener(ApplicationReadyEvent.class)
    public void listo() {
        log.info("API de Botica Belén (Spring Boot) lista en http://localhost:{}/api", puerto);
    }
}
