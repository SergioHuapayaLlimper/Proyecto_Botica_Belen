package pe.upn.boticabelen.repository;

import jakarta.persistence.LockModeType;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pe.upn.boticabelen.entity.Producto;

public interface ProductoRepository extends JpaRepository<Producto, Integer> {

    boolean existsByCodigoProductoAndIdProductoNot(String codigoProducto, Integer idProducto);

    /** SELECT ... FOR UPDATE: bloquea las filas para no vender dos veces la última unidad. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Producto p WHERE p.idProducto IN :ids")
    List<Producto> bloquearPorIds(@Param("ids") Collection<Integer> ids);

    /** Devuelve unidades al inventario (al cancelar o rechazar un pedido). */
    @Modifying(flushAutomatically = true)
    @Query("UPDATE Producto p SET p.stock = p.stock + :cantidad WHERE p.idProducto = :id")
    int sumarStock(@Param("id") Integer idProducto, @Param("cantidad") int cantidad);
}
