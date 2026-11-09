package pe.upn.boticabelen.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import pe.upn.boticabelen.entity.CarritoSesion;

public interface CarritoSesionRepository extends JpaRepository<CarritoSesion, Integer> {

    /** El carrito abierto del cliente: sin pedido y sin cerrar. */
    Optional<CarritoSesion> findFirstByIdUsuarioAndIdPedidoIsNullAndCerradoEnIsNullOrderByIdCarritoDesc(Integer idUsuario);
}
