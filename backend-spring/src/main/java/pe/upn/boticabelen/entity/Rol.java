package pe.upn.boticabelen.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import pe.upn.boticabelen.seguridad.Permisos;

/** Tabla rol: roles del personal y sus permisos. El rol del sistema (Administrador) tiene todos. */
@Entity
@Table(name = "rol")
public class Rol {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idRol")
    private Integer idRol;

    @Column(name = "nombre", nullable = false, unique = true, length = 40)
    private String nombre;

    @Column(name = "descripcion", length = 150)
    private String descripcion;

    @Convert(converter = ListaJsonConverter.class)
    @Column(name = "permisos", nullable = false, columnDefinition = "json")
    private List<String> permisos = new ArrayList<>();

    @Column(name = "esSistema", nullable = false)
    private Boolean esSistema = false;

    @Column(name = "creadoEn", insertable = false, updatable = false)
    private LocalDateTime creadoEn;

    /** Permisos efectivos: el rol del sistema siempre tiene todo el catálogo. */
    public List<String> permisosEfectivos() {
        return Boolean.TRUE.equals(esSistema) ? Permisos.CLAVES : permisos;
    }

    public Integer getIdRol() { return idRol; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
    public List<String> getPermisos() { return permisos; }
    public void setPermisos(List<String> permisos) { this.permisos = permisos; }
    public Boolean getEsSistema() { return esSistema; }
    public LocalDateTime getCreadoEn() { return creadoEn; }
}
