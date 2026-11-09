import { Router } from 'express';
import { HttpError, query, queryOne } from '../db.js';
import { firmarToken, hashPassword, requiere, usuarioPublico, verificarPassword } from '../auth.js';
import { email, password, telefono, texto } from '../negocio.js';

const router = Router();
const MAX_INTENTOS = 5;

// Inicio de sesión (mismas reglas que la versión PHP: bloqueo tras 5 intentos fallidos).
router.post('/login', async (req, res) => {
  const correo = String(req.body.email ?? '').trim().toLowerCase();
  const clave = String(req.body.password ?? '');
  if (!correo || !clave) throw new HttpError(400, 'Por favor, complete todos los campos.');

  const usuario = await queryOne('SELECT * FROM usuario WHERE email = ? LIMIT 1', [correo]);
  if (!usuario) throw new HttpError(401, 'Credenciales incorrectas.');
  if (usuario.estado === 0) throw new HttpError(403, 'Su cuenta está inactiva o bloqueada. Contacte al administrador.');

  if (await verificarPassword(clave, usuario.passwordHash)) {
    if (usuario.intentos_fallidos > 0) await query('UPDATE usuario SET intentos_fallidos = 0 WHERE idUsuario = ?', [usuario.idUsuario]);
    return res.json({ token: firmarToken(usuario), usuario: usuarioPublico(usuario) });
  }

  const intentos = usuario.intentos_fallidos + 1;
  if (intentos >= MAX_INTENTOS) {
    await query('UPDATE usuario SET intentos_fallidos = ?, estado = 0 WHERE idUsuario = ?', [intentos, usuario.idUsuario]);
    throw new HttpError(403, 'Cuenta bloqueada por múltiples intentos fallidos. Contacte al administrador.');
  }
  await query('UPDATE usuario SET intentos_fallidos = ? WHERE idUsuario = ?', [intentos, usuario.idUsuario]);
  const quedan = MAX_INTENTOS - intentos;
  throw new HttpError(401, `Credenciales incorrectas. Le ${quedan === 1 ? 'queda 1 intento' : `quedan ${quedan} intentos`}.`);
});

// Registro de clientes desde el portal.
router.post('/registro', async (req, res) => {
  const nombre = texto(req.body.nombre, 'Nombre', { min: 3, max: 100 });
  const correo = email(req.body.email);
  const tel = telefono(req.body.telefono);
  const clave = password(req.body.password);

  const existe = await queryOne('SELECT idUsuario FROM usuario WHERE email = ?', [correo]);
  if (existe) throw new HttpError(409, 'Ya existe una cuenta con ese correo.');

  const result = await query(
    "INSERT INTO usuario (nombre, telefono, email, passwordHash, rol, estado) VALUES (?, ?, ?, ?, 'Cliente', 1)",
    [nombre, tel, correo, await hashPassword(clave)],
  );
  const usuario = await queryOne('SELECT * FROM usuario WHERE idUsuario = ?', [result.insertId]);
  res.status(201).json({ token: firmarToken(usuario), usuario: usuarioPublico(usuario) });
});

router.get('/me', requiere(), (req, res) => res.json(usuarioPublico(req.usuario)));

router.put('/perfil', requiere(), async (req, res) => {
  const nombre = texto(req.body.nombre, 'Nombre', { min: 3, max: 100 });
  const correo = email(req.body.email);
  const tel = telefono(req.body.telefono);

  const otro = await queryOne('SELECT idUsuario FROM usuario WHERE email = ? AND idUsuario <> ?', [correo, req.usuario.idUsuario]);
  if (otro) throw new HttpError(409, 'Otro usuario ya usa ese correo.');

  await query('UPDATE usuario SET nombre = ?, email = ?, telefono = ? WHERE idUsuario = ?', [nombre, correo, tel, req.usuario.idUsuario]);
  res.json(usuarioPublico({ ...req.usuario, nombre, email: correo, telefono: tel }));
});

router.put('/password', requiere(), async (req, res) => {
  const actual = String(req.body.actual ?? '');
  const nueva = password(req.body.nueva);
  const usuario = await queryOne('SELECT passwordHash FROM usuario WHERE idUsuario = ?', [req.usuario.idUsuario]);
  if (!(await verificarPassword(actual, usuario.passwordHash))) throw new HttpError(400, 'La contraseña actual es incorrecta.');
  await query('UPDATE usuario SET passwordHash = ? WHERE idUsuario = ?', [await hashPassword(nueva), req.usuario.idUsuario]);
  res.json({ message: 'Contraseña actualizada correctamente.' });
});

export default router;
