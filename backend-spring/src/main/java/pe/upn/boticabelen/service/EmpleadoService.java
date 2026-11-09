package pe.upn.boticabelen.service;

import java.util.List;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.upn.boticabelen.dto.Respuestas.EmpleadoDto;
import pe.upn.boticabelen.dto.Solicitudes.EmpleadoRequest;
import pe.upn.boticabelen.entity.Usuario;
import pe.upn.boticabelen.excepcion.ApiException;
import pe.upn.boticabelen.repository.UsuarioRepository;
import pe.upn.boticabelen.seguridad.PasswordService;
import pe.upn.boticabelen.util.Negocio;
import pe.upn.boticabelen.util.Parametros;
import pe.upn.boticabelen.util.Validador;

/** Personal de la botica (solo Admin). Roles válidos: Admin y Empleado. */
@Service
public class EmpleadoService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordService passwordService;

    public EmpleadoService(UsuarioRepository usuarioRepository, PasswordService passwordService) {
        this.usuarioRepository = usuarioRepository;
        this.passwordService = passwordService;
    }

    private static EmpleadoDto aDto(Usuario u) {
        return new EmpleadoDto(u.getIdUsuario(), u.getNombre(), u.getTelefono(), u.getEmail(), u.getRol(), u.getEstado(), u.getIntentosFallidos());
    }

    private static String rol(String rol) {
        return Negocio.contiene(Negocio.ROLES_PERSONAL, rol) ? rol : "Empleado";
    }

    @Transactional(readOnly = true)
    public List<EmpleadoDto> listar() {
        return usuarioRepository.findByRolInOrderByRolAscNombreAsc(Negocio.ROLES_PERSONAL).stream().map(EmpleadoService::aDto).toList();
    }

    @Transactional
    public EmpleadoDto crear(EmpleadoRequest req) {
        Usuario u = new Usuario();
        u.setNombre(Validador.texto(req.nombre(), "Nombre", 3, 100));
        u.setEmail(Validador.email(req.email()));
        u.setTelefono(Validador.telefono(req.telefono()));
        u.setRol(rol(req.rol()));
        u.setPasswordHash(passwordService.hash(Validador.password(req.password())));
        u.setEstado(1);
        if (usuarioRepository.existsByEmail(u.getEmail())) throw ApiException.conflict("Ya existe un usuario con ese correo.");
        return aDto(usuarioRepository.save(u));
    }

    @Transactional
    public EmpleadoDto actualizar(String id, EmpleadoRequest req, Usuario admin) {
        int idEmpleado = Parametros.entero(id, 0);
        Usuario u = usuarioRepository.findByIdUsuarioAndRolIn(idEmpleado, Negocio.ROLES_PERSONAL)
                .orElseThrow(() -> ApiException.notFound("Empleado no encontrado."));

        String nombre = Validador.texto(req.nombre(), "Nombre", 3, 100);
        String email = Validador.email(req.email());
        String telefono = Validador.telefono(req.telefono());
        String rol = rol(req.rol());
        int estado = req.estado() != null && req.estado() != 0 ? 1 : 0;

        if (idEmpleado == admin.getIdUsuario() && (!"Admin".equals(rol) || estado == 0)) {
            throw ApiException.badRequest("No puede quitarse el rol de administrador ni desactivar su propia cuenta.");
        }
        if (usuarioRepository.existsByEmailAndIdUsuarioNot(email, idEmpleado)) throw ApiException.conflict("Otro usuario ya usa ese correo.");

        u.setNombre(nombre);
        u.setEmail(email);
        u.setTelefono(telefono);
        u.setRol(rol);
        u.setEstado(estado);
        if (estado == 1) u.setIntentosFallidos(0); // reactivar también desbloquea la cuenta
        if (req.password() != null && !req.password().isEmpty()) u.setPasswordHash(passwordService.hash(Validador.password(req.password())));
        return aDto(u);
    }

    @Transactional
    public void eliminar(String id, Usuario admin) {
        int idEmpleado = Parametros.entero(id, 0);
        if (idEmpleado == admin.getIdUsuario()) throw ApiException.badRequest("No puede eliminar su propia cuenta.");
        Usuario u = usuarioRepository.findByIdUsuarioAndRolIn(idEmpleado, Negocio.ROLES_PERSONAL)
                .orElseThrow(() -> ApiException.notFound("Empleado no encontrado."));
        try {
            usuarioRepository.delete(u);
            usuarioRepository.flush();
        } catch (DataIntegrityViolationException e) {
            throw ApiException.conflict("Tiene pedidos asociados: desactívelo en lugar de eliminarlo.");
        }
    }
}
