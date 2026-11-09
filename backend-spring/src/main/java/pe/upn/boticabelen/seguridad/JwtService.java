package pe.upn.boticabelen.seguridad;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import pe.upn.boticabelen.entity.Usuario;

/** Firma y verifica los tokens JWT (HS256). El token guarda el id y el rol del usuario. */
@Service
public class JwtService {

    private final SecretKey clave;
    private final Duration vigencia;

    public JwtService(@Value("${app.jwt.secret}") String secreto, @Value("${app.jwt.horas}") long horas) {
        if (secreto == null || secreto.length() < 32) {
            throw new IllegalStateException("app.jwt.secret (JWT_SECRET) debe tener al menos 32 caracteres.");
        }
        this.clave = Keys.hmacShaKeyFor(secreto.getBytes(StandardCharsets.UTF_8));
        this.vigencia = Duration.ofHours(horas);
    }

    public String generar(Usuario usuario) {
        Date ahora = new Date();
        return Jwts.builder()
                .claim("id", usuario.getIdUsuario())
                .claim("rol", usuario.getRol())
                .issuedAt(ahora)
                .expiration(new Date(ahora.getTime() + vigencia.toMillis()))
                .signWith(clave)
                .compact();
    }

    /** Devuelve el id del usuario o null si el token es inválido o expiró. */
    public Integer idUsuario(String token) {
        try {
            Object id = Jwts.parser().verifyWith(clave).build().parseSignedClaims(token).getPayload().get("id");
            return id instanceof Number n ? n.intValue() : null;
        } catch (JwtException | IllegalArgumentException e) {
            return null;
        }
    }
}
