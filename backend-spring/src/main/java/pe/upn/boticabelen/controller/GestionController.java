package pe.upn.boticabelen.controller;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import pe.upn.boticabelen.dto.Respuestas.*;
import pe.upn.boticabelen.dto.Solicitudes.*;
import pe.upn.boticabelen.entity.Usuario;
import pe.upn.boticabelen.seguridad.Requiere;
import pe.upn.boticabelen.seguridad.UsuarioActual;
import pe.upn.boticabelen.service.DashboardService;
import pe.upn.boticabelen.service.EmpleadoService;
import pe.upn.boticabelen.service.PedidoService;
import pe.upn.boticabelen.service.ProductoService;

/**
 * Panel de gestión.
 * - Pedidos: Admin y Empleado consultan; solo el Empleado cambia estados.
 * - Productos: Admin y Empleado consultan; solo Admin crea, edita y ajusta stock.
 * - Personal, resumen y reporte: solo Admin.
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
    @Requiere({"Admin", "Empleado"})
    @GetMapping("/pedidos")
    public List<PedidoGestionDto> pedidos(@RequestParam(required = false) String estado, @RequestParam(required = false) String q) {
        return pedidoService.bandeja(estado, q);
    }

    @Requiere({"Admin", "Empleado"})
    @GetMapping("/preparar")
    public List<LineaPrepararDto> preparar() {
        return pedidoService.porPreparar();
    }

    @Requiere({"Admin", "Empleado"})
    @GetMapping("/pedidos/resumen")
    public PendientesDto resumenPedidos() {
        return pedidoService.pendientes();
    }

    @Requiere("Empleado")
    @PatchMapping("/pedidos/{id}/estado")
    public PedidoDetalleDto cambiarEstado(@PathVariable String id, @RequestBody EstadoRequest req, @UsuarioActual Usuario usuario) {
        return pedidoService.cambiarEstadoPorEmpleado(id, req, usuario);
    }

    // ============================ PRODUCTOS ============================
    @Requiere({"Admin", "Empleado"})
    @GetMapping("/categorias")
    public List<CategoriaDto> categorias() {
        return productoService.categorias();
    }

    @Requiere({"Admin", "Empleado"})
    @GetMapping("/productos")
    public List<ProductoDto> productos(@RequestParam(required = false) String q,
                                       @RequestParam(required = false) String categoria,
                                       @RequestParam(required = false) String stock,
                                       @RequestParam(required = false) String estado,
                                       @RequestParam(required = false) String orden) {
        return productoService.listar(q, categoria, stock, estado, orden);
    }

    @Requiere({"Admin", "Empleado"})
    @GetMapping("/productos/{id}")
    public ProductoDto producto(@PathVariable String id) {
        return productoService.obtener(id);
    }

    @Requiere("Admin")
    @PostMapping("/productos")
    @ResponseStatus(HttpStatus.CREATED)
    public ProductoDto crearProducto(@RequestBody ProductoRequest req) {
        return productoService.crear(req);
    }

    @Requiere("Admin")
    @PutMapping("/productos/{id}")
    public ProductoDto actualizarProducto(@PathVariable String id, @RequestBody ProductoRequest req) {
        return productoService.actualizar(id, req);
    }

    @Requiere("Admin")
    @PatchMapping("/productos/{id}/stock")
    public ProductoDto fijarStock(@PathVariable String id, @RequestBody StockRequest req) {
        return productoService.fijarStock(id, req.stock());
    }

    // ============================ PERSONAL ============================
    @Requiere("Admin")
    @GetMapping("/empleados")
    public List<EmpleadoDto> empleados() {
        return empleadoService.listar();
    }

    @Requiere("Admin")
    @PostMapping("/empleados")
    @ResponseStatus(HttpStatus.CREATED)
    public EmpleadoDto crearEmpleado(@RequestBody EmpleadoRequest req) {
        return empleadoService.crear(req);
    }

    @Requiere("Admin")
    @PutMapping("/empleados/{id}")
    public EmpleadoDto actualizarEmpleado(@PathVariable String id, @RequestBody EmpleadoRequest req, @UsuarioActual Usuario usuario) {
        return empleadoService.actualizar(id, req, usuario);
    }

    @Requiere("Admin")
    @DeleteMapping("/empleados/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminarEmpleado(@PathVariable String id, @UsuarioActual Usuario usuario) {
        empleadoService.eliminar(id, usuario);
    }

    // ============================ RESUMEN Y REPORTE ============================
    @Requiere("Admin")
    @GetMapping("/dashboard")
    public DashboardDto dashboard(@RequestParam(required = false) String desde, @RequestParam(required = false) String hasta) {
        return dashboardService.resumen(desde, hasta);
    }

    @Requiere("Admin")
    @GetMapping("/reporte")
    public ReporteDto reporte(@RequestParam(required = false) String desde, @RequestParam(required = false) String hasta,
                              @RequestParam(required = false) String estado, @RequestParam(required = false) String producto) {
        return dashboardService.reporte(desde, hasta, estado, producto);
    }
}
