package pe.upn.boticabelen.service;

import java.time.format.DateTimeFormatter;
import java.util.List;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.upn.boticabelen.dto.Respuestas.EmpleadoDto;
import pe.upn.boticabelen.dto.Solicitudes.EmpleadoRequest;
import pe.upn.boticabelen.entity.Rol;
import pe.upn.boticabelen.entity.Usuario;
import pe.upn.boticabelen.excepcion.ApiException;
import pe.upn.boticabelen.repository.RolRepository;
import pe.upn.boticabelen.repository.UsuarioRepository;
import pe.upn.boticabelen.seguridad.PasswordService;
import pe.upn.boticabelen.seguridad.Permisos;
import pe.upn.boticabelen.util.Parametros;
import pe.upn.boticabelen.util.Validador;

/** Cuentas del personal de la botica. Cada cuenta tiene un rol que define qué secciones del panel puede usar. */
@Service
public class EmpleadoService {

    private static final DateTimeFormatter FECHA = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final String PERSONAL = "Personal";

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasswordService passwordService;

    public EmpleadoService(UsuarioRepository usuarioRepository, RolRepository rolRepository, PasswordService passwordService) {
        this.usuarioRepository = usuarioRepository;
        this.rolRepository = rolRepository;
        this.passwordService = passwordService;
    }

    private static EmpleadoDto aDto(Usuario u) {
        Rol r = u.getRol();
        String bloqueo = u.bloqueadoAhora() ? u.getBloqueadoHasta().format(FECHA) : null;
        return new EmpleadoDto(u.getIdUsuario(), u.getNombre(), u.getTelefono(), u.getEmail(),
                r == null ? null : r.getIdRol(), u.nombreRol(), r != null && Boolean.TRUE.equals(r.getEsSistema()),
                u.getEstado(), u.getIntentosFallidos(), bloqueo,
                u.getCreadoEn() == null ? null : u.getCreadoEn().format(FECHA));
    }

    private Rol rol(Integer idRol) {
        if (idRol == null) throw ApiException.badRequest("Elige un rol para la cuenta.");
        return rolRepository.findById(idRol).orElseThrow(() -> ApiException.badRequest("El rol elegido no existe."));
    }

    @Transactional(readOnly = true)
    public List<EmpleadoDto> listar() {
        return usuarioRepository.findByTipoOrderByRolNombreAscNombreAsc(PERSONAL).stream().map(EmpleadoService::aDto).toList();
    }

    @Transactional
    public EmpleadoDto crear(EmpleadoRequest req) {
        Usuario u = new Usuario();
        u.setNombre(Validador.texto(req.nombre(), "Nombre", 3, 100));
        u.setEmail(Validador.email(req.email()));
        u.setTelefono(Validador.telefono(req.telefono()));
        u.setTipo(PERSONAL);
        u.setRol(rol(req.idRol()));
        u.setPasswordHash(passwordService.hash(Validador.password(req.password())));
        u.setEstado(1);
        if (usuarioRepository.existsByEmail(u.getEmail())) throw ApiException.conflict("Ya existe un usuario con ese correo.");
        return aDto(usuarioRepository.save(u));
    }

    @Transactional
    public EmpleadoDto actualizar(String id, EmpleadoRequest req, Usuario admin) {
        int idEmpleado = Parametros.entero(id, 0);
        Usuario u = usuarioRepository.findByIdUsuarioAndTipo(idEmpleado, PERSONAL)
                .orElseThrow(() -> ApiException.notFound("Empleado no encontrado."));

        String nombre = Validador.texto(req.nombre(), "Nombre", 3, 100);
        String email = Validador.email(req.email());
        String telefono = Validador.telefono(req.telefono());
        Rol rol = rol(req.idRol());
        int estado = req.estado() != null && req.estado() != 0 ? 1 : 0;

        // Nadie se deja a sí mismo fuera: no puede desactivarse ni quitarse el acceso a Personal y roles.
        if (idEmpleado == admin.getIdUsuario() && (estado == 0 || !rol.permisosEfectivos().contains(Permisos.PERSONAL))) {
            throw ApiException.badRequest("No puede desactivar su propia cuenta ni quitarse el acceso a Personal y roles.");
        }
        if (usuarioRepository.existsByEmailAndIdUsuarioNot(email, idEmpleado)) throw ApiException.conflict("Otro usuario ya usa ese correo.");

        u.setNombre(nombre);
        u.setEmail(email);
        u.setTelefono(telefono);
        u.setRol(rol);
        u.setEstado(estado);
        if (estado == 1) { // guardar una cuenta activa también la desbloquea (RF02)
            u.setIntentosFallidos(0);
            u.setBloqueadoHasta(null);
        }
        if (req.password() != null && !req.password().isEmpty()) u.setPasswordHash(passwordService.hash(Validador.password(req.password())));
        return aDto(u);
    }

    @Transactional
    public void eliminar(String id, Usuario admin) {
        int idEmpleado = Parametros.entero(id, 0);
        if (idEmpleado == admin.getIdUsuario()) throw ApiException.badRequest("No puede eliminar su propia cuenta.");
        Usuario u = usuarioRepository.findByIdUsuarioAndTipo(idEmpleado, PERSONAL)
                .orElseThrow(() -> ApiException.notFound("Empleado no encontrado."));
        try {
            usuarioRepository.delete(u);
            usuarioRepository.flush();
        } catch (DataIntegrityViolationException e) {
            throw ApiException.conflict("Tiene pedidos asociados: desactívelo en lugar de eliminarlo.");
        }
    }
}
