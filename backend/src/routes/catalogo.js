import { Router } from 'express';
import { HttpError, query, queryOne } from '../db.js';

const router = Router();

// Solo se muestran productos activos y de venta libre (los que requieren receta se venden en tienda).
const PUBLICO = "p.estadoProducto = 'Activo' AND p.requiere_receta = 0";

const ORDENES = {
  nombre_asc: 'p.nombreProducto ASC',
  nombre_desc: 'p.nombreProducto DESC',
  precio_asc: 'p.precioProducto ASC',
  precio_desc: 'p.precioProducto DESC',
};

const CAMPOS = `p.idProducto, p.idCategoria, c.nombreCategoria, p.codigoProducto, p.nombreProducto, p.descripcionProducto,
  p.precioProducto, p.stock, p.imagenURL`;

router.get('/categorias', async (req, res) => {
  res.json(
    await query(
      `SELECT c.idCategoria, c.nombreCategoria, COUNT(p.idProducto) AS productos
       FROM categoria c
       LEFT JOIN producto p ON p.idCategoria = c.idCategoria AND ${PUBLICO}
       WHERE c.estadoCategoria = 'Activo'
       GROUP BY c.idCategoria, c.nombreCategoria
       ORDER BY c.nombreCategoria`,
    ),
  );
});

// Catálogo con búsqueda, categoría, orden y paginación.
router.get('/productos', async (req, res) => {
  const q = String(req.query.q ?? '').trim().slice(0, 80);
  const categoria = Number(req.query.categoria) || 0;
  const disponibles = req.query.disponibles === '1';
  const orden = ORDENES[req.query.orden] ?? ORDENES.nombre_asc;
  const limite = Math.min(48, Math.max(1, Number(req.query.limite) || 24));
  const pagina = Math.max(1, Number(req.query.pagina) || 1);

  const where = [PUBLICO];
  const params = [];
  if (q) {
    where.push('(p.nombreProducto LIKE ? OR p.codigoProducto LIKE ? OR c.nombreCategoria LIKE ?)');
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (categoria) {
    where.push('p.idCategoria = ?');
    params.push(categoria);
  }
  if (disponibles) where.push('p.stock > 0');

  const from = `FROM producto p LEFT JOIN categoria c ON c.idCategoria = p.idCategoria WHERE ${where.join(' AND ')}`;
  const { total } = await queryOne(`SELECT COUNT(*) AS total ${from}`, params);
  // Los agotados van al final para que el cliente vea primero lo que puede comprar.
  const items = await query(`SELECT ${CAMPOS} ${from} ORDER BY (p.stock = 0), ${orden} LIMIT ? OFFSET ?`, [...params, limite, (pagina - 1) * limite]);

  res.json({ items, total, pagina, totalPaginas: Math.max(1, Math.ceil(total / limite)) });
});

// Los más vendidos (para la página de inicio).
router.get('/productos/destacados', async (req, res) => {
  const vendidos = await query(
    `SELECT ${CAMPOS}, SUM(dp.cantidad) AS vendidos
     FROM producto p
     LEFT JOIN categoria c ON c.idCategoria = p.idCategoria
     JOIN detalle_pedido dp ON dp.idProducto = p.idProducto
     JOIN pedido pe ON pe.idPedido = dp.idPedido AND pe.estadoPedido NOT IN ('Cancelado', 'Rechazado')
     WHERE ${PUBLICO} AND p.stock > 0
     GROUP BY p.idProducto, c.nombreCategoria
     ORDER BY vendidos DESC
     LIMIT 8`,
  );
  if (vendidos.length >= 8) return res.json(vendidos);
  const ids = vendidos.map((p) => p.idProducto);
  const relleno = await query(
    `SELECT ${CAMPOS} FROM producto p LEFT JOIN categoria c ON c.idCategoria = p.idCategoria
     WHERE ${PUBLICO} AND p.stock > 0 ${ids.length ? 'AND p.idProducto NOT IN (?)' : ''}
     ORDER BY p.stock DESC, p.nombreProducto LIMIT ?`,
    ids.length ? [ids, 8 - ids.length] : [8 - ids.length],
  );
  res.json([...vendidos, ...relleno]);
});

router.get('/productos/:id', async (req, res) => {
  const producto = await queryOne(
    `SELECT ${CAMPOS} FROM producto p LEFT JOIN categoria c ON c.idCategoria = p.idCategoria WHERE p.idProducto = ? AND ${PUBLICO}`,
    [Number(req.params.id) || 0],
  );
  if (!producto) throw new HttpError(404, 'Producto no encontrado.');
  res.json(producto);
});

export default router;
