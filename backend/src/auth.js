import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { HttpError, queryOne } from './db.js';

const SECRET = process.env.JWT_SECRET;
if (!SECRET || SECRET.length < 16) {
  console.error('Falta JWT_SECRET en el archivo .env (mínimo 16 caracteres).');
  process.exit(1);
}

export const ROLES = ['Admin', 'Empleado', 'Cliente'];

export function firmarToken(usuario) {
  return jwt.sign({ id: usuario.idUsuario, rol: usuario.rol }, SECRET, { expiresIn: '8h' });
}

// PHP guarda los hashes como $2y$...; bcryptjs usa $2b$. Es el mismo algoritmo, solo cambia el prefijo,
// así las contraseñas sirven en ambas versiones (PHP y Node).
export async function hashPassword(password) {
  const hash = await bcrypt.hash(password, 10);
  return hash.replace(/^\$2[ab]\$/, '$2y$');
}

export function verificarPassword(password, hash) {
  return bcrypt.compare(password, String(hash).replace(/^\$2y\$/, '$2b$'));
}

export function usuarioPublico(u) {
  return { idUsuario: u.idUsuario, nombre: u.nombre, email: u.email, telefono: u.telefono, rol: u.rol };
}

// Middleware: exige un token válido y, opcionalmente, uno de los roles indicados (RBAC).
// Se consulta la BD en cada petición para que una cuenta desactivada pierda el acceso al instante.
export function requiere(...roles) {
  return async (req, res, next) => {
    const header = req.headers.authorization ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new HttpError(401, 'Debe iniciar sesión.');

    let payload;
    try {
      payload = jwt.verify(token, SECRET);
    } catch {
      throw new HttpError(401, 'Su sesión expiró. Vuelva a iniciar sesión.');
    }

    const usuario = await queryOne('SELECT idUsuario, nombre, email, telefono, rol, estado FROM usuario WHERE idUsuario = ?', [payload.id]);
    if (!usuario || usuario.estado !== 1) throw new HttpError(401, 'Su cuenta está inactiva.');
    if (roles.length && !roles.includes(usuario.rol)) throw new HttpError(403, 'No tiene permisos para realizar esta acción.');

    req.usuario = usuario;
    next();
  };
}
