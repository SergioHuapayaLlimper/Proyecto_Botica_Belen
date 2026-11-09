package pe.upn.boticabelen.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import pe.upn.boticabelen.dto.Respuestas.MensajeDto;
import pe.upn.boticabelen.dto.Respuestas.SesionDto;
import pe.upn.boticabelen.dto.Respuestas.UsuarioDto;
import pe.upn.boticabelen.dto.Solicitudes.*;
import pe.upn.boticabelen.entity.Usuario;
import pe.upn.boticabelen.seguridad.Requiere;
import pe.upn.boticabelen.seguridad.UsuarioActual;
import pe.upn.boticabelen.service.AuthService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public SesionDto login(@RequestBody LoginRequest req) {
        return authService.login(req);
    }

    @PostMapping("/registro")
    @ResponseStatus(HttpStatus.CREATED)
    public SesionDto registro(@RequestBody RegistroRequest req) {
        return authService.registrar(req);
    }

    @Requiere
    @GetMapping("/me")
    public UsuarioDto me(@UsuarioActual Usuario usuario) {
        return AuthService.aDto(usuario);
    }

    @Requiere
    @PutMapping("/perfil")
    public UsuarioDto perfil(@UsuarioActual Usuario usuario, @RequestBody PerfilRequest req) {
        return authService.actualizarPerfil(usuario.getIdUsuario(), req);
    }

    @Requiere
    @PutMapping("/password")
    public MensajeDto password(@UsuarioActual Usuario usuario, @RequestBody PasswordRequest req) {
        authService.cambiarPassword(usuario.getIdUsuario(), req);
        return new MensajeDto("Contraseña actualizada correctamente.");
    }
}
