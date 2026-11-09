import { Router } from 'express';
import { HttpError, query, queryOne, transaction } from '../db.js';
import { hashPassword, requiere } from '../auth.js';
import { ESTADOS, email, entero, password, rangoFechas, redondear, telefono, texto } from '../negocio.js';
import { cambiarEstado, obtenerPedido } from './pedidos.js';

const router = Router();
const staff = requiere('Admin', 'Empleado');
const admin = requiere('Admin');

// ===========================================================================
// PEDIDOS — Admin consulta; Empleado además cambia estados (igual que en la versión PHP).
// ===========================================================================
router.get('/pedidos', staff, async (req, res) => {
  const where = ['1 = 1'];
  const params = [];
  if (ESTADOS.includes(req.query.estado)) {
    where.push('p.estadoPedido = ?');
    params.push(req.query.estado);
  } else if (req.query.estado === 'activos') {
    where.push("p.estadoPedido NOT IN ('Entregado', 'Cancelado', 'Rechazado')");
  }
  const q = String(req.query.q ?? '').trim().slice(0, 60);
  if (q) {
    where.push('(p.codigoPedido LIKE ? OR u.nombre LIKE ? OR u.email LIKE ?)');
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  res.json(
    await query(
      `SELECT p.idPedido, p.codigoPedido, p.fechaHoraToma, p.estadoPedido, p.metodoPago, p.total,
              u.nombre AS nombreCliente, u.telefono AS telefonoCliente,
              (SELECT COALESCE(SUM(cantidad), 0) FROM detalle_pedido d WHERE d.idPedido = p.idPedido) AS unidades
       FROM pedido p LEFT JOIN usuario u ON u.idUsuario = p.idUsuario
       WHERE ${where.join(' AND ')}
       ORDER BY FIELD(p.estadoPedido, 'Pendiente') DESC, p.fechaHoraToma DESC
       LIMIT 300`,
      params,
    ),
  );
});

// "Qué preparar ahora": productos de los pedidos aceptados o en preparación, con su ubicación en anaquel.
router.get('/preparar', staff, async (req, res) => {
  res.json(
    await query(
      `SELECT p.idPedido, p.codigoPedido, p.estadoPedido, p.fechaHoraToma, u.nombre AS nombreCliente,
              d.idProducto, pr.codigoProducto, pr.nombreProducto, pr.ubicacionAnaquel, d.cantidad
       FROM pedido p
       JOIN detalle_pedido d ON d.idPedido = p.idPedido
       LEFT JOIN producto pr ON pr.idProducto = d.idProducto
       LEFT JOIN usuario u ON u.idUsuario = p.idUsuario
       WHERE p.estadoPedido IN ('Aceptado', 'En preparación')
       ORDER BY pr.ubicacionAnaquel, pr.nombreProducto, p.fechaHoraToma`,
    ),
  );
});

// Para el aviso de "pedidos nuevos" del panel (se consulta cada pocos segundos).
router.get('/pedidos/resumen', staff, async (req, res) => {
  res.json(await queryOne("SELECT COUNT(*) AS pendientes, MAX(idPedido) AS ultimoId FROM pedido WHERE estadoPedido = 'Pendiente'"));
});

router.patch('/pedidos/:id/estado', requiere('Empleado'), async (req, res) => {
  const id = Number(req.params.id) || 0;
  const nuevo = String(req.body.estado ?? '');
  if (!ESTADOS.includes(nuevo)) throw new HttpError(400, 'Estado no válido.');
  const motivo = String(req.body.motivo ?? '').trim();
  if ((nuevo === 'Cancelado' || nuevo === 'Rechazado') && motivo.length < 10) {
    throw new HttpError(400, 'Indique el motivo (mínimo 10 caracteres).');
  }
  await transaction(async (conn) => {
    const [[pedido]] = await conn.query('SELECT * FROM pedido WHERE idPedido = ? FOR UPDATE', [id]);
    if (!pedido) throw new HttpError(404, 'Pedido no encontrado.');
    await cambiarEstado(conn, pedido, nuevo, motivo ? `${motivo} (por ${req.usuario.nombre})` : null);
  });
  res.json(await obtenerPedido(id));
});

// ===========================================================================
// PRODUCTOS — Admin y Empleado consultan; solo Admin crea, edita y ajusta stock.
// ===========================================================================
const ORDEN_PRODUCTOS = {
  nombre_asc: 'p.nombreProducto ASC',
  nombre_desc: 'p.nombreProducto DESC',
  precio_asc: 'p.precioProducto ASC',
  precio_desc: 'p.precioProducto DESC',
  stock_asc: 'p.stock ASC',
  stock_desc: 'p.stock DESC',
};
export const STOCK_BAJO = 5;

router.get('/categorias', staff, async (req, res) => {
  res.json(await query('SELECT idCategoria, nombreCategoria, estadoCategoria FROM categoria ORDER BY nombreCategoria'));
});

router.get('/productos', staff, async (req, res) => {
  const where = ['1 = 1'];
  const params = [];
  const q = String(req.query.q ?? '').trim().slice(0, 80);
  if (q) {
    where.push('(p.nombreProducto LIKE ? OR p.codigoProducto LIKE ? OR c.nombreCategoria LIKE ?)');
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (Number(req.query.categoria)) {
    where.push('p.idCategoria = ?');
    params.push(Number(req.query.categoria));
  }
  if (req.query.stock === 'agotado') where.push('p.stock = 0');
  if (req.query.stock === 'bajo') where.push(`p.stock BETWEEN 1 AND ${STOCK_BAJO}`);
  if (req.query.estado === 'Activo' || req.query.estado === 'Inactivo') {
    where.push('p.estadoProducto = ?');
    params.push(req.query.estado);
  }
  const orden = ORDEN_PRODUCTOS[req.query.orden] ?? ORDEN_PRODUCTOS.nombre_asc;
  res.json(
    await query(
      `SELECT p.*, c.nombreCategoria FROM producto p LEFT JOIN categoria c ON c.idCategoria = p.idCategoria
       WHERE ${where.join(' AND ')} ORDER BY ${orden}`,
      params,
    ),
  );
});

router.get('/productos/:id', staff, async (req, res) => {
  const producto = await queryOne('SELECT p.*, c.nombreCategoria FROM producto p LEFT JOIN categoria c ON c.idCategoria = p.idCategoria WHERE p.idProducto = ?', [
    Number(req.params.id) || 0,
  ]);
  if (!producto) throw new HttpError(404, 'Producto no encontrado.');
  res.json(producto);
});

async function validarProducto(body, idActual = 0) {
  const codigo = texto(body.codigoProducto, 'Código', { min: 3, max: 20 }).toUpperCase();
  if (!/^[A-Z0-9-]+$/.test(codigo)) throw new HttpError(400, 'El código solo admite letras, números y guiones.');
  const repetido = await queryOne('SELECT idProducto FROM producto WHERE codigoProducto = ? AND idProducto <> ?', [codigo, idActual]);
  if (repetido) throw new HttpError(409, `Ya existe un producto con el código ${codigo}.`);

  const idCategoria = entero(body.idCategoria, 'Categoría', { min: 1 });
  if (!(await queryOne('SELECT idCategoria FROM categoria WHERE idCategoria = ?', [idCategoria]))) throw new HttpError(400, 'La categoría no existe.');

  const precio = Number(body.precioProducto);
  if (!(precio > 0 && precio < 100000)) throw new HttpError(400, 'El precio debe ser mayor a 0.');
  const imagenURL = texto(body.imagenURL, 'Imagen', { max: 255, requerido: false });
  if (imagenURL && !/^https?:\/\//i.test(imagenURL)) throw new HttpError(400, 'La imagen debe ser una URL que empiece con http:// o https://');

  return {
    codigoProducto: codigo,
    nombreProducto: texto(body.nombreProducto, 'Nombre', { min: 3, max: 100 }),
    descripcionProducto: texto(body.descripcionProducto, 'Descripción', { max: 2000, requerido: false }) || null,
    idCategoria,
    precioProducto: Math.round(precio * 100) / 100,
    estadoProducto: body.estadoProducto === 'Inactivo' ? 'Inactivo' : 'Activo',
    requiere_receta: body.requiere_receta ? 1 : 0,
    imagenURL: imagenURL || null,
    ubicacionAnaquel: texto(body.ubicacionAnaquel, 'Ubicación', { max: 50, requerido: false }) || null,
  };
}

router.post('/productos', admin, async (req, res) => {
  const datos = await validarProducto(req.body);
  datos.stock = entero(req.body.stock ?? 0, 'Stock', { max: 100000 });
  const result = await query('INSERT INTO producto SET ?', [datos]);
  res.status(201).json(await queryOne('SELECT * FROM producto WHERE idProducto = ?', [result.insertId]));
});

router.put('/productos/:id', admin, async (req, res) => {
  const id = Number(req.params.id) || 0;
  if (!(await queryOne('SELECT idProducto FROM producto WHERE idProducto = ?', [id]))) throw new HttpError(404, 'Producto no encontrado.');
  const datos = await validarProducto(req.body, id);
  await query('UPDATE producto SET ? WHERE idProducto = ?', [datos, id]);
  res.json(await queryOne('SELECT * FROM producto WHERE idProducto = ?', [id]));
});

// Fija el stock a un valor exacto (inventario físico) — corrige el error de la versión PHP.
router.patch('/productos/:id/stock', admin, async (req, res) => {
  const id = Number(req.params.id) || 0;
  const stock = entero(req.body.stock, 'Stock', { max: 100000 });
  const result = await query('UPDATE producto SET stock = ? WHERE idProducto = ?', [stock, id]);
  if (!result.affectedRows) throw new HttpError(404, 'Producto no encontrado.');
  res.json(await queryOne('SELECT * FROM producto WHERE idProducto = ?', [id]));
});

// ===========================================================================
// EMPLEADOS — solo Admin. Roles válidos: 'Admin' y 'Empleado' (los del ENUM).
// ===========================================================================
const ROLES_PERSONAL = ['Admin', 'Empleado'];
const CAMPOS_USUARIO = 'idUsuario, nombre, telefono, email, rol, estado, intentos_fallidos';

router.get('/empleados', admin, async (req, res) => {
  res.json(await query(`SELECT ${CAMPOS_USUARIO} FROM usuario WHERE rol IN ('Admin', 'Empleado') ORDER BY rol, nombre`));
});

router.post('/empleados', admin, async (req, res) => {
  const datos = {
    nombre: texto(req.body.nombre, 'Nombre', { min: 3, max: 100 }),
    email: email(req.body.email),
    telefono: telefono(req.body.telefono),
    rol: ROLES_PERSONAL.includes(req.body.rol) ? req.body.rol : 'Empleado',
    passwordHash: await hashPassword(password(req.body.password)),
    estado: 1,
  };
  if (await queryOne('SELECT idUsuario FROM usuario WHERE email = ?', [datos.email])) throw new HttpError(409, 'Ya existe un usuario con ese correo.');
  const result = await query('INSERT INTO usuario SET ?', [datos]);
  res.status(201).json(await queryOne(`SELECT ${CAMPOS_USUARIO} FROM usuario WHERE idUsuario = ?`, [result.insertId]));
});

router.put('/empleados/:id', admin, async (req, res) => {
  const id = Number(req.params.id) || 0;
  const actual = await queryOne("SELECT idUsuario FROM usuario WHERE idUsuario = ? AND rol IN ('Admin', 'Empleado')", [id]);
  if (!actual) throw new HttpError(404, 'Empleado no encontrado.');

  const datos = {
    nombre: texto(req.body.nombre, 'Nombre', { min: 3, max: 100 }),
    email: email(req.body.email),
    telefono: telefono(req.body.telefono),
    rol: ROLES_PERSONAL.includes(req.body.rol) ? req.body.rol : 'Empleado',
    estado: req.body.estado ? 1 : 0,
  };
  if (id === req.usuario.idUsuario && (datos.rol !== 'Admin' || !datos.estado)) {
    throw new HttpError(400, 'No puede quitarse el rol de administrador ni desactivar su propia cuenta.');
  }
  if (await queryOne('SELECT idUsuario FROM usuario WHERE email = ? AND idUsuario <> ?', [datos.email, id])) throw new HttpError(409, 'Otro usuario ya usa ese correo.');
  if (datos.estado) datos.intentos_fallidos = 0; // reactivar también desbloquea la cuenta
  if (req.body.password) datos.passwordHash = await hashPassword(password(req.body.password));

  await query('UPDATE usuario SET ? WHERE idUsuario = ?', [datos, id]);
  res.json(await queryOne(`SELECT ${CAMPOS_USUARIO} FROM usuario WHERE idUsuario = ?`, [id]));
});

router.delete('/empleados/:id', admin, async (req, res) => {
  const id = Number(req.params.id) || 0;
  if (id === req.usuario.idUsuario) throw new HttpError(400, 'No puede eliminar su propia cuenta.');
  try {
    const result = await query("DELETE FROM usuario WHERE idUsuario = ? AND rol IN ('Admin', 'Empleado')", [id]);
    if (!result.affectedRows) throw new HttpError(404, 'Empleado no encontrado.');
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2') throw new HttpError(409, 'Tiene pedidos asociados: desactívelo en lugar de eliminarlo.');
    throw error;
  }
  res.status(204).end();
});

// ===========================================================================
// DASHBOARD Y REPORTE — solo Admin.
// ===========================================================================
const VENTA_VALIDA = "estadoPedido NOT IN ('Cancelado', 'Rechazado')";

router.get('/dashboard', admin, async (req, res) => {
  const { desde, hasta } = rangoFechas(req.query);
  const rango = 'DATE(fechaHoraToma) BETWEEN ? AND ?';

  const [kpis, ventasPorDia, porEstado, metodosPago, ventasMensuales, topProductos, stockBajo] = await Promise.all([
    queryOne(
      `SELECT
         (SELECT COUNT(*) FROM pedido WHERE ${rango}) AS pedidos,
         (SELECT COALESCE(SUM(total), 0) FROM pedido WHERE ${rango} AND ${VENTA_VALIDA}) AS ventas,
         (SELECT COUNT(*) FROM pedido WHERE ${rango} AND ${VENTA_VALIDA}) AS pedidosValidos,
         (SELECT COUNT(*) FROM pedido WHERE estadoPedido = 'Pendiente') AS pendientes,
         (SELECT COUNT(*) FROM usuario WHERE rol = 'Cliente') AS clientes,
         (SELECT COUNT(*) FROM producto WHERE estadoProducto = 'Activo' AND stock = 0) AS agotados,
         (SELECT COUNT(*) FROM producto WHERE estadoProducto = 'Activo' AND stock BETWEEN 1 AND ${STOCK_BAJO}) AS stockBajo`,
      [desde, hasta, desde, hasta, desde, hasta],
    ),
    query(
      `SELECT DATE(fechaHoraToma) AS dia, COUNT(*) AS pedidos, COALESCE(SUM(total), 0) AS monto
       FROM pedido WHERE ${rango} AND ${VENTA_VALIDA} GROUP BY DATE(fechaHoraToma) ORDER BY dia`,
      [desde, hasta],
    ),
    query(`SELECT estadoPedido AS estado, COUNT(*) AS total FROM pedido WHERE ${rango} GROUP BY estadoPedido ORDER BY total DESC`, [desde, hasta]),
    query(
      `SELECT metodoPago AS metodo, COUNT(*) AS total FROM pedido
       WHERE ${rango} AND ${VENTA_VALIDA} AND metodoPago IS NOT NULL GROUP BY metodoPago ORDER BY total DESC`,
      [desde, hasta],
    ),
    query(
      `SELECT DATE_FORMAT(fechaHoraToma, '%Y-%m') AS mes, COALESCE(SUM(total), 0) AS monto, COUNT(*) AS pedidos
       FROM pedido WHERE ${VENTA_VALIDA} AND fechaHoraToma >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
       GROUP BY DATE_FORMAT(fechaHoraToma, '%Y-%m') ORDER BY mes`,
    ),
    query(
      `SELECT d.idProducto, pr.nombreProducto, SUM(d.cantidad) AS unidades, SUM(d.subtotal) AS monto
       FROM detalle_pedido d
       JOIN pedido p ON p.idPedido = d.idPedido AND DATE(p.fechaHoraToma) BETWEEN ? AND ? AND p.${VENTA_VALIDA}
       LEFT JOIN producto pr ON pr.idProducto = d.idProducto
       GROUP BY d.idProducto, pr.nombreProducto ORDER BY unidades DESC LIMIT 6`,
      [desde, hasta],
    ),
    query(
      `SELECT idProducto, codigoProducto, nombreProducto, stock FROM producto
       WHERE estadoProducto = 'Activo' AND stock <= ${STOCK_BAJO} ORDER BY stock, nombreProducto LIMIT 8`,
    ),
  ]);

  res.json({ desde, hasta, kpis: { ...kpis, ticketPromedio: kpis.pedidosValidos ? kpis.ventas / kpis.pedidosValidos : 0 }, ventasPorDia, porEstado, metodosPago, ventasMensuales, topProductos, stockBajo });
});

router.get('/reporte', admin, async (req, res) => {
  const { desde, hasta } = rangoFechas(req.query);
  const where = ['DATE(p.fechaHoraToma) BETWEEN ? AND ?'];
  const params = [desde, hasta];
  if (ESTADOS.includes(req.query.estado)) {
    where.push('p.estadoPedido = ?');
    params.push(req.query.estado);
  }
  if (Number(req.query.producto)) {
    where.push('EXISTS (SELECT 1 FROM detalle_pedido d WHERE d.idPedido = p.idPedido AND d.idProducto = ?)');
    params.push(Number(req.query.producto));
  }
  const pedidos = await query(
    `SELECT p.idPedido, p.codigoPedido, p.fechaHoraToma, p.estadoPedido, p.metodoPago, p.subtotalGeneral, p.igv, p.total, u.nombre AS nombreCliente
     FROM pedido p LEFT JOIN usuario u ON u.idUsuario = p.idUsuario
     WHERE ${where.join(' AND ')} ORDER BY p.fechaHoraToma DESC`,
    params,
  );
  const validos = pedidos.filter((p) => p.estadoPedido !== 'Cancelado' && p.estadoPedido !== 'Rechazado');
  res.json({
    desde,
    hasta,
    pedidos,
    totales: {
      cantidad: pedidos.length,
      monto: redondear(validos.reduce((s, p) => s + p.total, 0)),
      igv: redondear(validos.reduce((s, p) => s + p.igv, 0)),
      entregados: pedidos.filter((p) => p.estadoPedido === 'Entregado').length,
      cancelados: pedidos.filter((p) => p.estadoPedido === 'Cancelado' || p.estadoPedido === 'Rechazado').length,
    },
  });
});

export default router;
