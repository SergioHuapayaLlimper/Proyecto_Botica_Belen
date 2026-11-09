package pe.upn.boticabelen.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/** Muestra en la terminal cada petición: [10:42:15] GET /api/categorias -> 200 (4 ms) */
@Component
public class RegistroPeticionesFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger("peticiones");
    private static final DateTimeFormatter HORA = DateTimeFormatter.ofPattern("HH:mm:ss");

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        long inicio = System.nanoTime();
        try {
            chain.doFilter(request, response);
        } finally {
            long ms = (System.nanoTime() - inicio) / 1_000_000;
            String ruta = request.getRequestURI() + (request.getQueryString() != null ? "?" + request.getQueryString() : "");
            log.info("[{}] {} {} -> {} ({} ms)", LocalTime.now().format(HORA), request.getMethod(), ruta, response.getStatus(), ms);
        }
    }
}
