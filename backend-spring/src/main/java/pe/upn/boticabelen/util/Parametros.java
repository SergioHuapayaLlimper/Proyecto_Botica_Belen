package pe.upn.boticabelen.util;

/** Lectura tolerante de parámetros de la URL (?pagina=2&categoria=3): si no es un número válido, usa el valor por defecto. */
public final class Parametros {

    private Parametros() {}

    public static int entero(String valor, int porDefecto) {
        if (valor == null || valor.isBlank()) return porDefecto;
        try {
            return Integer.parseInt(valor.trim());
        } catch (NumberFormatException e) {
            return porDefecto;
        }
    }

    public static String texto(String valor, int max) {
        String v = valor == null ? "" : valor.trim();
        return v.length() > max ? v.substring(0, max) : v;
    }
}
