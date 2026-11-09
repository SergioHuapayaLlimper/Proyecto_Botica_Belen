package pe.upn.boticabelen.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.upn.boticabelen.dto.Respuestas.ItemCarritoDto;
import pe.upn.boticabelen.dto.Solicitudes.ItemRequest;
import pe.upn.boticabelen.entity.Producto;
import pe.upn.boticabelen.entity.Usuario;
import pe.upn.boticabelen.excepcion.ApiException;
import pe.upn.boticabelen.repository.ProductoRepository;
import pe.upn.boticabelen.repository.UsuarioRepository;

/**
 * Carrito del cliente. Se guarda en usuario.carrito_json con el MISMO formato que la versión PHP:
 * { "idProducto": { idProducto, nombre, precio, cantidad } }.
 */
@Service
public class CarritoService {

    private record Item(int idProducto, int cantidad) {}

    private final UsuarioRepository usuarioRepository;
    private final ProductoRepository productoRepository;
    private final ObjectMapper mapper;

    public CarritoService(UsuarioRepository usuarioRepository, ProductoRepository productoRepository, ObjectMapper mapper) {
        this.usuarioRepository = usuarioRepository;
        this.productoRepository = productoRepository;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public List<ItemCarritoDto> obtener(Integer idUsuario) {
        Usuario u = usuarioRepository.findById(idUsuario).orElseThrow(() -> ApiException.notFound("Usuario no encontrado."));
        return detallar(leerJson(u.getCarritoJson()));
    }

    @Transactional
    public List<ItemCarritoDto> guardar(Integer idUsuario, List<ItemRequest> solicitud) {
        List<Item> items = (solicitud == null ? List.<ItemRequest>of() : solicitud).stream()
                .filter(i -> i != null && i.idProducto() != null && i.cantidad() != null)
                .map(i -> new Item(i.idProducto(), Math.min(99, i.cantidad())))
                .filter(i -> i.idProducto() > 0 && i.cantidad() > 0)
                .limit(60)
                .toList();
        List<ItemCarritoDto> detalle = detallar(items);

        String json = null;
        if (!detalle.isEmpty()) {
            Map<String, Object> mapa = new LinkedHashMap<>();
            for (ItemCarritoDto d : detalle) {
                Map<String, Object> linea = new LinkedHashMap<>();
                linea.put("idProducto", d.idProducto());
                linea.put("nombre", d.nombreProducto());
                linea.put("precio", d.precioProducto());
                linea.put("cantidad", d.cantidad());
                mapa.put(String.valueOf(d.idProducto()), linea);
            }
            try {
                json = mapper.writeValueAsString(mapa);
            } catch (Exception e) {
                throw new IllegalStateException(e);
            }
        }
        Usuario u = usuarioRepository.findById(idUsuario).orElseThrow(() -> ApiException.notFound("Usuario no encontrado."));
        u.setCarritoJson(json);
        return detalle;
    }

    /** Acepta el formato objeto (PHP) o arreglo. Si el JSON está dañado, devuelve un carrito vacío. */
    private List<Item> leerJson(String json) {
        List<Item> items = new ArrayList<>();
        if (json == null || json.isBlank()) return items;
        try {
            JsonNode raiz = mapper.readTree(json);
            if (raiz == null || !raiz.isContainerNode()) return items;
            for (JsonNode n : raiz) {
                int id = n.path("idProducto").asInt(0);
                int cantidad = n.path("cantidad").asInt(0);
                if (id > 0 && cantidad > 0) items.add(new Item(id, cantidad));
            }
        } catch (Exception e) {
            return new ArrayList<>();
        }
        return items;
    }

    /** Une los ítems con el precio y stock ACTUALES de la base de datos. */
    private List<ItemCarritoDto> detallar(List<Item> items) {
        if (items.isEmpty()) return List.of();
        Map<Integer, Producto> productos = productoRepository.findAllById(items.stream().map(Item::idProducto).distinct().toList())
                .stream().collect(Collectors.toMap(Producto::getIdProducto, Function.identity()));
        List<ItemCarritoDto> resultado = new ArrayList<>();
        for (Item i : items) {
            Producto p = productos.get(i.idProducto());
            if (p == null || !p.vendibleEnLinea()) continue;
            int cantidad = Math.min(i.cantidad(), Math.max(p.getStock(), 0));
            if (cantidad == 0) cantidad = i.cantidad();
            resultado.add(new ItemCarritoDto(p.getIdProducto(), p.getNombreProducto(), p.getPrecioProducto(),
                    p.getImagenURL(), p.getStock(), cantidad));
        }
        return resultado;
    }
}
