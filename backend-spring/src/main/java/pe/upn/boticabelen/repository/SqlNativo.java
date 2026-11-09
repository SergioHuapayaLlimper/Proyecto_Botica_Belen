package pe.upn.boticabelen.repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import jakarta.persistence.Tuple;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Component;

/**
 * Ejecuta consultas SQL nativas de solo lectura (listados con JOIN, agregados y reportes).
 * Las escrituras se hacen con las entidades y los repositorios JPA.
 */
@Component
public class SqlNativo {

    @PersistenceContext
    private EntityManager em;

    @SuppressWarnings("unchecked")
    public List<Tuple> lista(String sql, Map<String, ?> parametros) {
        Query query = em.createNativeQuery(sql, Tuple.class);
        parametros.forEach(query::setParameter);
        return query.getResultList();
    }

    public List<Tuple> lista(String sql) {
        return lista(sql, Map.of());
    }

    public Optional<Tuple> uno(String sql, Map<String, ?> parametros) {
        List<Tuple> filas = lista(sql, parametros);
        return filas.isEmpty() ? Optional.empty() : Optional.of(filas.get(0));
    }

    // ---- Conversión de columnas (MySQL devuelve Long, Integer, BigDecimal, Boolean... según el tipo) ----
    public static Integer entero(Tuple t, String columna) {
        Object v = t.get(columna);
        return v instanceof Number n ? n.intValue() : null;
    }

    public static Long largo(Tuple t, String columna) {
        Object v = t.get(columna);
        return v instanceof Number n ? n.longValue() : 0L;
    }

    public static BigDecimal decimal(Tuple t, String columna) {
        Object v = t.get(columna);
        if (v == null) return BigDecimal.ZERO;
        return v instanceof BigDecimal b ? b : new BigDecimal(v.toString());
    }

    public static String texto(Tuple t, String columna) {
        Object v = t.get(columna);
        return v == null ? null : v.toString();
    }

    /** BOOLEAN de MySQL como 0/1 (así lo espera Angular). */
    public static Integer bandera(Tuple t, String columna) {
        Object v = t.get(columna);
        if (v instanceof Boolean b) return b ? 1 : 0;
        return v instanceof Number n ? n.intValue() : 0;
    }
}
