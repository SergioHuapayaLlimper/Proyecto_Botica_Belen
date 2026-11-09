package pe.upn.boticabelen.seguridad;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Marca un endpoint como protegido: exige un token JWT válido y, además:
 * <ul>
 *   <li>{@code @Requiere} — cualquier usuario con sesión.</li>
 *   <li>{@code @Requiere(cliente = true)} — solo clientes.</li>
 *   <li>{@code @Requiere(personal = true)} — cualquier cuenta del personal.</li>
 *   <li>{@code @Requiere({"productos", "productos_editar"})} — personal con AL MENOS uno de esos permisos.</li>
 * </ul>
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface Requiere {
    /** Permisos del catálogo (Permisos.CATALOGO); basta con tener uno. */
    String[] value() default {};

    boolean cliente() default false;

    boolean personal() default false;
}
