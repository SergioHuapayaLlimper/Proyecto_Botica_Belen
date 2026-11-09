package pe.upn.boticabelen.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import pe.upn.boticabelen.entity.Usuario;

public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {

    Optional<Usuario> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByEmailAndIdUsuarioNot(String email, Integer idUsuario);

    /** Cuentas del personal ordenadas por rol y nombre. */
    List<Usuario> findByTipoOrderByRolNombreAscNombreAsc(String tipo);

    Optional<Usuario> findByIdUsuarioAndTipo(Integer idUsuario, String tipo);

    long countByRolIdRol(Integer idRol);
}
