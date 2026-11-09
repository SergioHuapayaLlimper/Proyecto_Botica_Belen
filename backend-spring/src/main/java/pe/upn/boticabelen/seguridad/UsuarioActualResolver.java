package pe.upn.boticabelen.seguridad;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.MethodParameter;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;
import pe.upn.boticabelen.entity.Usuario;

/** Resuelve los parámetros anotados con @UsuarioActual a partir de lo que dejó AuthInterceptor. */
@Component
public class UsuarioActualResolver implements HandlerMethodArgumentResolver {

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.hasParameterAnnotation(UsuarioActual.class) && parameter.getParameterType().equals(Usuario.class);
    }

    @Override
    public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                  NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
        HttpServletRequest request = webRequest.getNativeRequest(HttpServletRequest.class);
        return request == null ? null : request.getAttribute(AuthInterceptor.ATRIBUTO_USUARIO);
    }
}
