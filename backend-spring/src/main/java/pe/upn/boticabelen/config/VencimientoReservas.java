package pe.upn.boticabelen.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import pe.upn.boticabelen.service.ConfiguracionService;
import pe.upn.boticabelen.service.PedidoService;

/** Cada 5 minutos cancela las reservas que nadie recogió a tiempo (horas configurables por el admin). */
@Component
public class VencimientoReservas {

    private static final Logger log = LoggerFactory.getLogger(VencimientoReservas.class);

    private final PedidoService pedidoService;
    private final ConfiguracionService configuracionService;

    public VencimientoReservas(PedidoService pedidoService, ConfiguracionService configuracionService) {
        this.pedidoService = pedidoService;
        this.configuracionService = configuracionService;
    }

    @Scheduled(initialDelay = 60_000, fixedDelay = 300_000)
    public void revisar() {
        int horas = configuracionService.horasVencimiento();
        if (horas <= 0) return; // vencimiento desactivado
        try {
            int vencidas = pedidoService.vencerReservas(horas);
            if (vencidas > 0) log.info("Reservas vencidas y canceladas: {} (más de {} h sin recoger).", vencidas, horas);
        } catch (Exception e) {
            log.error("No se pudieron revisar las reservas vencidas", e);
        }
    }
}
