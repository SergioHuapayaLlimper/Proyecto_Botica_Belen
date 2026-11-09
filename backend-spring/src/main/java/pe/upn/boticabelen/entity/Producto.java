package pe.upn.boticabelen.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

/** Tabla producto. */
@Entity
@Table(name = "producto")
public class Producto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idProducto")
    private Integer idProducto;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idCategoria")
    private Categoria categoria;

    @Column(name = "codigoProducto", nullable = false, unique = true, length = 20)
    private String codigoProducto;

    @Column(name = "nombreProducto", nullable = false, length = 100)
    private String nombreProducto;

    /** RF05: principio activo (genérico), p. ej. "Paracetamol" para Panadol. */
    @Column(name = "principioActivo", length = 100)
    private String principioActivo;

    @Column(name = "descripcionProducto", columnDefinition = "TEXT")
    private String descripcionProducto;

    @Column(name = "precioProducto", nullable = false, precision = 10, scale = 2)
    private BigDecimal precioProducto;

    @Column(name = "stock", nullable = false)
    private Integer stock = 0;

    /** 'Activo' o 'Inactivo' */
    @Column(name = "estadoProducto", nullable = false, length = 20)
    private String estadoProducto = "Activo";

    @Column(name = "requiere_receta", nullable = false)
    private Boolean requiereReceta = false;

    @Column(name = "imagenURL")
    private String imagenURL;

    @Column(name = "ubicacionAnaquel", length = 50)
    private String ubicacionAnaquel;

    public Integer getIdProducto() { return idProducto; }
    public void setIdProducto(Integer idProducto) { this.idProducto = idProducto; }
    public Categoria getCategoria() { return categoria; }
    public void setCategoria(Categoria categoria) { this.categoria = categoria; }
    public String getCodigoProducto() { return codigoProducto; }
    public void setCodigoProducto(String codigoProducto) { this.codigoProducto = codigoProducto; }
    public String getNombreProducto() { return nombreProducto; }
    public void setNombreProducto(String nombreProducto) { this.nombreProducto = nombreProducto; }
    public String getPrincipioActivo() { return principioActivo; }
    public void setPrincipioActivo(String principioActivo) { this.principioActivo = principioActivo; }
    public String getDescripcionProducto() { return descripcionProducto; }
    public void setDescripcionProducto(String descripcionProducto) { this.descripcionProducto = descripcionProducto; }
    public BigDecimal getPrecioProducto() { return precioProducto; }
    public void setPrecioProducto(BigDecimal precioProducto) { this.precioProducto = precioProducto; }
    public Integer getStock() { return stock; }
    public void setStock(Integer stock) { this.stock = stock; }
    public String getEstadoProducto() { return estadoProducto; }
    public void setEstadoProducto(String estadoProducto) { this.estadoProducto = estadoProducto; }
    public Boolean getRequiereReceta() { return requiereReceta; }
    public void setRequiereReceta(Boolean requiereReceta) { this.requiereReceta = requiereReceta; }
    public String getImagenURL() { return imagenURL; }
    public void setImagenURL(String imagenURL) { this.imagenURL = imagenURL; }
    public String getUbicacionAnaquel() { return ubicacionAnaquel; }
    public void setUbicacionAnaquel(String ubicacionAnaquel) { this.ubicacionAnaquel = ubicacionAnaquel; }

    /** Visible en el catálogo público: activo y de venta libre. */
    public boolean vendibleEnLinea() {
        return "Activo".equals(estadoProducto) && !Boolean.TRUE.equals(requiereReceta);
    }
}
