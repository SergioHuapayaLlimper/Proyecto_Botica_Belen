package pe.upn.boticabelen.util;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.regex.Pattern;

/** Reglas de negocio de la botica: estados del pedido, IGV, métodos de pago y rangos de fechas. */
public final class Negocio {

    private Negocio() {}

    // ---- Estados del pedido (exactamente los del ENUM de la tabla pedido) ----
    public static final String PENDIENTE = "Pendiente";
    public static final String ACEPTADO = "Aceptado";
    public static final String RECHAZADO = "Rechazado";
    public static final String EN_PREPARACION = "En preparación";
    public static final String LISTO = "Listo para entregar";
    public static final String ENTREGADO = "Entregado";
    public static final String CANCELADO = "Cancelado";

    public static final List<String> ESTADOS = List.of(PENDIENTE, ACEPTADO, RECHAZADO, EN_PREPARACION, LISTO, ENTREGADO, CANCELADO);

    public static final List<String> METODOS_PAGO = List.of("Efectivo", "Yape", "Plin", "Tarjeta");

    public static final List<String> ROLES_PERSONAL = List.of("Admin", "Empleado");

    public static final int STOCK_BAJO = 5;

    /** Máquina de estados: a qué estados puede pasar un pedido desde su estado actual. */
    public static List<String> siguientesEstados(String estadoActual) {
        return switch (estadoActual) {
            case PENDIENTE -> List.of(ACEPTADO, RECHAZADO, CANCELADO);
            case ACEPTADO -> List.of(EN_PREPARACION, CANCELADO);
            case EN_PREPARACION -> List.of(LISTO, CANCELADO);
            case LISTO -> List.of(ENTREGADO, CANCELADO);
            default -> List.of();
        };
    }

    /** contains() seguro: List.of(...).contains(null) lanza NullPointerException. */
    public static boolean contiene(List<String> lista, String valor) {
        return valor != null && lista.contains(valor);
    }

    public static boolean anulado(String estado) {
        return CANCELADO.equals(estado) || RECHAZADO.equals(estado);
    }

    // ---- IGV: en Perú los precios de venta YA incluyen el 18 % ----
    public static final BigDecimal FACTOR_IGV = new BigDecimal("1.18");

    public record Montos(BigDecimal subtotalGeneral, BigDecimal igv, BigDecimal total) {}

    public static Montos desgloseIgv(BigDecimal totalBruto) {
        BigDecimal total = redondear(totalBruto);
        BigDecimal subtotal = total.divide(FACTOR_IGV, 2, RoundingMode.HALF_UP);
        return new Montos(subtotal, total.subtract(subtotal), total);
    }

    public static BigDecimal redondear(BigDecimal n) {
        return n.setScale(2, RoundingMode.HALF_UP);
    }

    // ---- Rango de fechas de los reportes (por defecto: desde el 1 de enero hasta hoy) ----
    private static final Pattern FECHA = Pattern.compile("^\\d{4}-\\d{2}-\\d{2}$");

    public record Rango(String desde, String hasta) {}

    public static Rango rangoFechas(String desde, String hasta) {
        LocalDate hoy = LocalDate.now();
        String d = desde != null && FECHA.matcher(desde).matches() ? desde : hoy.getYear() + "-01-01";
        String h = hasta != null && FECHA.matcher(hasta).matches() ? hasta : hoy.toString();
        return new Rango(d, h);
    }
}
