package pe.upn.boticabelen.seguridad;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

/**
 * Catálogo de permisos del panel de gestión: cada uno es una sección o acción que se puede asignar a un rol.
 * El rol Administrador (del sistema) siempre tiene todos.
 */
public final class Permisos {

    private Permisos() {}

    public record Permiso(String clave, String nombre, String descripcion) {}

    public static final String RESUMEN = "resumen";
    public static final String MOSTRADOR = "mostrador";
    public static final String PEDIDOS = "pedidos";
    public static final String PEDIDOS_ESTADO = "pedidos_estado";
    public static final String PRODUCTOS = "productos";
    public static final String PRODUCTOS_EDITAR = "productos_editar";
    public static final String CATEGORIAS = "categorias";
    public static final String REPORTE = "reporte";
    public static final String PERSONAL = "personal";
    public static final String CONFIGURACION = "configuracion";

    public static final List<Permiso> CATALOGO = List.of(
            new Permiso(RESUMEN, "Resumen de ventas", "Ver las ventas del periodo, los gráficos y lo que hay por atender."),
            new Permiso(MOSTRADOR, "Mostrador", "Ver las reservas que llegan y la lista de qué preparar por estante."),
            new Permiso(PEDIDOS, "Pedidos", "Buscar pedidos y ver su detalle."),
            new Permiso(PEDIDOS_ESTADO, "Atender pedidos", "Aceptar, preparar, entregar, rechazar o cancelar pedidos."),
            new Permiso(PRODUCTOS, "Productos y stock", "Consultar el inventario."),
            new Permiso(PRODUCTOS_EDITAR, "Editar productos", "Crear y editar productos, cambiar precios y ajustar el stock."),
            new Permiso(CATEGORIAS, "Categorías", "Crear, editar y desactivar las categorías y su prefijo de código."),
            new Permiso(REPORTE, "Reporte de ventas", "Ver y exportar el reporte de ventas."),
            new Permiso(PERSONAL, "Personal y roles", "Crear cuentas del personal y administrar los roles."),
            new Permiso(CONFIGURACION, "Información del negocio", "Editar dirección, ubicación en el mapa, horario y datos de contacto."));

    public static final List<String> CLAVES = CATALOGO.stream().map(Permiso::clave).toList();

    /**
     * Deja solo permisos válidos, sin repetir y en el orden del catálogo, y agrega los que son necesarios:
     * atender pedidos requiere ver pedidos; editar productos requiere ver productos.
     */
    public static List<String> normalizar(Collection<String> entrada) {
        List<String> lista = new ArrayList<>(CLAVES.stream().filter(entrada::contains).toList());
        if (lista.contains(PEDIDOS_ESTADO) && !lista.contains(PEDIDOS)) lista.add(PEDIDOS);
        if (lista.contains(PRODUCTOS_EDITAR) && !lista.contains(PRODUCTOS)) lista.add(PRODUCTOS);
        return CLAVES.stream().filter(lista::contains).toList();
    }
}
