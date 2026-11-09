package pe.upn.boticabelen.controller;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import pe.upn.boticabelen.dto.Respuestas.CategoriaDto;
import pe.upn.boticabelen.dto.Respuestas.CodigoDto;
import pe.upn.boticabelen.dto.Solicitudes.CategoriaRequest;
import pe.upn.boticabelen.seguridad.Permisos;
import pe.upn.boticabelen.seguridad.Requiere;
import pe.upn.boticabelen.service.CategoriaService;
import pe.upn.boticabelen.service.ProductoService;

/** Categorías de productos del panel de gestión. */
@RestController
@RequestMapping("/api/gestion/categorias")
public class CategoriaController {

    private final CategoriaService categoriaService;
    private final ProductoService productoService;

    public CategoriaController(CategoriaService categoriaService, ProductoService productoService) {
        this.categoriaService = categoriaService;
        this.productoService = productoService;
    }

    @Requiere(personal = true) // filtros y formularios de productos
    @GetMapping
    public List<CategoriaDto> listar() {
        return categoriaService.listar();
    }

    /** Código que recibirá el próximo producto de la categoría (vista previa en el formulario). */
    @Requiere(Permisos.PRODUCTOS_EDITAR)
    @GetMapping("/{id}/siguiente-codigo")
    public CodigoDto siguienteCodigo(@PathVariable String id) {
        return new CodigoDto(productoService.siguienteCodigo(id));
    }

    @Requiere(Permisos.CATEGORIAS)
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CategoriaDto crear(@RequestBody CategoriaRequest req) {
        return categoriaService.crear(req);
    }

    @Requiere(Permisos.CATEGORIAS)
    @PutMapping("/{id}")
    public CategoriaDto actualizar(@PathVariable String id, @RequestBody CategoriaRequest req) {
        return categoriaService.actualizar(id, req);
    }

    @Requiere(Permisos.CATEGORIAS)
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable String id) {
        categoriaService.eliminar(id);
    }
}
