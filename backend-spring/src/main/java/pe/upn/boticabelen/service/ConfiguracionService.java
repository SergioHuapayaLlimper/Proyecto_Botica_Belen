package pe.upn.boticabelen.service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.upn.boticabelen.entity.ConfiguracionNegocio;
import pe.upn.boticabelen.excepcion.ApiException;
import pe.upn.boticabelen.repository.ConfiguracionRepository;

/** Información del negocio (dirección, mapa, horario, contacto). La lee el portal y la edita el admin. */
@Service
public class ConfiguracionService {

    /** Únicas claves que se pueden guardar (las demás se ignoran). */
    public static final List<String> CLAVES = List.of(
            "nombre_negocio", "direccion", "referencia", "mapa_lat", "mapa_lng", "horario_atencion", "metodos_pago",
            "telefono_contacto", "correo_contacto", "whatsapp_numero", "whatsapp_mensaje", "yape_numero");

    private static final Pattern CORREO = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    private final ConfiguracionRepository repo;

    public ConfiguracionService(ConfiguracionRepository repo) {
        this.repo = repo;
    }

    @Transactional(readOnly = true)
    public Map<String, String> obtener() {
        Map<String, String> config = new LinkedHashMap<>();
        CLAVES.forEach(c -> config.put(c, ""));
        repo.findAll().forEach(c -> {
            if (CLAVES.contains(c.getClave())) config.put(c.getClave(), c.getValor() == null ? "" : c.getValor());
        });
        return config;
    }

    @Transactional
    public Map<String, String> actualizar(Map<String, Object> entrada) {
        if (entrada == null) throw ApiException.badRequest("No se enviaron datos.");
        Map<String, String> datos = new LinkedHashMap<>();
        entrada.forEach((clave, valor) -> {
            if (CLAVES.contains(clave)) datos.put(clave, valor == null ? "" : String.valueOf(valor).trim());
        });
        if (datos.isEmpty()) throw ApiException.badRequest("No se envió ningún dato válido.");

        validar(datos);
        datos.forEach((clave, valor) -> repo.findById(clave).ifPresentOrElse(
                c -> c.setValor(valor),
                () -> repo.save(new ConfiguracionNegocio(clave, valor))));
        repo.flush();
        return obtener();
    }

    /** Mismas reglas que Pastelería Web. Acumula los errores para mostrarlos juntos. */
    private void validar(Map<String, String> d) {
        StringBuilder errores = new StringBuilder();
        if (d.containsKey("nombre_negocio") && d.get("nombre_negocio").length() < 3) errores.append("El nombre del negocio es obligatorio. ");
        if (d.containsKey("direccion") && d.get("direccion").isEmpty()) errores.append("La dirección es obligatoria. ");
        if (d.containsKey("mapa_lat") && !enRango(d.get("mapa_lat"), 90)) errores.append("La latitud debe ser un número entre -90 y 90. ");
        if (d.containsKey("mapa_lng") && !enRango(d.get("mapa_lng"), 180)) errores.append("La longitud debe ser un número entre -180 y 180. ");
        String correo = d.get("correo_contacto");
        if (correo != null && !correo.isEmpty() && !CORREO.matcher(correo).matches()) errores.append("El correo de contacto no es válido. ");
        if (d.containsKey("whatsapp_numero")) {
            // "+51 987 654 321" se guarda como "51987654321"
            String numero = d.get("whatsapp_numero").replaceAll("\\D", "");
            d.put("whatsapp_numero", numero);
            if (!numero.isEmpty() && !numero.matches("\\d{10,15}")) errores.append("El WhatsApp debe incluir el código de país (por ejemplo, 51987654321). ");
        }
        for (Map.Entry<String, String> e : d.entrySet()) {
            if (e.getValue().length() > 500) errores.append("El campo ").append(e.getKey()).append(" es demasiado largo. ");
        }
        if (!errores.isEmpty()) throw ApiException.badRequest(errores.toString().trim());
    }

    private static boolean enRango(String valor, double limite) {
        try {
            double n = Double.parseDouble(valor);
            return n >= -limite && n <= limite;
        } catch (NumberFormatException e) {
            return false;
        }
    }
}
