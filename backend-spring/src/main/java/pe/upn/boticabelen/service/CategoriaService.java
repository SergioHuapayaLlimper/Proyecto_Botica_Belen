package pe.upn.boticabelen.service;

import java.text.Normalizer;
import java.util.List;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.upn.boticabelen.dto.Respuestas.CategoriaDto;
import pe.upn.boticabelen.dto.Solicitudes.CategoriaRequest;
import pe.upn.boticabelen.entity.Categoria;
import pe.upn.boticabelen.entity.Producto;
import pe.upn.boticabelen.excepcion.ApiException;
import pe.upn.boticabelen.repository.CategoriaRepository;
import pe.upn.boticabelen.repository.ProductoRepository;
import pe.upn.boticabelen.util.Parametros;
import pe.upn.boticabelen.util.Validador;

/**
 * Categorías de productos. Cada una tiene un prefijo (CUI, MED...) con el que se generan
 * los códigos de sus productos: CUI-0001, CUI-0002...
 */
@Service
public class CategoriaService {

    private static final Pattern PREFIJO = Pattern.compile("^[A-Z]{2,5}$");

    private final CategoriaRepository categoriaRepository;
    private final ProductoRepository productoRepository;

    public CategoriaService(CategoriaRepository categoriaRepository, ProductoRepository productoRepository) {
        this.categoriaRepository = categoriaRepository;
        this.productoRepository = productoRepository;
    }

    private CategoriaDto aDto(Categoria c) {
        return new CategoriaDto(c.getIdCategoria(), c.getNombreCategoria(), c.getEstadoCategoria(), c.getPrefijo(),
                productoRepository.countByCategoriaIdCategoria(c.getIdCategoria()));
    }

    @Transactional(readOnly = true)
    public List<CategoriaDto> listar() {
        return categoriaRepository.findAllByOrderByNombreCategoriaAsc().stream().map(this::aDto).toList();
    }

    @Transactional
    public CategoriaDto crear(CategoriaRequest req) {
        Categoria c = new Categoria();
        aplicar(c, req, 0);
        return aDto(categoriaRepository.saveAndFlush(c));
    }

    @Transactional
    public CategoriaDto actualizar(String id, CategoriaRequest req) {
        Categoria c = buscar(id);
        String prefijoAnterior = c.getPrefijo();
        aplicar(c, req, c.getIdCategoria());
        if (!c.getPrefijo().equals(prefijoAnterior)) recodificar(c);
        return aDto(c);
    }

    @Transactional
    public void eliminar(String id) {
        Categoria c = buscar(id);
        long productos = productoRepository.countByCategoriaIdCategoria(c.getIdCategoria());
        if (productos > 0) {
            throw ApiException.conflict("Tiene " + (productos == 1 ? "1 producto" : productos + " productos")
                    + ": desactívala o pasa sus productos a otra categoría.");
        }
        categoriaRepository.delete(c);
    }

    private Categoria buscar(String id) {
        return categoriaRepository.findById(Parametros.entero(id, 0))
                .orElseThrow(() -> ApiException.notFound("Categoría no encontrada."));
    }

    private void aplicar(Categoria c, CategoriaRequest req, int idActual) {
        String nombre = Validador.texto(req.nombreCategoria(), "Nombre", 3, 100);
        if (categoriaRepository.existsByNombreCategoriaIgnoreCaseAndIdCategoriaNot(nombre, idActual)) {
            throw ApiException.conflict("Ya existe una categoría con ese nombre.");
        }
        String prefijo = sinTildes(req.prefijo() == null ? "" : req.prefijo().trim()).toUpperCase();
        if (!PREFIJO.matcher(prefijo).matches()) {
            throw ApiException.badRequest("El prefijo debe tener de 2 a 5 letras, sin números ni espacios (por ejemplo, CUI).");
        }
        if (categoriaRepository.existsByPrefijoAndIdCategoriaNot(prefijo, idActual)) {
            throw ApiException.conflict("El prefijo " + prefijo + " ya lo usa otra categoría.");
        }
        c.setNombreCategoria(nombre);
        c.setPrefijo(prefijo);
        c.setEstadoCategoria("Inactivo".equals(req.estadoCategoria()) ? "Inactivo" : "Activo");
    }

    /** Al cambiar el prefijo, los productos de la categoría se renumeran con el nuevo (en el mismo orden). */
    private void recodificar(Categoria c) {
        List<Producto> productos = productoRepository.findByCategoriaIdCategoriaOrderByIdProductoAsc(c.getIdCategoria());
        if (productos.isEmpty()) return;
        // Paso 1: códigos temporales para no chocar con la restricción UNIQUE.
        productos.forEach(p -> p.setCodigoProducto("TMP-" + p.getIdProducto()));
        productoRepository.flush();
        Number ultimo = productoRepository.ultimoNumero(c.getPrefijo());
        long n = ultimo == null ? 0 : ultimo.longValue();
        for (Producto p : productos) {
            p.setCodigoProducto(c.getPrefijo() + "-" + String.format("%04d", ++n));
        }
    }

    private static String sinTildes(String texto) {
        return Normalizer.normalize(texto, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
    }
}
