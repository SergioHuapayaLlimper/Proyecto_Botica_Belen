package pe.upn.boticabelen.repository;

import static pe.upn.boticabelen.repository.SqlNativo.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Repository;
import pe.upn.boticabelen.dto.Respuestas.*;
import pe.upn.boticabelen.util.Negocio;

/** Consultas de lectura de pedidos (con JOIN a usuario, detalle y producto). */
@Repository
public class PedidoConsultaRepository {

    /** Fecha como texto 'AAAA-MM-DD HH:MM:SS' (el formato que usa Angular). */
    static final String FECHA = "DATE_FORMAT(p.fechaHoraToma, '%Y-%m-%d %H:%i:%s')";

    private static final String UNIDADES =
            "(SELECT COALESCE(SUM(cantidad), 0) FROM detalle_pedido d WHERE d.idPedido = p.idPedido)";

    private final SqlNativo sql;

    public PedidoConsultaRepository(SqlNativo sql) {
        this.sql = sql;
    }

    public List<PedidoClienteDto> delCliente(int idUsuario) {
        return sql.lista("""
                SELECT p.idPedido, p.codigoPedido, %s AS fechaHoraToma, p.estadoPedido, p.metodoPago, p.total,
                       %s AS unidades
                FROM pedido p WHERE p.idUsuario = :idUsuario ORDER BY p.fechaHoraToma DESC""".formatted(FECHA, UNIDADES),
                Map.of("idUsuario", idUsuario))
                .stream()
                .map(t -> new PedidoClienteDto(entero(t, "idPedido"), texto(t, "codigoPedido"), texto(t, "fechaHoraToma"),
                        texto(t, "estadoPedido"), texto(t, "metodoPago"), decimal(t, "total"), largo(t, "unidades")))
                .toList();
    }

    public Optional<PedidoDetalleDto> detalle(int idPedido) {
        Optional<jakarta.persistence.Tuple> fila = sql.uno("""
                SELECT p.idPedido, p.codigoPedido, p.idUsuario, %s AS fechaHoraToma, p.estadoPedido, p.metodoPago,
                       p.observaciones, p.subtotalGeneral, p.igv, p.total,
                       u.nombre AS nombreCliente, u.email AS emailCliente, u.telefono AS telefonoCliente
                FROM pedido p LEFT JOIN usuario u ON u.idUsuario = p.idUsuario WHERE p.idPedido = :id""".formatted(FECHA),
                Map.of("id", idPedido));
        if (fila.isEmpty()) return Optional.empty();
        var t = fila.get();

        List<DetalleDto> detalles = sql.lista("""
                SELECT d.idDetallePedido, d.idProducto, pr.nombreProducto, pr.codigoProducto, pr.imagenURL,
                       d.cantidad, d.precioUnitario, d.subtotal, d.preparado
                FROM detalle_pedido d LEFT JOIN producto pr ON pr.idProducto = d.idProducto
                WHERE d.idPedido = :id ORDER BY pr.nombreProducto""", Map.of("id", idPedido))
                .stream()
                .map(x -> new DetalleDto(entero(x, "idDetallePedido"), entero(x, "idProducto"), texto(x, "nombreProducto"),
                        texto(x, "codigoProducto"), texto(x, "imagenURL"), entero(x, "cantidad"),
                        decimal(x, "precioUnitario"), decimal(x, "subtotal"), bandera(x, "preparado") == 1))
                .toList();

        String estado = texto(t, "estadoPedido");
        return Optional.of(new PedidoDetalleDto(entero(t, "idPedido"), texto(t, "codigoPedido"), entero(t, "idUsuario"),
                texto(t, "fechaHoraToma"), estado, texto(t, "metodoPago"), texto(t, "observaciones"),
                decimal(t, "subtotalGeneral"), decimal(t, "igv"), decimal(t, "total"), texto(t, "nombreCliente"),
                texto(t, "emailCliente"), texto(t, "telefonoCliente"), Negocio.siguientesEstados(estado), detalles));
    }

    /** Bandeja de pedidos del panel. estado: un estado concreto, "activos" o vacío (todos). */
    public List<PedidoGestionDto> bandeja(String estado, String q) {
        List<String> where = new ArrayList<>(List.of("1 = 1"));
        Map<String, Object> params = new HashMap<>();
        if (Negocio.contiene(Negocio.ESTADOS, estado)) {
            where.add("p.estadoPedido = :estado");
            params.put("estado", estado);
        } else if ("activos".equals(estado)) {
            where.add("p.estadoPedido NOT IN ('Entregado', 'Cancelado', 'Rechazado')");
        }
        if (!q.isEmpty()) {
            where.add("(p.codigoPedido LIKE :q OR u.nombre LIKE :q OR u.email LIKE :q)");
            params.put("q", "%" + q + "%");
        }
        return sql.lista("""
                SELECT p.idPedido, p.codigoPedido, %s AS fechaHoraToma, p.estadoPedido, p.metodoPago, p.total,
                       u.nombre AS nombreCliente, u.telefono AS telefonoCliente, %s AS unidades
                FROM pedido p LEFT JOIN usuario u ON u.idUsuario = p.idUsuario
                WHERE %s
                ORDER BY FIELD(p.estadoPedido, 'Pendiente') DESC, p.fechaHoraToma DESC
                LIMIT 300""".formatted(FECHA, UNIDADES, String.join(" AND ", where)), params)
                .stream()
                .map(t -> new PedidoGestionDto(entero(t, "idPedido"), texto(t, "codigoPedido"), texto(t, "fechaHoraToma"),
                        texto(t, "estadoPedido"), texto(t, "metodoPago"), decimal(t, "total"), texto(t, "nombreCliente"),
                        texto(t, "telefonoCliente"), largo(t, "unidades")))
                .toList();
    }

    /** "Qué preparar ahora": productos de pedidos aceptados o en preparación, con su ubicación en anaquel. */
    public List<LineaPrepararDto> porPreparar() {
        return sql.lista("""
                SELECT p.idPedido, p.codigoPedido, p.estadoPedido, %s AS fechaHoraToma, u.nombre AS nombreCliente,
                       d.idDetallePedido, d.idProducto, pr.codigoProducto, pr.nombreProducto, pr.ubicacionAnaquel,
                       d.cantidad, d.preparado
                FROM pedido p
                JOIN detalle_pedido d ON d.idPedido = p.idPedido
                LEFT JOIN producto pr ON pr.idProducto = d.idProducto
                LEFT JOIN usuario u ON u.idUsuario = p.idUsuario
                WHERE p.estadoPedido IN ('Aceptado', 'En preparación')
                ORDER BY pr.ubicacionAnaquel, pr.nombreProducto, p.fechaHoraToma""".formatted(FECHA))
                .stream()
                .map(t -> new LineaPrepararDto(entero(t, "idPedido"), texto(t, "codigoPedido"), texto(t, "estadoPedido"),
                        texto(t, "fechaHoraToma"), texto(t, "nombreCliente"), entero(t, "idDetallePedido"),
                        entero(t, "idProducto"), texto(t, "codigoProducto"), texto(t, "nombreProducto"),
                        texto(t, "ubicacionAnaquel"), entero(t, "cantidad"), bandera(t, "preparado") == 1))
                .toList();
    }

    public PendientesDto pendientes() {
        return sql.uno("SELECT COUNT(*) AS pendientes, MAX(idPedido) AS ultimoId FROM pedido WHERE estadoPedido = 'Pendiente'", Map.of())
                .map(t -> new PendientesDto(largo(t, "pendientes"), entero(t, "ultimoId")))
                .orElse(new PendientesDto(0L, null));
    }
}
