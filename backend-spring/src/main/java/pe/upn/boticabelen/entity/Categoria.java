package pe.upn.boticabelen.entity;

import jakarta.persistence.*;

/** Tabla categoria. */
@Entity
@Table(name = "categoria")
public class Categoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idCategoria")
    private Integer idCategoria;

    @Column(name = "nombreCategoria", nullable = false, length = 100)
    private String nombreCategoria;

    @Column(name = "estadoCategoria", nullable = false, length = 20)
    private String estadoCategoria = "Activo";

    /** Prefijo de los códigos de sus productos: CUI → CUI-0001, CUI-0002... */
    @Column(name = "prefijo", nullable = false, unique = true, length = 5)
    private String prefijo;

    public Integer getIdCategoria() { return idCategoria; }
    public void setIdCategoria(Integer idCategoria) { this.idCategoria = idCategoria; }
    public String getNombreCategoria() { return nombreCategoria; }
    public void setNombreCategoria(String nombreCategoria) { this.nombreCategoria = nombreCategoria; }
    public String getPrefijo() { return prefijo; }
    public void setPrefijo(String prefijo) { this.prefijo = prefijo; }
    public String getEstadoCategoria() { return estadoCategoria; }
    public void setEstadoCategoria(String estadoCategoria) { this.estadoCategoria = estadoCategoria; }
}
