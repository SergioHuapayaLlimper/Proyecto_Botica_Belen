package pe.upn.boticabelen.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/** Tabla pedido (reserva con recojo en tienda). */
@Entity
@Table(name = "pedido")
public class Pedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idPedido")
    private Integer idPedido;

    @Column(name = "codigoPedido", nullable = false, unique = true, length = 20)
    private String codigoPedido;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "idUsuario")
    private Usuario usuario;

    /** La asigna MySQL (DEFAULT CURRENT_TIMESTAMP). */
    @Column(name = "fechaHoraToma", insertable = false, updatable = false)
    private LocalDateTime fechaHoraToma;

    /** ENUM: Pendiente, Aceptado, Rechazado, En preparación, Listo para entregar, Entregado, Cancelado */
    @Column(name = "estadoPedido", nullable = false)
    private String estadoPedido = "Pendiente";

    @Column(name = "metodoPago", length = 50)
    private String metodoPago;

    @Column(name = "observaciones", columnDefinition = "TEXT")
    private String observaciones;

    @Column(name = "subtotalGeneral", nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotalGeneral;

    @Column(name = "igv", nullable = false, precision = 10, scale = 2)
    private BigDecimal igv;

    @Column(name = "total", nullable = false, precision = 10, scale = 2)
    private BigDecimal total;

    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DetallePedido> detalles = new ArrayList<>();

    public void agregarDetalle(DetallePedido detalle) {
        detalle.setPedido(this);
        detalles.add(detalle);
    }

    public Integer getIdPedido() { return idPedido; }
    public void setIdPedido(Integer idPedido) { this.idPedido = idPedido; }
    public String getCodigoPedido() { return codigoPedido; }
    public void setCodigoPedido(String codigoPedido) { this.codigoPedido = codigoPedido; }
    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }
    public LocalDateTime getFechaHoraToma() { return fechaHoraToma; }
    public String getEstadoPedido() { return estadoPedido; }
    public void setEstadoPedido(String estadoPedido) { this.estadoPedido = estadoPedido; }
    public String getMetodoPago() { return metodoPago; }
    public void setMetodoPago(String metodoPago) { this.metodoPago = metodoPago; }
    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
    public BigDecimal getSubtotalGeneral() { return subtotalGeneral; }
    public void setSubtotalGeneral(BigDecimal subtotalGeneral) { this.subtotalGeneral = subtotalGeneral; }
    public BigDecimal getIgv() { return igv; }
    public void setIgv(BigDecimal igv) { this.igv = igv; }
    public BigDecimal getTotal() { return total; }
    public void setTotal(BigDecimal total) { this.total = total; }
    public List<DetallePedido> getDetalles() { return detalles; }
}
