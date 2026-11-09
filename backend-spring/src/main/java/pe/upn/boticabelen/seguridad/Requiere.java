package pe.upn.boticabelen.seguridad;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Marca un endpoint como protegido: exige un token JWT válido y, si se indican, uno de los roles (RBAC).
 * Ejemplo: {@code @Requiere({"Admin", "Empleado"})}. Sin roles = cualquier usuario con sesión.
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface Requiere {
    String[] value() default {};
}
