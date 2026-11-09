package pe.upn.boticabelen.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.upn.boticabelen.dto.Respuestas.*;
import pe.upn.boticabelen.dto.Solicitudes.EstadoRequest;
import pe.upn.boticabelen.dto.Solicitudes.ItemRequest;
import pe.upn.boticabelen.dto.Solicitudes.PedidoRequest;
import pe.upn.boticabelen.entity.DetallePedido;
import pe.upn.boticabelen.entity.Pedido;
import pe.upn.boticabelen.entity.Producto;
import pe.upn.boticabelen.entity.Usuario;
import pe.upn.boticabelen.excepcion.ApiException;
import pe.upn.boticabelen.repository.PedidoConsultaRepository;
import pe.upn.boticabelen.repository.PedidoRepository;
import pe.upn.boticabelen.repository.ProductoRepository;
import pe.upn.boticabelen.repository.UsuarioRepository;
import pe.upn.boticabelen.seguridad.Permisos;
import pe.upn.boticabelen.util.Negocio;
import pe.upn.boticabelen.util.Parametros;
import pe.upn.boticabelen.util.Validador;

/** Reservas: registrar, consultar, cancelar (cliente) y cambiar de estado (empleado). */
@Service
public class PedidoService {

    private static final DateTimeFormatter CODIGO = DateTimeFormatter.ofPattern("yyMMdd-HHmmss");
    private static final DateTimeFormatter NOTA = DateTimeFormatter.ofPattern("d/M/yyyy, HH:mm:ss");

    private final PedidoRepository pedidoRepository;
    private final ProductoRepository productoRepository;
    private final UsuarioRepository usuarioRepository;
    private final PedidoConsultaRepository consultas;

    public PedidoService(PedidoRepository pedidoRepository, ProductoRepository productoRepository,
                         UsuarioRepository usuarioRepository, PedidoConsultaRepository consultas) {
        this.pedidoRepository = pedidoRepository;
        this.productoRepository = productoRepository;
        this.usuarioRepository = usuarioRepository;
        this.consultas = consultas;
    }

    /**
     * Registrar pedido (reserva).
     * - Precios SIEMPRE desde la BD (el navegador solo envía id y cantidad).
     * - El IGV va incluido en el precio: total = suma; subtotal = total / 1.18.
     * - El stock se APARTA en la misma transacción (SELECT ... FOR UPDATE evita vender dos veces la última unidad).
     */
    @Transactional
    public PedidoCreadoDto registrar(Integer idUsuario, PedidoRequest req) {
        List<ItemRequest> items = (req.items() == null ? List.<ItemRequest>of() : req.items()).stream()
                .map(i -> new ItemRequest(
                        Validador.entero(i == null ? null : i.idProducto(), "Producto", 1, 1_000_000),
                        Validador.entero(i == null ? null : i.cantidad(), "Cantidad", 1, 99)))
                .toList();
        if (items.isEmpty()) throw ApiException.badRequest("El carrito está vacío.");
        if (new HashSet<>(items.stream().map(ItemRequest::idProducto).toList()).size() != items.size()) {
            throw ApiException.badRequest("Hay productos repetidos en el pedido.");
        }
        String metodoPago = Negocio.contiene(Negocio.METODOS_PAGO, req.metodoPago()) ? req.metodoPago() : null;
        if (metodoPago == null) throw ApiException.badRequest("Seleccione un método de pago válido.");
        String observaciones = Validador.opcional(req.observaciones(), "Observaciones", 500);

        Map<Integer, Producto> productos = productoRepository.bloquearPorIds(items.stream().map(ItemRequest::idProducto).toList())
                .stream().collect(Collectors.toMap(Producto::getIdProducto, Function.identity()));

        Pedido pedido = new Pedido();
        BigDecimal total = BigDecimal.ZERO;
        for (ItemRequest item : items) {
            Producto p = productos.get(item.idProducto());
            if (p == null || !"Activo".equals(p.getEstadoProducto())) throw ApiException.conflict("Uno de los productos ya no está disponible.");
            if (Boolean.TRUE.equals(p.getRequiereReceta())) {
                throw ApiException.conflict(p.getNombreProducto() + " requiere receta médica: adquiéralo en tienda.");
            }
            if (p.getStock() < item.cantidad()) {
                throw ApiException.conflict(p.getStock() == 0
                        ? p.getNombreProducto() + " está agotado."
                        : "Solo quedan " + p.getStock() + " unidades de " + p.getNombreProducto() + ".");
            }
            BigDecimal subtotal = Negocio.redondear(p.getPrecioProducto().multiply(BigDecimal.valueOf(item.cantidad())));
            total = total.add(subtotal);

            DetallePedido d = new DetallePedido();
            d.setProducto(p);
            d.setCantidad(item.cantidad());
            d.setPrecioUnitario(p.getPrecioProducto());
            d.setSubtotal(subtotal);
            pedido.agregarDetalle(d);

            p.setStock(p.getStock() - item.cantidad()); // se aparta el stock
        }

        Negocio.Montos montos = Negocio.desgloseIgv(total);
        Usuario cliente = usuarioRepository.findById(idUsuario).orElseThrow(() -> ApiException.notFound("Usuario no encontrado."));
        pedido.setCodigoPedido("BB-" + LocalDateTime.now().format(CODIGO) + "-" + ThreadLocalRandom.current().nextInt(100, 1000));
        pedido.setUsuario(cliente);
        pedido.setEstadoPedido(Negocio.PENDIENTE);
        pedido.setMetodoPago(metodoPago);
        pedido.setObservaciones(observaciones);
        pedido.setSubtotalGeneral(montos.subtotalGeneral());
        pedido.setIgv(montos.igv());
        pedido.setTotal(montos.total());
        pedidoRepository.save(pedido);

        cliente.setCarritoJson(null); // el carrito se vacía al reservar
        return new PedidoCreadoDto(pedido.getIdPedido(), pedido.getCodigoPedido(), montos.subtotalGeneral(), montos.igv(), montos.total());
    }

