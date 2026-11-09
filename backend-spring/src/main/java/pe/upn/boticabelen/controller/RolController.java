package pe.upn.boticabelen.controller;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import pe.upn.boticabelen.dto.Respuestas.PermisoDto;
import pe.upn.boticabelen.dto.Respuestas.RolDto;
import pe.upn.boticabelen.dto.Solicitudes.RolRequest;
import pe.upn.boticabelen.seguridad.Permisos;
import pe.upn.boticabelen.seguridad.Requiere;
import pe.upn.boticabelen.service.RolService;

/** Roles del personal y catálogo de permisos. Requiere el permiso "Personal y roles". */
@RestController
@RequestMapping("/api/gestion/roles")
@Requiere(Permisos.PERSONAL)
public class RolController {

    private final RolService rolService;

    public RolController(RolService rolService) {
        this.rolService = rolService;
    }

    @GetMapping("/permisos")
    public List<PermisoDto> permisos() {
        return rolService.permisos();
    }

    @GetMapping
    public List<RolDto> listar() {
        return rolService.listar();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RolDto crear(@RequestBody RolRequest req) {
        return rolService.crear(req);
    }

    @PutMapping("/{id}")
    public RolDto actualizar(@PathVariable String id, @RequestBody RolRequest req) {
        return rolService.actualizar(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable String id) {
        rolService.eliminar(id);
    }
}
