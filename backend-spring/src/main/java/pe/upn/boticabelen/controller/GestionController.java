package pe.upn.boticabelen.controller;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import pe.upn.boticabelen.dto.Respuestas.*;
import pe.upn.boticabelen.dto.Solicitudes.*;
import pe.upn.boticabelen.entity.Usuario;
import pe.upn.boticabelen.seguridad.Permisos;
import pe.upn.boticabelen.seguridad.Requiere;
import pe.upn.boticabelen.seguridad.UsuarioActual;
import pe.upn.boticabelen.service.DashboardService;
import pe.upn.boticabelen.service.EmpleadoService;
import pe.upn.boticabelen.service.PedidoService;
import pe.upn.boticabelen.service.ProductoService;

/**
 * Panel de gestión. Cada endpoint exige un permiso del rol (ver seguridad/Permisos).
 */
@RestController
@RequestMapping("/api/gestion")
public class GestionController {

    private final PedidoService pedidoService;
    private final ProductoService productoService;
    private final EmpleadoService empleadoService;
    private final DashboardService dashboardService;

    public GestionController(PedidoService pedidoService, ProductoService productoService,
                             EmpleadoService empleadoService, DashboardService dashboardService) {
        this.pedidoService = pedidoService;
        this.productoService = productoService;
        this.empleadoService = empleadoService;
        this.dashboardService = dashboardService;
    }

    // ============================ PEDIDOS ============================
    @Requiere({Permisos.PEDIDOS, Permisos.MOSTRADOR})
    @GetMapping("/pedidos")
    public List<PedidoGestionDto> pedidos(@RequestParam(required = false) String estado, @RequestParam(required = false) String q) {
        return pedidoService.bandeja(estado, q);
    }

    @Requiere(Permisos.MOSTRADOR)
    @GetMapping("/preparar")
    public List<LineaPrepararDto> preparar() {
        return pedidoService.porPreparar();
    }

    @Requiere(personal = true) // aviso de reservas nuevas en el menú: para todo el personal
    @GetMapping("/pedidos/resumen")
    public PendientesDto resumenPedidos() {
        return pedidoService.pendientes();
    }

    @Requiere(Permisos.PEDIDOS_ESTADO)
    @PatchMapping("/pedidos/{id}/detalles/{idDetalle}")
    public PedidoDetalleDto marcarPreparado(@PathVariable String id, @PathVariable String idDetalle, @RequestBody PreparadoRequest req) {
        return pedidoService.marcarPreparado(id, idDetalle, req.preparado());
    }

    @Requiere(Permisos.PEDIDOS_ESTADO)
    @PatchMapping("/pedidos/{id}/estado")
    public PedidoDetalleDto cambiarEstado(@PathVariable String id, @RequestBody EstadoRequest req, @UsuarioActual Usuario usuario) {
        return pedidoService.cambiarEstadoPorEmpleado(id, req, usuario);
    }

    // ============================ PRODUCTOS ============================
    @Requiere({Permisos.PRODUCTOS, Permisos.PRODUCTOS_EDITAR, Permisos.REPORTE}) // el reporte filtra por producto
    @GetMapping("/productos")
    public List<ProductoDto> productos(@RequestParam(required = false) String q,
                                       @RequestParam(required = false) String categoria,
                                       @RequestParam(required = false) String stock,
                                       @RequestParam(required = false) String estado,
                                       @RequestParam(required = false) String orden) {
        return productoService.listar(q, categoria, stock, estado, orden);
    }

    @Requiere({Permisos.PRODUCTOS, Permisos.PRODUCTOS_EDITAR})
    @GetMapping("/productos/{id}")
    public ProductoDto producto(@PathVariable String id) {
        return productoService.obtener(id);
    }

    @Requiere(Permisos.PRODUCTOS_EDITAR)
    @PostMapping("/productos")
    @ResponseStatus(HttpStatus.CREATED)
    public ProductoDto crearProducto(@RequestBody ProductoRequest req) {
        return productoService.crear(req);
    }

    @Requiere(Permisos.PRODUCTOS_EDITAR)
    @PutMapping("/productos/{id}")
    public ProductoDto actualizarProducto(@PathVariable String id, @RequestBody ProductoRequest req) {
        return productoService.actualizar(id, req);
    }

    @Requiere(Permisos.PRODUCTOS_EDITAR)
    @PatchMapping("/productos/{id}/stock")
    public ProductoDto fijarStock(@PathVariable String id, @RequestBody StockRequest req) {
        return productoService.fijarStock(id, req.stock());
    }

    // ============================ PERSONAL ============================
    @Requiere(Permisos.PERSONAL)
    @GetMapping("/empleados")
    public List<EmpleadoDto> empleados() {
        return empleadoService.listar();
    }

    @Requiere(Permisos.PERSONAL)
    @PostMapping("/empleados")
    @ResponseStatus(HttpStatus.CREATED)
    public EmpleadoDto crearEmpleado(@RequestBody EmpleadoRequest req) {
        return empleadoService.crear(req);
    }

    @Requiere(Permisos.PERSONAL)
    @PutMapping("/empleados/{id}")
    public EmpleadoDto actualizarEmpleado(@PathVariable String id, @RequestBody EmpleadoRequest req, @UsuarioActual Usuario usuario) {
        return empleadoService.actualizar(id, req, usuario);
    }

    @Requiere(Permisos.PERSONAL)
    @DeleteMapping("/empleados/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminarEmpleado(@PathVariable String id, @UsuarioActual Usuario usuario) {
        empleadoService.eliminar(id, usuario);
    }

    // ============================ RESUMEN Y REPORTE ============================
    @Requiere(Permisos.RESUMEN)
    @GetMapping("/dashboard")
    public DashboardDto dashboard(@RequestParam(required = false) String desde, @RequestParam(required = false) String hasta) {
        return dashboardService.resumen(desde, hasta);
    }

    @Requiere(Permisos.REPORTE)
    @GetMapping("/reporte")
    public ReporteDto reporte(@RequestParam(required = false) String desde, @RequestParam(required = false) String hasta,
                              @RequestParam(required = false) String estado, @RequestParam(required = false) String producto) {
        return dashboardService.reporte(desde, hasta, estado, producto);
    }
}
