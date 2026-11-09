import { Router } from 'express';
import { HttpError, query, queryOne, transaction } from '../db.js';
import { requiere } from '../auth.js';
import { METODOS_PAGO, desgloseIgv, entero, redondear, siguientesEstados, texto } from '../negocio.js';

const router = Router();

// ---------------------------------------------------------------------------
// Carrito del cliente: se guarda en usuario.carrito_json con el MISMO formato
// que la versión PHP ({ "idProducto": { idProducto, nombre, precio, cantidad } }).
// ---------------------------------------------------------------------------
function leerCarritoJson(json) {
  try {
    const data = JSON.parse(json ?? 'null');
    const lista = Array.isArray(data) ? data : Object.values(data ?? {});
    return lista
      .map((i) => ({ idProducto: Number(i.idProducto), cantidad: Number(i.cantidad) }))
      .filter((i) => i.idProducto > 0 && i.cantidad > 0);
  } catch {
    return [];
  }
}

// Une los ítems con el precio y stock ACTUALES de la base de datos.
async function detallarCarrito(items) {
  if (!items.length) return [];
  const productos = await query(
    `SELECT idProducto, nombreProducto, precioProducto, stock, imagenURL, estadoProducto, requiere_receta
     FROM producto WHERE idProducto IN (?)`,
    [items.map((i) => i.idProducto)],
  );
  return items
    .map((i) => {
      const p = productos.find((x) => x.idProducto === i.idProducto);
      if (!p || p.estadoProducto !== 'Activo' || p.requiere_receta) return null;
      return {
        idProducto: p.idProducto,
        nombreProducto: p.nombreProducto,
        precioProducto: p.precioProducto,
        imagenURL: p.imagenURL,
        stock: p.stock,
        cantidad: Math.min(i.cantidad, Math.max(p.stock, 0)) || i.cantidad,
      };
    })
    .filter(Boolean);
}

router.get('/carrito', requiere('Cliente'), async (req, res) => {
  const fila = await queryOne('SELECT carrito_json FROM usuario WHERE idUsuario = ?', [req.usuario.idUsuario]);
  res.json(await detallarCarrito(leerCarritoJson(fila?.carrito_json)));
});

router.put('/carrito', requiere('Cliente'), async (req, res) => {
  const items = (Array.isArray(req.body.items) ? req.body.items : [])
    .map((i) => ({ idProducto: Number(i.idProducto), cantidad: Math.min(99, Number(i.cantidad)) }))
    .filter((i) => Number.isInteger(i.idProducto) && i.idProducto > 0 && Number.isInteger(i.cantidad) && i.cantidad > 0)
    .slice(0, 60);
  const detalle = await detallarCarrito(items);
  const json = detalle.length
    ? JSON.stringify(Object.fromEntries(detalle.map((d) => [d.idProducto, { idProducto: d.idProducto, nombre: d.nombreProducto, precio: d.precioProducto, cantidad: d.cantidad }])))
    : null;
  await query('UPDATE usuario SET carrito_json = ? WHERE idUsuario = ?', [json, req.usuario.idUsuario]);
  res.json(detalle);
});

// ---------------------------------------------------------------------------
// Registrar pedido (reserva).
// - Precios SIEMPRE desde la BD (el navegador solo envía id y cantidad).
// - El IGV va incluido en el precio: total = suma; subtotal = total / 1.18.
// - El stock se APARTA en la misma transacción (SELECT ... FOR UPDATE evita vender dos veces la última unidad).
// - Toda reserva se recoge en tienda: no se pide dirección.
// ---------------------------------------------------------------------------
router.post('/pedidos', requiere('Cliente'), async (req, res) => {
  const items = (Array.isArray(req.body.items) ? req.body.items : []).map((i) => ({
    idProducto: entero(i.idProducto, 'Producto', { min: 1 }),
    cantidad: entero(i.cantidad, 'Cantidad', { min: 1, max: 99 }),
  }));
  if (!items.length) throw new HttpError(400, 'El carrito está vacío.');
  if (new Set(items.map((i) => i.idProducto)).size !== items.length) throw new HttpError(400, 'Hay productos repetidos en el pedido.');

  const metodoPago = METODOS_PAGO.includes(req.body.metodoPago) ? req.body.metodoPago : null;
  if (!metodoPago) throw new HttpError(400, 'Seleccione un método de pago válido.');
  const observaciones = texto(req.body.observaciones, 'Observaciones', { max: 500, requerido: false });

  const pedido = await transaction(async (conn) => {
    const [productos] = await conn.query(
      'SELECT idProducto, nombreProducto, precioProducto, stock, estadoProducto, requiere_receta FROM producto WHERE idProducto IN (?) FOR UPDATE',
      [items.map((i) => i.idProducto)],
    );

    let total = 0;
    const lineas = items.map((item) => {
      const p = productos.find((x) => x.idProducto === item.idProducto);
      if (!p || p.estadoProducto !== 'Activo') throw new HttpError(409, 'Uno de los productos ya no está disponible.');
      if (p.requiere_receta) throw new HttpError(409, `${p.nombreProducto} requiere receta médica: adquiéralo en tienda.`);
      if (p.stock < item.cantidad) {
        throw new HttpError(409, p.stock === 0 ? `${p.nombreProducto} está agotado.` : `Solo quedan ${p.stock} unidades de ${p.nombreProducto}.`);
      }
      const subtotal = redondear(p.precioProducto * item.cantidad);
      total += subtotal;
      return { ...item, precioUnitario: p.precioProducto, subtotal };
    });

    const montos = desgloseIgv(total);
    const ahora = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const codigoPedido = `BB-${String(ahora.getFullYear()).slice(2)}${pad(ahora.getMonth() + 1)}${pad(ahora.getDate())}-${pad(ahora.getHours())}${pad(ahora.getMinutes())}${pad(ahora.getSeconds())}-${Math.floor(100 + Math.random() * 900)}`;

    const [resultado] = await conn.query(
      `INSERT INTO pedido (codigoPedido, idUsuario, estadoPedido, metodoPago, observaciones, subtotalGeneral, igv, total)
       VALUES (?, ?, 'Pendiente', ?, ?, ?, ?, ?)`,
      [codigoPedido, req.usuario.idUsuario, metodoPago, observaciones || null, montos.subtotalGeneral, montos.igv, montos.total],
    );
    for (const l of lineas) {
      await conn.query('INSERT INTO detalle_pedido (idPedido, idProducto, cantidad, precioUnitario, subtotal) VALUES (?, ?, ?, ?, ?)', [
        resultado.insertId,
        l.idProducto,
        l.cantidad,
        l.precioUnitario,
        l.subtotal,
      ]);
      await conn.query('UPDATE producto SET stock = stock - ? WHERE idProducto = ?', [l.cantidad, l.idProducto]);
    }
    await conn.query('UPDATE usuario SET carrito_json = NULL WHERE idUsuario = ?', [req.usuario.idUsuario]);
    return { idPedido: resultado.insertId, codigoPedido, ...montos };
  });

  res.status(201).json(pedido);
});

