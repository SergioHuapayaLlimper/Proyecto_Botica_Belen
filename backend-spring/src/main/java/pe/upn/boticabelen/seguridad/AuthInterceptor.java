package pe.upn.boticabelen.seguridad;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Arrays;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;
import pe.upn.boticabelen.entity.Usuario;
import pe.upn.boticabelen.excepcion.ApiException;
import pe.upn.boticabelen.repository.UsuarioRepository;

/**
 * Revisa los endpoints marcados con @Requiere antes de ejecutarlos.
 * Se consulta la BD en cada petición para que una cuenta desactivada pierda el acceso al instante.
 */
@Component
public class AuthInterceptor implements HandlerInterceptor {

    public static final String ATRIBUTO_USUARIO = "usuarioActual";

    private final JwtService jwtService;
    private final UsuarioRepository usuarioRepository;

    public AuthInterceptor(JwtService jwtService, UsuarioRepository usuarioRepository) {
        this.jwtService = jwtService;
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!(handler instanceof HandlerMethod metodo)) return true;
        Requiere requiere = metodo.getMethodAnnotation(Requiere.class);
        if (requiere == null) requiere = metodo.getBeanType().getAnnotation(Requiere.class);
        if (requiere == null) return true;

        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) throw ApiException.unauthorized("Debe iniciar sesión.");

        Integer id = jwtService.idUsuario(header.substring(7));
        if (id == null) throw ApiException.unauthorized("Su sesión expiró. Vuelva a iniciar sesión.");

        Usuario usuario = usuarioRepository.findById(id).orElse(null);
        if (usuario == null || !usuario.activo()) throw ApiException.unauthorized("Su cuenta está inactiva.");

        String[] roles = requiere.value();
        if (roles.length > 0 && Arrays.stream(roles).noneMatch(r -> r.equals(usuario.getRol()))) {
            throw ApiException.forbidden("No tiene permisos para realizar esta acción.");
        }

        request.setAttribute(ATRIBUTO_USUARIO, usuario);
        return true;
    }
}