    @Transactional(readOnly = true)
    public List<PedidoClienteDto> delCliente(Integer idUsuario) {
        return consultas.delCliente(idUsuario);
    }

    /** El cliente solo ve sus pedidos; Admin y Empleado ven todos. */
    @Transactional(readOnly = true)
    public PedidoDetalleDto detalle(String id, Usuario usuario) {
        PedidoDetalleDto pedido = consultas.detalle(Parametros.entero(id, 0)).orElse(null);
        if (pedido == null || (usuario.esCliente() && !pedido.idUsuario().equals(usuario.getIdUsuario()))) {
            throw ApiException.notFound("Pedido no encontrado.");
        }
        if (!usuario.esCliente() && !usuario.puede(Permisos.PEDIDOS) && !usuario.puede(Permisos.MOSTRADOR)) {
            throw ApiException.forbidden("Tu rol no tiene permiso para ver pedidos.");
        }
        return pedido;
    }

    /** El cliente puede cancelar su pedido mientras siga "Pendiente": se devuelve el stock. */
    @Transactional
    public PedidoDetalleDto cancelarPorCliente(String id, Usuario usuario) {
        int idPedido = Parametros.entero(id, 0);
        Pedido pedido = pedidoRepository.bloquearPorId(idPedido).orElse(null);
        if (pedido == null || !pedido.getUsuario().getIdUsuario().equals(usuario.getIdUsuario())) {
            throw ApiException.notFound("Pedido no encontrado.");
        }
        if (!Negocio.PENDIENTE.equals(pedido.getEstadoPedido())) {
            throw ApiException.conflict("Solo puede cancelar pedidos pendientes. Comuníquese con la botica.");
        }
        cambiarEstado(pedido, Negocio.CANCELADO, "Cancelado por el cliente");
        return releer(idPedido);
    }

    // ------------------------------- Gestión -------------------------------

    @Transactional(readOnly = true)
    public List<PedidoGestionDto> bandeja(String estado, String q) {
        return consultas.bandeja(estado == null ? "" : estado, Parametros.texto(q, 60));
    }

    @Transactional(readOnly = true)
    public List<LineaPrepararDto> porPreparar() {
        return consultas.porPreparar();
    }

    @Transactional(readOnly = true)
    public PendientesDto pendientes() {
        return consultas.pendientes();
    }

    /** Solo el Empleado cambia estados (igual que en la versión PHP). */
    @Transactional
    public PedidoDetalleDto cambiarEstadoPorEmpleado(String id, EstadoRequest req, Usuario empleado) {
        int idPedido = Parametros.entero(id, 0);
        String nuevo = req.estado() == null ? "" : req.estado();
        if (!Negocio.ESTADOS.contains(nuevo)) throw ApiException.badRequest("Estado no válido.");
        String motivo = req.motivo() == null ? "" : req.motivo().trim();
        if (Negocio.anulado(nuevo) && motivo.length() < 10) throw ApiException.badRequest("Indique el motivo (mínimo 10 caracteres).");

        Pedido pedido = pedidoRepository.bloquearPorId(idPedido).orElseThrow(() -> ApiException.notFound("Pedido no encontrado."));
        cambiarEstado(pedido, nuevo, motivo.isEmpty() ? null : motivo + " (por " + empleado.getNombre() + ")");
        return releer(idPedido);
    }

    /** Valida la transición. Si se cancela o rechaza, el stock apartado vuelve al inventario. */
    private void cambiarEstado(Pedido pedido, String nuevo, String motivo) {
        if (!Negocio.siguientesEstados(pedido.getEstadoPedido()).contains(nuevo)) {
            throw ApiException.conflict("No se puede pasar de \"" + pedido.getEstadoPedido() + "\" a \"" + nuevo + "\".");
        }
        if (Negocio.anulado(nuevo)) {
            for (DetallePedido d : pedido.getDetalles()) {
                productoRepository.sumarStock(d.getProducto().getIdProducto(), d.getCantidad());
            }
        }
        if (motivo != null) {
            String nota = "[" + nuevo + " " + LocalDateTime.now().format(NOTA) + "] " + motivo;
            String previas = pedido.getObservaciones();
            pedido.setObservaciones(previas == null || previas.isEmpty() ? nota : previas + "\n" + nota);
        }
        pedido.setEstadoPedido(nuevo);
    }

    /** Guarda los cambios pendientes y vuelve a leer el pedido completo. */
    private PedidoDetalleDto releer(int idPedido) {
        pedidoRepository.flush();
        return consultas.detalle(idPedido).orElseThrow(() -> ApiException.notFound("Pedido no encontrado."));
    }
}
