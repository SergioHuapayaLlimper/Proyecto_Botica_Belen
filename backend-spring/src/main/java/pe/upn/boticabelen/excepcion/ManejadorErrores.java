package pe.upn.boticabelen.excepcion;

import jakarta.servlet.http.HttpServletRequest;
import java.util.LinkedHashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import pe.upn.boticabelen.dto.Respuestas.MensajeDto;

/** Convierte las excepciones en respuestas JSON { "message": "..." }, igual que la versión Node. */
@RestControllerAdvice
public class ManejadorErrores {

    private static final Logger log = LoggerFactory.getLogger(ManejadorErrores.class);

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<Map<String, Object>> api(ApiException e) {
        Map<String, Object> cuerpo = new LinkedHashMap<>();
        cuerpo.put("message", e.getMessage());
        cuerpo.putAll(e.getDatos());
        return ResponseEntity.status(e.getStatus()).body(cuerpo);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<MensajeDto> jsonInvalido() {
        return ResponseEntity.badRequest().body(new MensajeDto("JSON inválido."));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<MensajeDto> parametroInvalido() {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MensajeDto("Recurso no encontrado."));
    }

    @ExceptionHandler({NoHandlerFoundException.class, NoResourceFoundException.class, HttpRequestMethodNotSupportedException.class})
    public ResponseEntity<MensajeDto> rutaNoEncontrada(HttpServletRequest req) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new MensajeDto("Ruta no encontrada: " + req.getMethod() + " " + req.getRequestURI()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<MensajeDto> inesperado(Exception e, HttpServletRequest req) {
        log.error("{} {}", req.getMethod(), req.getRequestURI(), e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new MensajeDto("Ocurrió un error inesperado en el servidor."));
    }
}
