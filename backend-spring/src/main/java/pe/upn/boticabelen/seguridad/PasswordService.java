package pe.upn.boticabelen.seguridad;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Hash de contraseñas con BCrypt. Se usa el prefijo $2y$ (el de PHP) para que las cuentas
 * sigan funcionando en todas las versiones del proyecto (PHP, Node y Spring).
 */
@Service
public class PasswordService {

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(BCryptPasswordEncoder.BCryptVersion.$2Y, 10);

    public String hash(String password) {
        return encoder.encode(password);
    }

    public boolean coincide(String password, String hash) {
        if (password == null || hash == null) return false;
        return encoder.matches(password, hash);
    }
}