router.get('/pedidos/mios', requiere('Cliente'), async (req, res) => {
  res.json(
    await query(
      `SELECT p.idPedido, p.codigoPedido, p.fechaHoraToma, p.estadoPedido, p.metodoPago, p.total,
              (SELECT COALESCE(SUM(cantidad), 0) FROM detalle_pedido d WHERE d.idPedido = p.idPedido) AS unidades
       FROM pedido p WHERE p.idUsuario = ? ORDER BY p.fechaHoraToma DESC`,
      [req.usuario.idUsuario],
    ),
  );
});

// Detalle de un pedido: el cliente solo ve los suyos; Admin y Empleado ven todos.
router.get('/pedidos/:id', requiere(), async (req, res) => {
  const pedido = await obtenerPedido(Number(req.params.id) || 0);
  if (!pedido || (req.usuario.rol === 'Cliente' && pedido.idUsuario !== req.usuario.idUsuario)) throw new HttpError(404, 'Pedido no encontrado.');
  res.json(pedido);
});

// El cliente puede cancelar su pedido mientras siga "Pendiente": se devuelve el stock.
router.post('/pedidos/:id/cancelar', requiere('Cliente'), async (req, res) => {
  const id = Number(req.params.id) || 0;
  await transaction(async (conn) => {
    const [[pedido]] = await conn.query('SELECT * FROM pedido WHERE idPedido = ? FOR UPDATE', [id]);
    if (!pedido || pedido.idUsuario !== req.usuario.idUsuario) throw new HttpError(404, 'Pedido no encontrado.');
    if (pedido.estadoPedido !== 'Pendiente') throw new HttpError(409, 'Solo puede cancelar pedidos pendientes. Comuníquese con la botica.');
    await cambiarEstado(conn, pedido, 'Cancelado', 'Cancelado por el cliente');
  });
  res.json(await obtenerPedido(id));
});

// ---------------------------------------------------------------------------
// Utilidades compartidas con la gestión de pedidos.
// ---------------------------------------------------------------------------
export async function obtenerPedido(id) {
  const pedido = await queryOne(
    `SELECT p.*, u.nombre AS nombreCliente, u.email AS emailCliente, u.telefono AS telefonoCliente
     FROM pedido p LEFT JOIN usuario u ON u.idUsuario = p.idUsuario WHERE p.idPedido = ?`,
    [id],
  );
  if (!pedido) return null;
  const detalles = await query(
    `SELECT d.idDetallePedido, d.idProducto, pr.nombreProducto, pr.codigoProducto, pr.imagenURL, d.cantidad, d.precioUnitario, d.subtotal
     FROM detalle_pedido d LEFT JOIN producto pr ON pr.idProducto = d.idProducto
     WHERE d.idPedido = ? ORDER BY pr.nombreProducto`,
    [id],
  );
  return { ...pedido, siguientes: siguientesEstados(pedido), detalles };
}

// Cambia el estado validando la transición. Si se cancela o rechaza, el stock apartado vuelve al inventario.
export async function cambiarEstado(conn, pedido, nuevoEstado, motivo) {
  if (!siguientesEstados(pedido).includes(nuevoEstado)) {
    throw new HttpError(409, `No se puede pasar de "${pedido.estadoPedido}" a "${nuevoEstado}".`);
  }
  if (nuevoEstado === 'Cancelado' || nuevoEstado === 'Rechazado') {
    const [detalles] = await conn.query('SELECT idProducto, cantidad FROM detalle_pedido WHERE idPedido = ?', [pedido.idPedido]);
    for (const d of detalles) await conn.query('UPDATE producto SET stock = stock + ? WHERE idProducto = ?', [d.cantidad, d.idProducto]);
  }
  const nota = motivo ? `[${nuevoEstado} ${new Date().toLocaleString('es-PE')}] ${motivo}` : null;
  await conn.query(
    `UPDATE pedido SET estadoPedido = ?, observaciones = CASE WHEN ? IS NULL THEN observaciones
       WHEN observaciones IS NULL OR observaciones = '' THEN ? ELSE CONCAT(observaciones, '\n', ?) END
     WHERE idPedido = ?`,
    [nuevoEstado, nota, nota, nota, pedido.idPedido],
  );
}

export default router;
