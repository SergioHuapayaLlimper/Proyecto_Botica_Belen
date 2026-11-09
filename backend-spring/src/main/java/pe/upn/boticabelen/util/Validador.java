package pe.upn.boticabelen.util;

import java.util.regex.Pattern;
import pe.upn.boticabelen.excepcion.ApiException;

/** Validaciones reutilizables (mismas reglas y mensajes que la versión Node). */
public final class Validador {

    private static final Pattern EMAIL = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final Pattern TELEFONO = Pattern.compile("^\\+?\\d{6,15}$");
    /** Celular peruano: 9 dígitos que empiezan con 9 (se acepta +51 delante). */
    private static final Pattern CELULAR = Pattern.compile("^(\\+?51)?(9\\d{8})$");

    private Validador() {}

    public static String texto(String valor, String campo, int min, int max, boolean requerido) {
        String v = valor == null ? "" : valor.trim();
        if (v.isEmpty() && !requerido) return "";
        if (v.length() < min) throw ApiException.badRequest(campo + ": mínimo " + min + " caracteres.");
        if (v.length() > max) throw ApiException.badRequest(campo + ": máximo " + max + " caracteres.");
        return v;
    }

    public static String texto(String valor, String campo, int min, int max) {
        return texto(valor, campo, min, max, true);
    }

    /** Texto opcional: devuelve null si viene vacío. */
    public static String opcional(String valor, String campo, int max) {
        String v = texto(valor, campo, 1, max, false);
        return v.isEmpty() ? null : v;
    }

    public static String email(String valor) {
        String v = valor == null ? "" : valor.trim().toLowerCase();
        if (!EMAIL.matcher(v).matches() || v.length() > 100) throw ApiException.badRequest("Correo electrónico inválido.");
        return v;
    }

    public static String telefono(String valor) {
        String v = valor == null ? "" : valor.replaceAll("\\s", "");
        if (!v.isEmpty() && !TELEFONO.matcher(v).matches()) throw ApiException.badRequest("Teléfono inválido.");
        return v.isEmpty() ? null : v;
    }

    /** Celular OBLIGATORIO para clientes. Devuelve los 9 dígitos, sin espacios ni +51. */
    public static String celular(String valor) {
        String v = valor == null ? "" : valor.replaceAll("[\\s-]", "");
        if (v.isEmpty()) throw ApiException.badRequest("Ingresa tu número de celular.");
        var m = CELULAR.matcher(v);
        if (!m.matches()) throw ApiException.badRequest("Escribe un celular de 9 dígitos que empiece con 9.");
        return m.group(2);
    }

    public static String password(String valor) {
        String v = valor == null ? "" : valor;
        if (v.length() < 6) throw ApiException.badRequest("La contraseña debe tener al menos 6 caracteres.");
        if (v.length() > 72) throw ApiException.badRequest("La contraseña es demasiado larga.");
        return v;
    }

    public static int entero(Integer valor, String campo, int min, int max) {
        if (valor == null || valor < min || valor > max) {
            throw ApiException.badRequest(campo + " debe ser un número entero entre " + min + " y " + max + ".");
        }
        return valor;
    }
}
