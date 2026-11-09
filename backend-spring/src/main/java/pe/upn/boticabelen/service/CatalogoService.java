package pe.upn.boticabelen.service;

import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.upn.boticabelen.dto.Respuestas.*;
import pe.upn.boticabelen.excepcion.ApiException;
import pe.upn.boticabelen.repository.CatalogoConsultaRepository;
import pe.upn.boticabelen.repository.CatalogoConsultaRepository.FiltroCatalogo;
import pe.upn.boticabelen.util.Parametros;

/** Catálogo público: categorías, búsqueda paginada, destacados y ficha de producto. */
@Service
@Transactional(readOnly = true)
public class CatalogoService {

    private final CatalogoConsultaRepository catalogo;

    public CatalogoService(CatalogoConsultaRepository catalogo) {
        this.catalogo = catalogo;
    }

    public List<CategoriaPublicaDto> categorias() {
        return catalogo.categorias();
    }

    public PaginaProductosDto buscar(String q, String categoria, String disponibles, String orden, String limite, String pagina) {
        int l = Parametros.entero(limite, 24);
        int lim = Math.min(48, Math.max(1, l == 0 ? 24 : l));
        int pag = Math.max(1, Parametros.entero(pagina, 1));
        FiltroCatalogo filtro = new FiltroCatalogo(Parametros.texto(q, 80), Parametros.entero(categoria, 0),
                "1".equals(disponibles), orden, lim, pag);

        long total = catalogo.contar(filtro);
        List<ProductoPublicoDto> items = catalogo.buscar(filtro);
        int totalPaginas = (int) Math.max(1, (total + lim - 1) / lim);
        return new PaginaProductosDto(items, total, pag, totalPaginas);
    }

    /** Los 8 más vendidos; si no alcanzan, se completa con los de más stock. */
    public List<ProductoPublicoDto> destacados() {
        List<ProductoPublicoDto> lista = new ArrayList<>(catalogo.masVendidos(8));
        if (lista.size() < 8) {
            List<Integer> ids = lista.stream().map(ProductoPublicoDto::idProducto).toList();
            lista.addAll(catalogo.conMasStock(ids, 8 - lista.size()));
        }
        return lista;
    }

    public ProductoPublicoDto producto(String id) {
        return catalogo.productoPublico(Parametros.entero(id, 0))
                .orElseThrow(() -> ApiException.notFound("Producto no encontrado."));
    }
}
