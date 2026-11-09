package pe.upn.boticabelen.repository;

import static pe.upn.boticabelen.repository.SqlNativo.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Repository;
import pe.upn.boticabelen.dto.Respuestas.*;
import pe.upn.boticabelen.util.Negocio;

/** Consultas agregadas del resumen de ventas y del reporte. Las ventas excluyen pedidos anulados. */
@Repository
public class DashboardConsultaRepository {

    private static final String VALIDA = "estadoPedido NOT IN ('Cancelado', 'Rechazado')";
    private static final String RANGO = "DATE(fechaHoraToma) BETWEEN :desde AND :hasta";

    private final SqlNativo sql;

    public DashboardConsultaRepository(SqlNativo sql) {
        this.sql = sql;
    }

    private static Map<String, Object> rango(Negocio.Rango r) {
        return Map.of("desde", r.desde(), "hasta", r.hasta());
    }

    public KpisDto kpis(Negocio.Rango r) {
        String consulta = "SELECT"
                + " (SELECT COUNT(*) FROM pedido WHERE " + RANGO + ") AS pedidos,"
                + " (SELECT COALESCE(SUM(total), 0) FROM pedido WHERE " + RANGO + " AND " + VALIDA + ") AS ventas,"
                + " (SELECT COUNT(*) FROM pedido WHERE " + RANGO + " AND " + VALIDA + ") AS pedidosValidos,"
                + " (SELECT COUNT(*) FROM pedido WHERE estadoPedido = 'Pendiente') AS pendientes,"
                + " (SELECT COUNT(*) FROM usuario WHERE tipo = 'Cliente') AS clientes,"
                + " (SELECT COUNT(*) FROM producto WHERE estadoProducto = 'Activo' AND stock = 0) AS agotados,"
                + " (SELECT COUNT(*) FROM producto WHERE estadoProducto = 'Activo' AND stock BETWEEN 1 AND " + Negocio.STOCK_BAJO + ") AS stockBajo,"
                // RF21: ventas y costo de las líneas con costo registrado (pedidos válidos del periodo)
                + " (SELECT COALESCE(SUM(d.subtotal), 0) FROM detalle_pedido d JOIN pedido p ON p.idPedido = d.idPedido"
                + "   WHERE DATE(p.fechaHoraToma) BETWEEN :desde AND :hasta AND p." + VALIDA + " AND d.costoUnitario IS NOT NULL) AS ventasConCosto,"
                + " (SELECT COALESCE(SUM(d.costoUnitario * d.cantidad), 0) FROM detalle_pedido d JOIN pedido p ON p.idPedido = d.idPedido"
                + "   WHERE DATE(p.fechaHoraToma) BETWEEN :desde AND :hasta AND p." + VALIDA + " AND d.costoUnitario IS NOT NULL) AS costo,"
                // RF22: carritos iniciados y convertidos en reserva
                + " (SELECT COUNT(*) FROM carrito_sesion WHERE DATE(iniciadoEn) BETWEEN :desde AND :hasta) AS carritos,"
                + " (SELECT COUNT(*) FROM carrito_sesion WHERE DATE(iniciadoEn) BETWEEN :desde AND :hasta AND idPedido IS NOT NULL) AS convertidos";
        var t = sql.uno(consulta, rango(r)).orElseThrow();
        BigDecimal ventas = decimal(t, "ventas");
        long validos = largo(t, "pedidosValidos");
        double ticket = validos > 0 ? ventas.divide(BigDecimal.valueOf(validos), 6, RoundingMode.HALF_UP).doubleValue() : 0;
        BigDecimal conCosto = decimal(t, "ventasConCosto");
        BigDecimal costo = decimal(t, "costo").setScale(2, RoundingMode.HALF_UP);
        BigDecimal ganancia = conCosto.subtract(costo).setScale(2, RoundingMode.HALF_UP);
        double margen = conCosto.signum() > 0 ? ganancia.multiply(BigDecimal.valueOf(100)).divide(conCosto, 2, RoundingMode.HALF_UP).doubleValue() : 0;
        long carritos = largo(t, "carritos");
        long convertidos = largo(t, "convertidos");
        double conversion = carritos > 0 ? Math.round(convertidos * 1000.0 / carritos) / 10.0 : 0;
        return new KpisDto(largo(t, "pedidos"), ventas, validos, largo(t, "pendientes"), largo(t, "clientes"),
                largo(t, "agotados"), largo(t, "stockBajo"), ticket,
                costo, ganancia, margen, ventas.subtract(conCosto).max(BigDecimal.ZERO), carritos, convertidos, conversion);
    }

    public List<VentaDiaDto> ventasPorDia(Negocio.Rango r) {
        return sql.lista("SELECT DATE_FORMAT(fechaHoraToma, '%Y-%m-%d') AS dia, COUNT(*) AS pedidos, COALESCE(SUM(total), 0) AS monto"
                        + " FROM pedido WHERE " + RANGO + " AND " + VALIDA
                        + " GROUP BY DATE_FORMAT(fechaHoraToma, '%Y-%m-%d') ORDER BY dia", rango(r))
                .stream().map(t -> new VentaDiaDto(texto(t, "dia"), largo(t, "pedidos"), decimal(t, "monto"))).toList();
    }

