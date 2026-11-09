package pe.upn.boticabelen.repository;

import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pe.upn.boticabelen.entity.Pedido;

public interface PedidoRepository extends JpaRepository<Pedido, Integer> {

    /** Mayor correlativo usado en un año: "PED-2026-0013" → 13 (0 si no hay ninguno). */
    @Query(value = """
            SELECT COALESCE(MAX(CAST(SUBSTRING(codigoPedido, 10) AS UNSIGNED)), 0)
            FROM pedido WHERE codigoPedido REGEXP CONCAT('^PED-', :anio, '-[0-9]+$')""", nativeQuery = true)
    Number ultimoCorrelativo(@Param("anio") String anio);

    /** Reservas sin cerrar hechas antes de cierta hora (candidatas a vencer). */
    @Query("SELECT p.idPedido FROM Pedido p WHERE p.estadoPedido IN :estados AND p.fechaHoraToma < :limite ORDER BY p.fechaHoraToma")
    java.util.List<Integer> abiertasAntesDe(@Param("estados") java.util.Collection<String> estados,
                                           @Param("limite") java.time.LocalDateTime limite);

    /** SELECT ... FOR UPDATE del pedido antes de cambiar su estado. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Pedido p WHERE p.idPedido = :id")
    Optional<Pedido> bloquearPorId(@Param("id") Integer id);
}
