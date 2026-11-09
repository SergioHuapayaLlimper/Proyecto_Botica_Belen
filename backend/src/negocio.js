import { HttpError } from './db.js';

// ---- Estados del pedido (exactamente los del ENUM de la tabla `pedido`) ----
// Todas las reservas se recogen en tienda: no hay reparto ni dirección de entrega.
export const ESTADOS = ['Pendiente', 'Aceptado', 'Rechazado', 'En preparación', 'Listo para entregar', 'Entregado', 'Cancelado'];
export const ESTADOS_FINALES = ['Entregado', 'Rechazado', 'Cancelado'];

// Máquina de estados: a qué estados puede pasar un pedido desde su estado actual.
export function siguientesEstados(pedido) {
  switch (pedido.estadoPedido) {
    case 'Pendiente':
      return ['Aceptado', 'Rechazado', 'Cancelado'];
    case 'Aceptado':
      return ['En preparación', 'Cancelado'];
    case 'En preparación':
      return ['Listo para entregar', 'Cancelado'];
    case 'Listo para entregar':
      return ['Entregado', 'Cancelado'];
    default:
      return [];
  }
}

// ---- IGV: en Perú los precios de venta YA incluyen el 18 % ----
export const TASA_IGV = 0.18;

export function desgloseIgv(total) {
  const t = redondear(total);
  const subtotal = redondear(t / (1 + TASA_IGV));
  return { subtotalGeneral: subtotal, igv: redondear(t - subtotal), total: t };
}

export const redondear = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

// ---- Validaciones reutilizables ----
export const METODOS_PAGO = ['Efectivo', 'Yape', 'Plin', 'Tarjeta'];

export function texto(valor, campo, { min = 1, max = 255, requerido = true } = {}) {
  const v = String(valor ?? '').trim();
  if (!v && !requerido) return '';
  if (v.length < min) throw new HttpError(400, `${campo}: mínimo ${min} caracteres.`);
  if (v.length > max) throw new HttpError(400, `${campo}: máximo ${max} caracteres.`);
  return v;
}

export function email(valor) {
  const v = String(valor ?? '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || v.length > 100) throw new HttpError(400, 'Correo electrónico inválido.');
  return v;
}

export function telefono(valor) {
  const v = String(valor ?? '').replace(/\s/g, '');
  if (v && !/^\+?\d{6,15}$/.test(v)) throw new HttpError(400, 'Teléfono inválido.');
  return v || null;
}

export function password(valor) {
  const v = String(valor ?? '');
  if (v.length < 6) throw new HttpError(400, 'La contraseña debe tener al menos 6 caracteres.');
  if (v.length > 72) throw new HttpError(400, 'La contraseña es demasiado larga.');
  return v;
}

export function entero(valor, campo, { min = 0, max = 1_000_000 } = {}) {
  const n = Number(valor);
  if (!Number.isInteger(n) || n < min || n > max) throw new HttpError(400, `${campo} debe ser un número entero entre ${min} y ${max}.`);
  return n;
}

// Fecha local AAAA-MM-DD (evita el desfase de toISOString(), que usa UTC).
export const hoy = () => new Date().toLocaleDateString('en-CA');

export function rangoFechas(query) {
  const re = /^\d{4}-\d{2}-\d{2}$/;
  const anio = new Date().getFullYear();
  const desde = re.test(query.desde ?? '') ? query.desde : `${anio}-01-01`;
  const hasta = re.test(query.hasta ?? '') ? query.hasta : hoy();
  return { desde, hasta };
}
