package pe.upn.boticabelen.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/** Tabla usuario: administradores, empleados y clientes. */
@Entity
@Table(name = "usuario")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idUsuario")
    private Integer idUsuario;

    @Column(name = "nombre", nullable = false, length = 100)
    private String nombre;

    @Column(name = "telefono", length = 20)
    private String telefono;

    @Column(name = "email", nullable = false, unique = true, length = 100)
    private String email;

    @Column(name = "passwordHash", nullable = false)
    private String passwordHash;

    /** ENUM('Admin', 'Empleado', 'Cliente') */
    @Column(name = "rol", nullable = false)
    private String rol = "Cliente";

    @Column(name = "carrito_json", columnDefinition = "TEXT")
    private String carritoJson;

    /** 1 = activo, 0 = inactivo o bloqueado */
    @Column(name = "estado", nullable = false)
    private Integer estado = 1;

    @Column(name = "intentos_fallidos", nullable = false)
    private Integer intentosFallidos = 0;

    /** RF02: hasta cuándo está bloqueada la cuenta por intentos fallidos (null = no bloqueada). */
    @Column(name = "bloqueado_hasta")
    private LocalDateTime bloqueadoHasta;

    public Integer getIdUsuario() { return idUsuario; }
    public void setIdUsuario(Integer idUsuario) { this.idUsuario = idUsuario; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public String getRol() { return rol; }
    public void setRol(String rol) { this.rol = rol; }
    public String getCarritoJson() { return carritoJson; }
    public void setCarritoJson(String carritoJson) { this.carritoJson = carritoJson; }
    public Integer getEstado() { return estado; }
    public void setEstado(Integer estado) { this.estado = estado; }
    public Integer getIntentosFallidos() { return intentosFallidos; }
    public void setIntentosFallidos(Integer intentosFallidos) { this.intentosFallidos = intentosFallidos; }

    public LocalDateTime getBloqueadoHasta() { return bloqueadoHasta; }
    public void setBloqueadoHasta(LocalDateTime bloqueadoHasta) { this.bloqueadoHasta = bloqueadoHasta; }

    /** Bloqueo temporal vigente en este momento. */
    public boolean bloqueadoAhora() {
        return bloqueadoHasta != null && bloqueadoHasta.isAfter(LocalDateTime.now());
    }

    public boolean activo() { return estado != null && estado == 1; }
}
