package pe.upn.boticabelen.dto;

import java.math.BigDecimal;
import java.util.List;

/** Cuerpos JSON que recibe la API (lo que envía Angular). */
public final class Solicitudes {

    private Solicitudes() {}

    public record LoginRequest(String email, String password) {}

    public record RegistroRequest(String nombre, String email, String telefono, String password) {}

    public record PerfilRequest(String nombre, String email, String telefono) {}

    public record PasswordRequest(String actual, String nueva) {}

    public record ItemRequest(Integer idProducto, Integer cantidad) {}

    public record CarritoRequest(List<ItemRequest> items) {}

    public record PedidoRequest(List<ItemRequest> items, String metodoPago, String observaciones) {}

    public record EstadoRequest(String estado, String motivo) {}

    public record ProductoRequest(
            String codigoProducto,
            String nombreProducto,
            String principioActivo,
            String descripcionProducto,
            Integer idCategoria,
            BigDecimal precioProducto,
            Integer stock,
            String estadoProducto,
            Boolean requiere_receta,
            String imagenURL,
            String ubicacionAnaquel) {}

    public record StockRequest(Integer stock) {}

    public record CategoriaRequest(String nombreCategoria, String prefijo, String estadoCategoria) {}

    public record EmpleadoRequest(String nombre, String email, String telefono, Integer idRol, Integer estado, String password) {}

    public record RolRequest(String nombre, String descripcion, List<String> permisos) {}
}
