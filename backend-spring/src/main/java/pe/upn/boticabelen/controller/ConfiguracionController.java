package pe.upn.boticabelen.controller;

import java.util.Map;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pe.upn.boticabelen.seguridad.Permisos;
import pe.upn.boticabelen.seguridad.Requiere;
import pe.upn.boticabelen.service.ConfiguracionService;

/** Información del negocio: lectura pública (portal) y edición desde el panel. */
@RestController
@RequestMapping("/api")
public class ConfiguracionController {

    private final ConfiguracionService configuracionService;

    public ConfiguracionController(ConfiguracionService configuracionService) {
        this.configuracionService = configuracionService;
    }

    @GetMapping("/config")
    public ResponseEntity<Map<String, String>> obtener() {
        // Sin caché: si el admin cambia un dato, el portal lo ve al instante.
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(configuracionService.obtener());
    }

    @Requiere(Permisos.CONFIGURACION)
    @PutMapping("/gestion/config")
    public Map<String, String> actualizar(@RequestBody Map<String, Object> datos) {
        return configuracionService.actualizar(datos);
    }
}
