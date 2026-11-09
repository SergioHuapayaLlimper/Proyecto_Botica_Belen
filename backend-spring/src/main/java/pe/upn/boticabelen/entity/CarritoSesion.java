package pe.upn.boticabelen.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * RF22: un carrito que un cliente empezó. Si termina en reserva se guarda el pedido;
 * si lo vació sin reservar, se cierra. Conversión = carritos con pedido / carritos iniciados.
 */
@Entity
@Table(name = "carrito_sesion")
public class CarritoSesion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idCarrito")
    private Integer idCarrito;

    @Column(name = "idUsuario", nullable = false)
    private Integer idUsuario;

    @Column(name = "iniciadoEn", insertable = false, updatable = false)
    private LocalDateTime iniciadoEn;

    @Column(name = "idPedido")
    private Integer idPedido;

    @Column(name = "cerradoEn")
    private LocalDateTime cerradoEn;

    protected CarritoSesion() {}

    public CarritoSesion(Integer idUsuario) {
        this.idUsuario = idUsuario;
    }

    public Integer getIdCarrito() { return idCarrito; }
    public Integer getIdUsuario() { return idUsuario; }
    public Integer getIdPedido() { return idPedido; }
    public void setIdPedido(Integer idPedido) { this.idPedido = idPedido; }
    public LocalDateTime getCerradoEn() { return cerradoEn; }
    public void setCerradoEn(LocalDateTime cerradoEn) { this.cerradoEn = cerradoEn; }
}
