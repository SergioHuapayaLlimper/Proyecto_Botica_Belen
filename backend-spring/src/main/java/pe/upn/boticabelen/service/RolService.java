package pe.upn.boticabelen.service;

import java.time.format.DateTimeFormatter;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.upn.boticabelen.dto.Respuestas.PermisoDto;
import pe.upn.boticabelen.dto.Respuestas.RolDto;
import pe.upn.boticabelen.dto.Solicitudes.RolRequest;
import pe.upn.boticabelen.entity.Rol;
import pe.upn.boticabelen.excepcion.ApiException;
import pe.upn.boticabelen.repository.RolRepository;
import pe.upn.boticabelen.repository.UsuarioRepository;
import pe.upn.boticabelen.seguridad.Permisos;
import pe.upn.boticabelen.util.Parametros;
import pe.upn.boticabelen.util.Validador;

/**
 * Roles del personal.
 * - El rol Administrador es del sistema: tiene todos los permisos y no se puede editar ni eliminar.
 * - Un rol con cuentas asignadas no se puede eliminar.
 */
@Service
public class RolService {

    private static final DateTimeFormatter FECHA = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final RolRepository rolRepository;
    private final UsuarioRepository usuarioRepository;

    public RolService(RolRepository rolRepository, UsuarioRepository usuarioRepository) {
        this.rolRepository = rolRepository;
        this.usuarioRepository = usuarioRepository;
    }

    public List<PermisoDto> permisos() {
        return Permisos.CATALOGO.stream().map(p -> new PermisoDto(p.clave(), p.nombre(), p.descripcion())).toList();
    }

    private RolDto aDto(Rol r) {
        return new RolDto(r.getIdRol(), r.getNombre(), r.getDescripcion(), r.permisosEfectivos(),
                Boolean.TRUE.equals(r.getEsSistema()), usuarioRepository.countByRolIdRol(r.getIdRol()),
                r.getCreadoEn() == null ? null : r.getCreadoEn().format(FECHA));
    }

    @Transactional(readOnly = true)
    public List<RolDto> listar() {
        return rolRepository.findAllByOrderByEsSistemaDescNombreAsc().stream().map(this::aDto).toList();
    }

    @Transactional
    public RolDto crear(RolRequest req) {
        Rol r = new Rol();
        aplicar(r, req, 0);
        return aDto(rolRepository.saveAndFlush(r));
    }

    @Transactional
    public RolDto actualizar(String id, RolRequest req) {
        Rol r = editable(Parametros.entero(id, 0), "modificar");
        aplicar(r, req, r.getIdRol());
        return aDto(r);
    }

    @Transactional
    public void eliminar(String id) {
        Rol r = editable(Parametros.entero(id, 0), "eliminar");
        long total = usuarioRepository.countByRolIdRol(r.getIdRol());
        if (total > 0) {
            throw ApiException.conflict("No se puede eliminar: " + (total == 1 ? "hay 1 cuenta" : "hay " + total + " cuentas")
                    + " con este rol. Asígnales otro rol primero.");
        }
        rolRepository.delete(r);
    }

    private Rol editable(int id, String accion) {
        Rol r = rolRepository.findById(id).orElseThrow(() -> ApiException.notFound("Rol no encontrado."));
        if (Boolean.TRUE.equals(r.getEsSistema())) {
            throw ApiException.forbidden("El rol " + r.getNombre() + " es del sistema y no se puede " + accion + ".");
        }
        return r;
    }

    private void aplicar(Rol r, RolRequest req, int idActual) {
        String nombre = Validador.texto(req.nombre(), "Nombre del rol", 3, 40);
        if (nombre.equalsIgnoreCase("Cliente")) throw ApiException.badRequest("\"Cliente\" es un tipo de cuenta, no un rol del personal.");
        boolean repetido = idActual == 0
                ? rolRepository.existsByNombreIgnoreCase(nombre)
                : rolRepository.existsByNombreIgnoreCaseAndIdRolNot(nombre, idActual);
        if (repetido) throw ApiException.conflict("Ya existe un rol con ese nombre.");

        List<String> entrada = req.permisos() == null ? List.of() : req.permisos();
        List<String> desconocidos = entrada.stream().filter(p -> !Permisos.CLAVES.contains(p)).toList();
        if (!desconocidos.isEmpty()) throw ApiException.badRequest("Permisos no válidos: " + String.join(", ", desconocidos) + ".");
        List<String> permisos = Permisos.normalizar(entrada);
        if (permisos.isEmpty()) throw ApiException.badRequest("Selecciona al menos un permiso para el rol.");

        r.setNombre(nombre);
        r.setDescripcion(Validador.opcional(req.descripcion(), "Descripción", 150));
        r.setPermisos(permisos);
    }
}
