package pe.upn.boticabelen.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * Respuestas JSON de la API. Los nombres de los campos son EXACTAMENTE los que espera Angular
 * (frontend/src/app/core/modelos.ts), por eso algunos usan guion bajo (requiere_receta, intentos_fallidos).
 */
public final class Respuestas {

    private Respuestas() {}

    public record MensajeDto(String message) {}

    public record SaludDto(String estado, String baseDeDatos) {}

    // ---------- Usuarios y sesión ----------
    public record UsuarioDto(Integer idUsuario, String nombre, String email, String telefono, String rol) {}

    public record SesionDto(String token, UsuarioDto usuario) {}

    public record EmpleadoDto(Integer idUsuario, String nombre, String telefono, String email, String rol,
                              Integer estado, Integer intentos_fallidos) {}

    // ---------- Catálogo ----------
    public record CategoriaPublicaDto(Integer idCategoria, String nombreCategoria, Long productos) {}

    public record CategoriaDto(Integer idCategoria, String nombreCategoria, String estadoCategoria) {}

    public record ProductoPublicoDto(Integer idProducto, Integer idCategoria, String nombreCategoria, String codigoProducto,
                                     String nombreProducto, String descripcionProducto, BigDecimal precioProducto,
                                     Integer stock, String imagenURL) {}

    public record PaginaProductosDto(List<ProductoPublicoDto> items, long total, int pagina, int totalPaginas) {}

    /** Producto completo para el panel de gestión. */
    public record ProductoDto(Integer idProducto, Integer idCategoria, String nombreCategoria, String codigoProducto,
                              String nombreProducto, String descripcionProducto, BigDecimal precioProducto, Integer stock,
                              String estadoProducto, Integer requiere_receta, String imagenURL, String ubicacionAnaquel) {}

    // ---------- Carrito y pedidos ----------
    public record ItemCarritoDto(Integer idProducto, String nombreProducto, BigDecimal precioProducto, String imagenURL,
                                 Integer stock, Integer cantidad) {}

    public record PedidoCreadoDto(Integer idPedido, String codigoPedido, BigDecimal subtotalGeneral, BigDecimal igv, BigDecimal total) {}

    /** Fila de "Mis reservas" (cliente). */
    public record PedidoClienteDto(Integer idPedido, String codigoPedido, String fechaHoraToma, String estadoPedido,
                                   String metodoPago, BigDecimal total, Long unidades) {}

    /** Fila de la bandeja de pedidos (gestión). */
    public record PedidoGestionDto(Integer idPedido, String codigoPedido, String fechaHoraToma, String estadoPedido,
                                   String metodoPago, BigDecimal total, String nombreCliente, String telefonoCliente,
                                   Long unidades) {}

    public record DetalleDto(Integer idDetallePedido, Integer idProducto, String nombreProducto, String codigoProducto,
                             String imagenURL, Integer cantidad, BigDecimal precioUnitario, BigDecimal subtotal) {}

    public record PedidoDetalleDto(Integer idPedido, String codigoPedido, Integer idUsuario, String fechaHoraToma,
                                   String estadoPedido, String metodoPago, String observaciones, BigDecimal subtotalGeneral,
                                   BigDecimal igv, BigDecimal total, String nombreCliente, String emailCliente,
                                   String telefonoCliente, List<String> siguientes, List<DetalleDto> detalles) {}

    public record LineaPrepararDto(Integer idPedido, String codigoPedido, String estadoPedido, String fechaHoraToma,
                                   String nombreCliente, Integer idProducto, String codigoProducto, String nombreProducto,
                                   String ubicacionAnaquel, Integer cantidad) {}

    public record PendientesDto(Long pendientes, Integer ultimoId) {}

    // ---------- Dashboard y reporte ----------
    public record KpisDto(Long pedidos, BigDecimal ventas, Long pedidosValidos, Long pendientes, Long clientes,
                          Long agotados, Long stockBajo, double ticketPromedio) {}

    public record VentaDiaDto(String dia, Long pedidos, BigDecimal monto) {}

    public record PorEstadoDto(String estado, Long total) {}

    public record MetodoPagoDto(String metodo, Long total) {}

    public record VentaMesDto(String mes, BigDecimal monto, Long pedidos) {}

    public record TopProductoDto(Integer idProducto, String nombreProducto, BigDecimal unidades, BigDecimal monto) {}

    public record StockBajoDto(Integer idProducto, String codigoProducto, String nombreProducto, Integer stock) {}

    public record DashboardDto(String desde, String hasta, KpisDto kpis, List<VentaDiaDto> ventasPorDia,
                               List<PorEstadoDto> porEstado, List<MetodoPagoDto> metodosPago,
                               List<VentaMesDto> ventasMensuales, List<TopProductoDto> topProductos,
                               List<StockBajoDto> stockBajo) {}

    public record PedidoReporteDto(Integer idPedido, String codigoPedido, String fechaHoraToma, String estadoPedido,
                                   String metodoPago, BigDecimal subtotalGeneral, BigDecimal igv, BigDecimal total,
                                   String nombreCliente) {}

    public record TotalesReporteDto(int cantidad, BigDecimal monto, BigDecimal igv, long entregados, long cancelados) {}

    public record ReporteDto(String desde, String hasta, List<PedidoReporteDto> pedidos, TotalesReporteDto totales) {}
}
