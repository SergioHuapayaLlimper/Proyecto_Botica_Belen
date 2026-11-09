package pe.upn.boticabelen.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

/** Tabla detalle_pedido: una línea (producto y cantidad) de un pedido. */
@Entity
@Table(name = "detalle_pedido")
public class DetallePedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idDetallePedido")
    private Integer idDetallePedido;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "idPedido")
    private Pedido pedido;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "idProducto")
    private Producto producto;

    @Column(name = "cantidad", nullable = false)
    private Integer cantidad;

    @Column(name = "precioUnitario", nullable = false, precision = 10, scale = 2)
    private BigDecimal precioUnitario;

    /** RF21: costo del producto al momento de la venta. */
    @Column(name = "costoUnitario", precision = 10, scale = 2)
    private BigDecimal costoUnitario;

    @Column(name = "subtotal", nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal;

    /** Checklist del mostrador: el producto ya se separó del anaquel. */
    @Column(name = "preparado", nullable = false)
    private Boolean preparado = false;

    public Integer getIdDetallePedido() { return idDetallePedido; }
    public Pedido getPedido() { return pedido; }
    public void setPedido(Pedido pedido) { this.pedido = pedido; }
    public Producto getProducto() { return producto; }
    public void setProducto(Producto producto) { this.producto = producto; }
    public Integer getCantidad() { return cantidad; }
    public void setCantidad(Integer cantidad) { this.cantidad = cantidad; }
    public BigDecimal getPrecioUnitario() { return precioUnitario; }
    public void setPrecioUnitario(BigDecimal precioUnitario) { this.precioUnitario = precioUnitario; }
    public BigDecimal getSubtotal() { return subtotal; }
    public BigDecimal getCostoUnitario() { return costoUnitario; }
    public void setCostoUnitario(BigDecimal costoUnitario) { this.costoUnitario = costoUnitario; }
    public Boolean getPreparado() { return preparado; }
    public void setPreparado(Boolean preparado) { this.preparado = preparado; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }
}
