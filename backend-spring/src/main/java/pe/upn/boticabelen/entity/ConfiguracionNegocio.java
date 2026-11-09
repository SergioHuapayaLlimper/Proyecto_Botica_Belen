package pe.upn.boticabelen.entity;

import jakarta.persistence.*;

/** Tabla configuracion_negocio: datos del negocio editables por el admin (clave → valor). */
@Entity
@Table(name = "configuracion_negocio")
public class ConfiguracionNegocio {

    @Id
    @Column(name = "clave", length = 50)
    private String clave;

    @Column(name = "valor", columnDefinition = "TEXT")
    private String valor;

    protected ConfiguracionNegocio() {}

    public ConfiguracionNegocio(String clave, String valor) {
        this.clave = clave;
        this.valor = valor;
    }

    public String getClave() { return clave; }
    public String getValor() { return valor; }
    public void setValor(String valor) { this.valor = valor; }
}
