package pe.upn.boticabelen.controller;

import java.util.List;
import org.springframework.web.bind.annotation.*;
import pe.upn.boticabelen.dto.Respuestas.*;
import pe.upn.boticabelen.service.CatalogoService;

/** Catálogo público (no requiere sesión). */
@RestController
@RequestMapping("/api")
public class CatalogoController {

    private final CatalogoService catalogoService;

    public CatalogoController(CatalogoService catalogoService) {
        this.catalogoService = catalogoService;
    }

    @GetMapping("/categorias")
    public List<CategoriaPublicaDto> categorias() {
        return catalogoService.categorias();
    }

    @GetMapping("/productos")
    public PaginaProductosDto productos(@RequestParam(required = false) String q,
                                        @RequestParam(required = false) String categoria,
                                        @RequestParam(required = false) String disponibles,
                                        @RequestParam(required = false) String orden,
                                        @RequestParam(required = false) String limite,
                                        @RequestParam(required = false) String pagina) {
        return catalogoService.buscar(q, categoria, disponibles, orden, limite, pagina);
    }

    @GetMapping("/productos/destacados")
    public List<ProductoPublicoDto> destacados() {
        return catalogoService.destacados();
    }

    @GetMapping("/productos/{id}")
    public ProductoPublicoDto producto(@PathVariable String id) {
        return catalogoService.producto(id);
    }
}