    public List<PorEstadoDto> porEstado(Negocio.Rango r) {
        return sql.lista("SELECT estadoPedido AS estado, COUNT(*) AS total FROM pedido WHERE " + RANGO
                        + " GROUP BY estadoPedido ORDER BY total DESC", rango(r))
                .stream().map(t -> new PorEstadoDto(texto(t, "estado"), largo(t, "total"))).toList();
    }

    public List<MetodoPagoDto> metodosPago(Negocio.Rango r) {
        return sql.lista("SELECT metodoPago AS metodo, COUNT(*) AS total FROM pedido WHERE " + RANGO + " AND " + VALIDA
                        + " AND metodoPago IS NOT NULL GROUP BY metodoPago ORDER BY total DESC", rango(r))
                .stream().map(t -> new MetodoPagoDto(texto(t, "metodo"), largo(t, "total"))).toList();
    }

    public List<VentaMesDto> ventasMensuales() {
        return sql.lista("SELECT DATE_FORMAT(fechaHoraToma, '%Y-%m') AS mes, COALESCE(SUM(total), 0) AS monto, COUNT(*) AS pedidos"
                        + " FROM pedido WHERE " + VALIDA + " AND fechaHoraToma >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)"
                        + " GROUP BY DATE_FORMAT(fechaHoraToma, '%Y-%m') ORDER BY mes")
                .stream().map(t -> new VentaMesDto(texto(t, "mes"), decimal(t, "monto"), largo(t, "pedidos"))).toList();
    }

    public List<TopProductoDto> topProductos(Negocio.Rango r) {
        return sql.lista("SELECT d.idProducto, pr.nombreProducto, SUM(d.cantidad) AS unidades, SUM(d.subtotal) AS monto"
                        + " FROM detalle_pedido d"
                        + " JOIN pedido p ON p.idPedido = d.idPedido AND DATE(p.fechaHoraToma) BETWEEN :desde AND :hasta AND p." + VALIDA
                        + " LEFT JOIN producto pr ON pr.idProducto = d.idProducto"
                        + " GROUP BY d.idProducto, pr.nombreProducto ORDER BY unidades DESC LIMIT 6", rango(r))
                .stream().map(t -> new TopProductoDto(entero(t, "idProducto"), texto(t, "nombreProducto"),
                        decimal(t, "unidades"), decimal(t, "monto"))).toList();
    }

    public List<StockBajoDto> stockBajo() {
        return sql.lista("SELECT idProducto, codigoProducto, nombreProducto, stock FROM producto"
                        + " WHERE estadoProducto = 'Activo' AND stock <= " + Negocio.STOCK_BAJO + " ORDER BY stock, nombreProducto LIMIT 8")
                .stream().map(t -> new StockBajoDto(entero(t, "idProducto"), texto(t, "codigoProducto"),
                        texto(t, "nombreProducto"), entero(t, "stock"))).toList();
    }

    /** Pedidos del reporte con filtros opcionales de estado y producto. */
    public List<PedidoReporteDto> reporte(Negocio.Rango r, String estado, int idProducto) {
        List<String> where = new ArrayList<>(List.of("DATE(p.fechaHoraToma) BETWEEN :desde AND :hasta"));
        Map<String, Object> params = new HashMap<>(rango(r));
        if (Negocio.contiene(Negocio.ESTADOS, estado)) {
            where.add("p.estadoPedido = :estado");
            params.put("estado", estado);
        }
        if (idProducto > 0) {
            where.add("EXISTS (SELECT 1 FROM detalle_pedido d WHERE d.idPedido = p.idPedido AND d.idProducto = :producto)");
            params.put("producto", idProducto);
        }
        return sql.lista("SELECT p.idPedido, p.codigoPedido, " + PedidoConsultaRepository.FECHA + " AS fechaHoraToma,"
                        + " p.estadoPedido, p.metodoPago, p.subtotalGeneral, p.igv, p.total, u.nombre AS nombreCliente,"
                        + " (SELECT SUM(d.costoUnitario * d.cantidad) FROM detalle_pedido d WHERE d.idPedido = p.idPedido) AS costo"
                        + " FROM pedido p LEFT JOIN usuario u ON u.idUsuario = p.idUsuario"
                        + " WHERE " + String.join(" AND ", where) + " ORDER BY p.fechaHoraToma DESC", params)
                .stream().map(t -> new PedidoReporteDto(entero(t, "idPedido"), texto(t, "codigoPedido"),
                        texto(t, "fechaHoraToma"), texto(t, "estadoPedido"), texto(t, "metodoPago"),
                        decimal(t, "subtotalGeneral"), decimal(t, "igv"), decimal(t, "total"), texto(t, "nombreCliente"),
                        t.get("costo") == null ? null : decimal(t, "costo").setScale(2, RoundingMode.HALF_UP),
                        t.get("costo") == null ? null : decimal(t, "total").subtract(decimal(t, "costo")).setScale(2, RoundingMode.HALF_UP)))
                .toList();
    }
}
