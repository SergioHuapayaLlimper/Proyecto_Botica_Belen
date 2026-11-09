package pe.upn.boticabelen.repository;

import static pe.upn.boticabelen.repository.SqlNativo.*;

import jakarta.persistence.Tuple;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Repository;
import pe.upn.boticabelen.dto.Respuestas.CategoriaPublicaDto;
import pe.upn.boticabelen.dto.Respuestas.ProductoPublicoDto;

/** Consultas del catálogo público (solo productos activos y de venta libre). */
@Repository
public class CatalogoConsultaRepository {

    private static final String PUBLICO = "p.estadoProducto = 'Activo' AND p.requiere_receta = 0";

    private static final Map<String, String> ORDENES = Map.of(
            "nombre_asc", "p.nombreProducto ASC",
            "nombre_desc", "p.nombreProducto DESC",
            "precio_asc", "p.precioProducto ASC",
            "precio_desc", "p.precioProducto DESC");

    private static final String CAMPOS = """
            p.idProducto, p.idCategoria, c.nombreCategoria, p.codigoProducto, p.nombreProducto, p.principioActivo, p.descripcionProducto,
            p.precioProducto, p.stock, p.imagenURL""";

    private final SqlNativo sql;

    public CatalogoConsultaRepository(SqlNativo sql) {
        this.sql = sql;
    }

    public record FiltroCatalogo(String q, int categoria, boolean disponibles, String orden, int limite, int pagina) {}

    public List<CategoriaPublicaDto> categorias() {
        return sql.lista("""
                SELECT c.idCategoria, c.nombreCategoria, COUNT(p.idProducto) AS productos
                FROM categoria c
                LEFT JOIN producto p ON p.idCategoria = c.idCategoria AND %s
                WHERE c.estadoCategoria = 'Activo'
                GROUP BY c.idCategoria, c.nombreCategoria
                ORDER BY c.nombreCategoria""".formatted(PUBLICO))
                .stream()
                .map(t -> new CategoriaPublicaDto(entero(t, "idCategoria"), texto(t, "nombreCategoria"), largo(t, "productos")))
                .toList();
    }

    public long contar(FiltroCatalogo f) {
        Map<String, Object> params = new HashMap<>();
        String from = from(f, params);
        return sql.uno("SELECT COUNT(*) AS total " + from, params).map(t -> largo(t, "total")).orElse(0L);
    }

    public List<ProductoPublicoDto> buscar(FiltroCatalogo f) {
        Map<String, Object> params = new HashMap<>();
        String from = from(f, params);
        String orden = f.orden() == null ? ORDENES.get("nombre_asc") : ORDENES.getOrDefault(f.orden(), ORDENES.get("nombre_asc"));
        params.put("limite", f.limite());
        params.put("desplazamiento", (f.pagina() - 1) * f.limite());
        // Los agotados van al final para que el cliente vea primero lo que puede comprar.
        return sql.lista("SELECT " + CAMPOS + " " + from + " ORDER BY (p.stock = 0), " + orden
                        + " LIMIT :limite OFFSET :desplazamiento", params)
                .stream().map(CatalogoConsultaRepository::aProducto).toList();
    }

    private String from(FiltroCatalogo f, Map<String, Object> params) {
        List<String> where = new ArrayList<>(List.of(PUBLICO));
        if (!f.q().isEmpty()) {
            // RF05: también por principio activo (buscar "paracetamol" encuentra Panadol).
            where.add("(p.nombreProducto LIKE :q OR p.principioActivo LIKE :q OR p.codigoProducto LIKE :q OR c.nombreCategoria LIKE :q)");
            params.put("q", "%" + f.q() + "%");
        }
        if (f.categoria() > 0) {
            where.add("p.idCategoria = :categoria");
            params.put("categoria", f.categoria());
        }
        if (f.disponibles()) where.add("p.stock > 0");
        return "FROM producto p LEFT JOIN categoria c ON c.idCategoria = p.idCategoria WHERE " + String.join(" AND ", where);
    }

    /** Los más vendidos (excluye pedidos anulados). */
    public List<ProductoPublicoDto> masVendidos(int limite) {
        return sql.lista("""
                SELECT %s, SUM(dp.cantidad) AS vendidos
                FROM producto p
                LEFT JOIN categoria c ON c.idCategoria = p.idCategoria
                JOIN detalle_pedido dp ON dp.idProducto = p.idProducto
                JOIN pedido pe ON pe.idPedido = dp.idPedido AND pe.estadoPedido NOT IN ('Cancelado', 'Rechazado')
                WHERE %s AND p.stock > 0
                GROUP BY p.idProducto, c.nombreCategoria
                ORDER BY vendidos DESC
                LIMIT :limite""".formatted(CAMPOS, PUBLICO), Map.of("limite", limite))
                .stream().map(CatalogoConsultaRepository::aProducto).toList();
    }

    /** Relleno para destacados: productos con más stock, excluyendo los ya elegidos. */
    public List<ProductoPublicoDto> conMasStock(List<Integer> excluir, int limite) {
        Map<String, Object> params = new HashMap<>();
        params.put("limite", limite);
        String extra = "";
        if (!excluir.isEmpty()) {
            extra = "AND p.idProducto NOT IN (:excluir)";
            params.put("excluir", excluir);
        }
        return sql.lista("""
                SELECT %s FROM producto p LEFT JOIN categoria c ON c.idCategoria = p.idCategoria
                WHERE %s AND p.stock > 0 %s
                ORDER BY p.stock DESC, p.nombreProducto LIMIT :limite""".formatted(CAMPOS, PUBLICO, extra), params)
                .stream().map(CatalogoConsultaRepository::aProducto).toList();
    }

    public Optional<ProductoPublicoDto> productoPublico(int id) {
        return sql.uno("SELECT " + CAMPOS + " FROM producto p LEFT JOIN categoria c ON c.idCategoria = p.idCategoria"
                        + " WHERE p.idProducto = :id AND " + PUBLICO, Map.of("id", id))
                .map(CatalogoConsultaRepository::aProducto);
    }

    private static ProductoPublicoDto aProducto(Tuple t) {
        return new ProductoPublicoDto(entero(t, "idProducto"), entero(t, "idCategoria"), texto(t, "nombreCategoria"),
                texto(t, "codigoProducto"), texto(t, "nombreProducto"), texto(t, "principioActivo"), texto(t, "descripcionProducto"),
                decimal(t, "precioProducto"), entero(t, "stock"), texto(t, "imagenURL"));
    }
}
