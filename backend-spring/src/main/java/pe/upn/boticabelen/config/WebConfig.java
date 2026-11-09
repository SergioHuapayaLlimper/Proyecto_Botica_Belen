package pe.upn.boticabelen.config;

import java.util.Arrays;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import pe.upn.boticabelen.seguridad.AuthInterceptor;
import pe.upn.boticabelen.seguridad.UsuarioActualResolver;

/** CORS para Angular, interceptor de autenticación y resolución de @UsuarioActual. */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final AuthInterceptor authInterceptor;
    private final UsuarioActualResolver usuarioActualResolver;
    private final String[] origenes;

    public WebConfig(AuthInterceptor authInterceptor, UsuarioActualResolver usuarioActualResolver,
                     @Value("${app.cors.origins}") String origenes) {
        this.authInterceptor = authInterceptor;
        this.usuarioActualResolver = usuarioActualResolver;
        this.origenes = Arrays.stream(origenes.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toArray(String[]::new);
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(origenes)
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*");
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(authInterceptor).addPathPatterns("/api/**");
    }

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.add(usuarioActualResolver);
    }
}
