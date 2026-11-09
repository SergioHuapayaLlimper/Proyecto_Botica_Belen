package pe.upn.boticabelen.seguridad;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/** Inyecta en el controlador el usuario autenticado de la petición: {@code @UsuarioActual Usuario usuario}. */
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
public @interface UsuarioActual {
}
