package pe.upn.boticabelen.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.upn.boticabelen.dto.Respuestas.ProductoDto;
import pe.upn.boticabelen.dto.Solicitudes.ProductoRequest;
import pe.upn.boticabelen.entity.Categoria;
import pe.upn.boticabelen.entity.Producto;
import pe.upn.boticabelen.excepcion.ApiException;
import pe.upn.boticabelen.repository.CategoriaRepository;
import pe.upn.boticabelen.repository.ProductoConsultaRepository;
import pe.upn.boticabelen.repository.ProductoConsultaRepository.FiltroProductos;
import pe.upn.boticabelen.repository.ProductoRepository;
import pe.upn.boticabelen.util.Parametros;
import pe.upn.boticabelen.util.Validador;

/** Productos e inventario del panel de gestión. */
@Service
public class ProductoService {

    private static final Pattern URL = Pattern.compile("^https?://.*", Pattern.CASE_INSENSITIVE);
    private static final BigDecimal PRECIO_MAXIMO = new BigDecimal("100000");

    private final ProductoRepository productoRepository;
    private final CategoriaRepository categoriaRepository;
    private final ProductoConsultaRepository consultas;

    public ProductoService(ProductoRepository productoRepository, CategoriaRepository categoriaRepository,
                           ProductoConsultaRepository consultas) {
        this.productoRepository = productoRepository;
        this.categoriaRepository = categoriaRepository;
        this.consultas = consultas;
    }

    public static ProductoDto aDto(Producto p) {
        Categoria c = p.getCategoria();
        return new ProductoDto(p.getIdProducto(), c == null ? null : c.getIdCategoria(), c == null ? null : c.getNombreCategoria(),
                p.getCodigoProducto(), p.getNombreProducto(), p.getPrincipioActivo(), p.getDescripcionProducto(), p.getPrecioProducto(), p.getStock(),
                p.getEstadoProducto(), Boolean.TRUE.equals(p.getRequiereReceta()) ? 1 : 0, p.getImagenURL(), p.getUbicacionAnaquel());
    }

    /** Siguiente código libre de una categoría: si existe CUI-0003, devuelve CUI-0004. */
    public String siguienteCodigo(Categoria c) {
        Number ultimo = productoRepository.ultimoNumero(c.getPrefijo());
        return c.getPrefijo() + "-" + String.format("%04d", (ultimo == null ? 0 : ultimo.longValue()) + 1);
    }

    @Transactional(readOnly = true)
    public String siguienteCodigo(String idCategoria) {
        Categoria c = categoriaRepository.findById(Parametros.entero(idCategoria, 0))
                .orElseThrow(() -> ApiException.notFound("Categoría no encontrada."));
        return siguienteCodigo(c);
    }

    @Transactional(readOnly = true)
    public List<ProductoDto> listar(String q, String categoria, String stock, String estado, String orden) {
        return consultas.listar(new FiltroProductos(Parametros.texto(q, 80), Parametros.entero(categoria, 0), stock, estado, orden));
    }

    @Transactional(readOnly = true)
    public ProductoDto obtener(String id) {
        return aDto(buscar(Parametros.entero(id, 0)));
    }

    @Transactional
    public ProductoDto crear(ProductoRequest req) {
        Producto p = new Producto();
        aplicar(p, req);
        p.setStock(Validador.entero(req.stock() == null ? 0 : req.stock(), "Stock", 0, 100_000));
        return aDto(productoRepository.save(p));
    }

    @Transactional
    public ProductoDto actualizar(String id, ProductoRequest req) {
        Producto p = buscar(Parametros.entero(id, 0));
        aplicar(p, req);
        return aDto(p);
    }

    /** Fija el stock a un valor exacto (inventario físico). */
    @Transactional
    public ProductoDto fijarStock(String id, Integer stock) {
        int valor = Validador.entero(stock, "Stock", 0, 100_000);
        Producto p = buscar(Parametros.entero(id, 0));
        p.setStock(valor);
        return aDto(p);
    }

    private Producto buscar(int id) {
        return productoRepository.findById(id).orElseThrow(() -> ApiException.notFound("Producto no encontrado."));
    }

    /**
     * Valida los datos del formulario y los copia a la entidad.
     * El código NO lo escribe el usuario: se genera con el prefijo de la categoría (CUI-0004).
     * Si un producto cambia de categoría, recibe el siguiente código de la nueva.
     */
    private void aplicar(Producto p, ProductoRequest req) {
        int idCategoria = Validador.entero(req.idCategoria(), "Categoría", 1, 1_000_000);
        Categoria categoria = categoriaRepository.findById(idCategoria).orElseThrow(() -> ApiException.badRequest("La categoría no existe."));
        boolean cambiaCategoria = p.getCategoria() == null || !p.getCategoria().getIdCategoria().equals(categoria.getIdCategoria());
        if (cambiaCategoria) p.setCodigoProducto(siguienteCodigo(categoria));

        BigDecimal precio = req.precioProducto();
        if (precio == null || precio.signum() <= 0 || precio.compareTo(PRECIO_MAXIMO) >= 0) {
            throw ApiException.badRequest("El precio debe ser mayor a 0.");
        }
        String imagen = Validador.opcional(req.imagenURL(), "Imagen", 255);
        if (imagen != null && !URL.matcher(imagen).matches()) {
            throw ApiException.badRequest("La imagen debe ser una URL que empiece con http:// o https://");
        }

        p.setNombreProducto(Validador.texto(req.nombreProducto(), "Nombre", 3, 100));
        p.setPrincipioActivo(Validador.opcional(req.principioActivo(), "Principio activo", 100));
        p.setDescripcionProducto(Validador.opcional(req.descripcionProducto(), "Descripción", 2000));
        p.setCategoria(categoria);
        p.setPrecioProducto(precio.setScale(2, RoundingMode.HALF_UP));
        p.setEstadoProducto("Inactivo".equals(req.estadoProducto()) ? "Inactivo" : "Activo");
        p.setRequiereReceta(Boolean.TRUE.equals(req.requiere_receta()));
        p.setImagenURL(imagen);
        p.setUbicacionAnaquel(Validador.opcional(req.ubicacionAnaquel(), "Ubicación", 50));
    }
}
