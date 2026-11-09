package pe.upn.boticabelen.controller;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import pe.upn.boticabelen.dto.Respuestas.*;
import pe.upn.boticabelen.dto.Solicitudes.CarritoRequest;
import pe.upn.boticabelen.dto.Solicitudes.PedidoRequest;
import pe.upn.boticabelen.entity.Usuario;
import pe.upn.boticabelen.seguridad.Requiere;
import pe.upn.boticabelen.seguridad.UsuarioActual;
import pe.upn.boticabelen.service.CarritoService;
import pe.upn.boticabelen.service.PedidoService;

/** Carrito y reservas del cliente. */
@RestController
@RequestMapping("/api")
public class PedidoController {

    private final CarritoService carritoService;
    private final PedidoService pedidoService;

    public PedidoController(CarritoService carritoService, PedidoService pedidoService) {
        this.carritoService = carritoService;
        this.pedidoService = pedidoService;
    }

    @Requiere(cliente = true)
    @GetMapping("/carrito")
    public List<ItemCarritoDto> carrito(@UsuarioActual Usuario usuario) {
        return carritoService.obtener(usuario.getIdUsuario());
    }

    @Requiere(cliente = true)
    @PutMapping("/carrito")
    public List<ItemCarritoDto> guardarCarrito(@UsuarioActual Usuario usuario, @RequestBody CarritoRequest req) {
        return carritoService.guardar(usuario.getIdUsuario(), req.items());
    }

    @Requiere(cliente = true)
    @PostMapping("/pedidos")
    @ResponseStatus(HttpStatus.CREATED)
    public PedidoCreadoDto registrar(@UsuarioActual Usuario usuario, @RequestBody PedidoRequest req) {
        return pedidoService.registrar(usuario.getIdUsuario(), req);
    }

    @Requiere(cliente = true)
    @GetMapping("/pedidos/mios")
    public List<PedidoClienteDto> misPedidos(@UsuarioActual Usuario usuario) {
        return pedidoService.delCliente(usuario.getIdUsuario());
    }

    @Requiere
    @GetMapping("/pedidos/{id}")
    public PedidoDetalleDto detalle(@PathVariable String id, @UsuarioActual Usuario usuario) {
        return pedidoService.detalle(id, usuario);
    }

    @Requiere(cliente = true)
    @PostMapping("/pedidos/{id}/cancelar")
    public PedidoDetalleDto cancelar(@PathVariable String id, @UsuarioActual Usuario usuario) {
        return pedidoService.cancelarPorCliente(id, usuario);
    }
}
