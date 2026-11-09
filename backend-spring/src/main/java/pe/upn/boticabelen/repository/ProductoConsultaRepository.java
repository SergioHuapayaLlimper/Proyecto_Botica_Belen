package pe.upn.boticabelen.repository;

import static pe.upn.boticabelen.repository.SqlNativo.*;

import jakarta.persistence.Tuple;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Repository;
import pe.upn.boticabelen.dto.Respuestas.ProductoDto;
import pe.upn.boticabelen.util.Negocio;

/** Listado de productos del panel de gestión (con filtros y orden). */
@Repository
public class ProductoConsultaRepository {

    private static final Map<String, String> ORDENES = Map.of(
            "nombre_asc", "p.nombreProducto ASC",
            "nombre_desc", "p.nombreProducto DESC",
            "precio_asc", "p.precioProducto ASC",
            "precio_desc", "p.precioProducto DESC",
            "stock_asc", "p.stock ASC",
            "stock_desc", "p.stock DESC");

    private final SqlNativo sql;

    public ProductoConsultaRepository(SqlNativo sql) {
        this.sql = sql;
    }

    public record FiltroProductos(String q, int categoria, String stock, String estado, String orden) {}

    public List<ProductoDto> listar(FiltroProductos f) {
        List<String> where = new ArrayList<>(List.of("1 = 1"));
        Map<String, Object> params = new HashMap<>();
        if (!f.q().isEmpty()) {
            where.add("(p.nombreProducto LIKE :q OR p.principioActivo LIKE :q OR p.codigoProducto LIKE :q OR c.nombreCategoria LIKE :q)");
            params.put("q", "%" + f.q() + "%");
        }
        if (f.categoria() > 0) {
            where.add("p.idCategoria = :categoria");
            params.put("categoria", f.categoria());
        }
        if ("agotado".equals(f.stock())) where.add("p.stock = 0");
        if ("bajo".equals(f.stock())) where.add("p.stock BETWEEN 1 AND " + Negocio.STOCK_BAJO);
        if ("Activo".equals(f.estado()) || "Inactivo".equals(f.estado())) {
            where.add("p.estadoProducto = :estado");
            params.put("estado", f.estado());
        }
        String orden = f.orden() == null ? ORDENES.get("nombre_asc") : ORDENES.getOrDefault(f.orden(), ORDENES.get("nombre_asc"));
        return sql.lista("SELECT p.*, c.nombreCategoria FROM producto p LEFT JOIN categoria c ON c.idCategoria = p.idCategoria"
                        + " WHERE " + String.join(" AND ", where) + " ORDER BY " + orden, params)
                .stream().map(ProductoConsultaRepository::aProducto).toList();
    }

    private static ProductoDto aProducto(Tuple t) {
        return new ProductoDto(entero(t, "idProducto"), entero(t, "idCategoria"), texto(t, "nombreCategoria"),
                texto(t, "codigoProducto"), texto(t, "nombreProducto"), texto(t, "principioActivo"), texto(t, "descripcionProducto"),
                decimal(t, "precioProducto"), t.get("costoProducto") == null ? null : decimal(t, "costoProducto"),
                entero(t, "stock"), texto(t, "estadoProducto"),
                bandera(t, "requiere_receta"), texto(t, "imagenURL"), texto(t, "ubicacionAnaquel"));
    }
}
