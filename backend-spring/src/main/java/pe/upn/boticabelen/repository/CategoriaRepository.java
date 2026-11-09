package pe.upn.boticabelen.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import pe.upn.boticabelen.entity.Categoria;

public interface CategoriaRepository extends JpaRepository<Categoria, Integer> {

    List<Categoria> findAllByOrderByNombreCategoriaAsc();
}
