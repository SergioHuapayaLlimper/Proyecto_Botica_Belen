package pe.upn.boticabelen.repository;

import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pe.upn.boticabelen.entity.Pedido;

public interface PedidoRepository extends JpaRepository<Pedido, Integer> {

    /** SELECT ... FOR UPDATE del pedido antes de cambiar su estado. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Pedido p WHERE p.idPedido = :id")
    Optional<Pedido> bloquearPorId(@Param("id") Integer id);
}
