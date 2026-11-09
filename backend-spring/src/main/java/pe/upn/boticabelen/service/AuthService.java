package pe.upn.boticabelen.service;

import java.time.Duration;
import java.time.LocalDateTime;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.upn.boticabelen.dto.Respuestas.SesionDto;
import pe.upn.boticabelen.dto.Respuestas.UsuarioDto;
import pe.upn.boticabelen.dto.Solicitudes.*;
import pe.upn.boticabelen.entity.Usuario;
import pe.upn.boticabelen.excepcion.ApiException;
import pe.upn.boticabelen.repository.UsuarioRepository;
import pe.upn.boticabelen.seguridad.JwtService;
import pe.upn.boticabelen.seguridad.PasswordService;
import pe.upn.boticabelen.util.Validador;

/** Inicio de sesión, registro de clientes y datos de la cuenta. */
@Service
public class AuthService {

    private static final int MAX_INTENTOS = 5;
    private static final int MINUTOS_BLOQUEO = 5;

    private final UsuarioRepository usuarioRepository;
    private final PasswordService passwordService;
    private final JwtService jwtService;

    public AuthService(UsuarioRepository usuarioRepository, PasswordService passwordService, JwtService jwtService) {
        this.usuarioRepository = usuarioRepository;
        this.passwordService = passwordService;
        this.jwtService = jwtService;
    }

    public static UsuarioDto aDto(Usuario u) {
        return new UsuarioDto(u.getIdUsuario(), u.getNombre(), u.getEmail(), u.getTelefono(), u.getRol());
    }

    private SesionDto sesion(Usuario u) {
        return new SesionDto(jwtService.generar(u), aDto(u));
    }

    /**
     * RF02: tras 5 intentos fallidos consecutivos la cuenta se bloquea TEMPORALMENTE (5 minutos).
     * - Bloqueada: 423 Locked con "segundosRestantes" (el login muestra una cuenta regresiva).
     * - Clave incorrecta: 401 con "intentosRestantes".
     * - Al vencer el plazo se desbloquea sola y el contador vuelve a cero.
     * noRollbackFor: el contador y el bloqueo se guardan aunque se responda con error.
     */
    @Transactional(noRollbackFor = ApiException.class)
    public SesionDto login(LoginRequest req) {
        String correo = req.email() == null ? "" : req.email().trim().toLowerCase();
        String clave = req.password() == null ? "" : req.password();
        if (correo.isEmpty() || clave.isEmpty()) throw ApiException.badRequest("Por favor, complete todos los campos.");

        Usuario usuario = usuarioRepository.findByEmail(correo)
                .orElseThrow(() -> ApiException.unauthorized("Credenciales incorrectas."));
        if (usuario.getEstado() == 0) {
            throw ApiException.forbidden("Su cuenta está desactivada. Contacte al administrador.");
        }

        LocalDateTime ahora = LocalDateTime.now();
        if (usuario.bloqueadoAhora()) {
            throw bloqueo(segundosRestantes(ahora, usuario.getBloqueadoHasta()));
        }
        if (usuario.getBloqueadoHasta() != null) { // el bloqueo ya venció: se libera la cuenta
            usuario.setBloqueadoHasta(null);
            usuario.setIntentosFallidos(0);
        }

        if (passwordService.coincide(clave, usuario.getPasswordHash())) {
            if (usuario.getIntentosFallidos() > 0) usuario.setIntentosFallidos(0);
            return sesion(usuario);
        }

        int intentos = usuario.getIntentosFallidos() + 1;
        usuario.setIntentosFallidos(intentos);
        if (intentos >= MAX_INTENTOS) {
            usuario.setBloqueadoHasta(ahora.plusMinutes(MINUTOS_BLOQUEO));
            throw bloqueo(MINUTOS_BLOQUEO * 60L);
        }
        int quedan = MAX_INTENTOS - intentos;
        throw ApiException.unauthorized("Credenciales incorrectas. " + (quedan == 1
                        ? "Le queda 1 intento antes del bloqueo."
                        : "Le quedan " + quedan + " intentos."))
                .con("intentosRestantes", quedan);
    }

    private static long segundosRestantes(LocalDateTime ahora, LocalDateTime hasta) {
        return Math.max(1, Duration.between(ahora, hasta).toMillis() / 1000 + 1); // redondeo hacia arriba
    }

    private static ApiException bloqueo(long segundos) {
        return ApiException.locked("Cuenta bloqueada por superar los " + MAX_INTENTOS
                        + " intentos permitidos. Inténtelo en " + formatearTiempo(segundos) + ".")
                .con("segundosRestantes", segundos)
                .con("bloqueado", true);
    }

    /** 200 -> "3 min 20 s" */
    private static String formatearTiempo(long segundos) {
        long min = segundos / 60;
        long seg = segundos % 60;
        if (min == 0) return seg + " s";
        return seg == 0 ? min + " min" : min + " min " + seg + " s";
    }

    @Transactional
    public SesionDto registrar(RegistroRequest req) {
        String nombre = Validador.texto(req.nombre(), "Nombre", 3, 100);
        String correo = Validador.email(req.email());
        String telefono = Validador.telefono(req.telefono());
        String clave = Validador.password(req.password());

        if (usuarioRepository.existsByEmail(correo)) throw ApiException.conflict("Ya existe una cuenta con ese correo.");

        Usuario u = new Usuario();
        u.setNombre(nombre);
        u.setEmail(correo);
        u.setTelefono(telefono);
        u.setPasswordHash(passwordService.hash(clave));
        u.setRol("Cliente");
        u.setEstado(1);
        return sesion(usuarioRepository.save(u));
    }

    @Transactional
    public UsuarioDto actualizarPerfil(Integer idUsuario, PerfilRequest req) {
        String nombre = Validador.texto(req.nombre(), "Nombre", 3, 100);
        String correo = Validador.email(req.email());
        String telefono = Validador.telefono(req.telefono());
        if (usuarioRepository.existsByEmailAndIdUsuarioNot(correo, idUsuario)) throw ApiException.conflict("Otro usuario ya usa ese correo.");

        Usuario u = usuarioRepository.findById(idUsuario).orElseThrow(() -> ApiException.notFound("Usuario no encontrado."));
        u.setNombre(nombre);
        u.setEmail(correo);
        u.setTelefono(telefono);
        return aDto(u);
    }

    @Transactional
    public void cambiarPassword(Integer idUsuario, PasswordRequest req) {
        String nueva = Validador.password(req.nueva());
        Usuario u = usuarioRepository.findById(idUsuario).orElseThrow(() -> ApiException.notFound("Usuario no encontrado."));
        if (!passwordService.coincide(req.actual() == null ? "" : req.actual(), u.getPasswordHash())) {
            throw ApiException.badRequest("La contraseña actual es incorrecta.");
        }
        u.setPasswordHash(passwordService.hash(nueva));
    }
}
