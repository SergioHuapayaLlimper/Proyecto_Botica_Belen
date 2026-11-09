package pe.upn.boticabelen.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.upn.boticabelen.entity.ConfiguracionNegocio;

public interface ConfiguracionRepository extends JpaRepository<ConfiguracionNegocio, String> {
}
