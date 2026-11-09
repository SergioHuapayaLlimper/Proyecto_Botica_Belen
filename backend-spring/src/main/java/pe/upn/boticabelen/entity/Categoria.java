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

    public Integer getIdCategoria() { return idCategoria; }
    public void setIdCategoria(Integer idCategoria) { this.idCategoria = idCategoria; }
    public String getNombreCategoria() { return nombreCategoria; }
    public void setNombreCategoria(String nombreCategoria) { this.nombreCategoria = nombreCategoria; }
    public String getEstadoCategoria() { return estadoCategoria; }
    public void setEstadoCategoria(String estadoCategoria) { this.estadoCategoria = estadoCategoria; }
}
