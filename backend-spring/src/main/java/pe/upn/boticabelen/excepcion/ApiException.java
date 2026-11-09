package pe.upn.boticabelen.excepcion;

import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;

/**
 * Error de negocio con su código HTTP. Se devuelve al cliente como { "message": "...", ...datos extra }.
 * Ejemplo de datos extra: { "segundosRestantes": 300 } cuando la cuenta está bloqueada.
 */
public class ApiException extends RuntimeException {

    private final HttpStatus status;
    private final Map<String, Object> datos = new LinkedHashMap<>();

    public ApiException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public Map<String, Object> getDatos() {
        return datos;
    }

    /** Agrega un dato extra a la respuesta JSON. */
    public ApiException con(String clave, Object valor) {
        datos.put(clave, valor);
        return this;
    }

    public static ApiException badRequest(String m) { return new ApiException(HttpStatus.BAD_REQUEST, m); }
    public static ApiException unauthorized(String m) { return new ApiException(HttpStatus.UNAUTHORIZED, m); }
    public static ApiException forbidden(String m) { return new ApiException(HttpStatus.FORBIDDEN, m); }
    public static ApiException notFound(String m) { return new ApiException(HttpStatus.NOT_FOUND, m); }
    public static ApiException conflict(String m) { return new ApiException(HttpStatus.CONFLICT, m); }
    /** 423 Locked: cuenta bloqueada temporalmente (RF02). */
    public static ApiException locked(String m) { return new ApiException(HttpStatus.LOCKED, m); }
}
