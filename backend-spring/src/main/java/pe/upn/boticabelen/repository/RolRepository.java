package pe.upn.boticabelen.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import pe.upn.boticabelen.entity.Rol;

public interface RolRepository extends JpaRepository<Rol, Integer> {

    /** Primero el rol del sistema, luego por nombre. */
    List<Rol> findAllByOrderByEsSistemaDescNombreAsc();

    boolean existsByNombreIgnoreCase(String nombre);

    boolean existsByNombreIgnoreCaseAndIdRolNot(String nombre, Integer idRol);
}
