import { EstadoPedido } from './modelos';

const soles = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 2 });

// Espacio duro entre "S/" y la cifra: el monto nunca se parte en dos líneas.
const ESPACIO_DURO = String.fromCharCode(160);
export const formatoSoles = (monto: number | null | undefined) => soles.format(Number(monto ?? 0)).replace('S/', 'S/ ').replace(/\s+/, ESPACIO_DURO);

// "2026-09-21 15:00:00" → Date local (sin desfase de zona horaria).
export function aFecha(valor: string): Date {
  const [d, t = '00:00:00'] = valor.split(/[ T]/);
  const [y, m, dia] = d.split('-').map(Number);
  const [h, min, s] = t.split(':').map(Number);
  return new Date(y, m - 1, dia, h, min, s || 0);
}

export function formatoFecha(valor: string, conHora = true): string {
  const fecha = aFecha(valor);
  const opciones: Intl.DateTimeFormatOptions = conHora
    ? { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: '2-digit', month: 'short', year: 'numeric' };
  return fecha.toLocaleString('es-PE', opciones).replace('.', '');
}

export function haceCuanto(valor: string): string {
  const minutos = Math.round((Date.now() - aFecha(valor).getTime()) / 60000);
  if (minutos < 1) return 'hace un momento';
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.round(horas / 24);
  return dias === 1 ? 'ayer' : `hace ${dias} días`;
}

// "Paracetamol 500mg (Caja x 100 tab)" → { nombre: "Paracetamol 500mg", presentacion: "Caja x 100 tab" }
export function separarPresentacion(nombre: string): { nombre: string; presentacion: string | null } {
  const partes = [...new Set([...nombre.matchAll(/\(([^)]+)\)/g)].map((m) => m[1].trim()))];
  const base = nombre.replace(/\s*\([^)]*\)/g, '').trim();
  return { nombre: base || nombre, presentacion: partes.length ? partes.join(' · ') : null };
}

// ---- Estados de pedido: etiqueta corta, clase del sello y orden en la tarjeta de control ----
export const ETAPAS: EstadoPedido[] = ['Pendiente', 'Aceptado', 'En preparación', 'Listo para entregar', 'Entregado'];

const CLASE_ESTADO: Record<EstadoPedido, string> = {
  Pendiente: 'pendiente',
  Aceptado: 'aceptado',
  'En preparación': 'preparacion',
  'Listo para entregar': 'listo',
  Entregado: 'entregado',
  Cancelado: 'cancelado',
  Rechazado: 'cancelado',
};

export const claseEstado = (estado: EstadoPedido) => CLASE_ESTADO[estado] ?? 'pendiente';

// Lo que significa cada estado para el cliente, en palabras simples.
export const MENSAJE_CLIENTE: Record<EstadoPedido, string> = {
  Pendiente: 'Recibimos tu reserva. En unos minutos la revisamos.',
  Aceptado: 'Tu reserva fue aceptada: ya estamos separando tus productos.',
  'En preparación': 'Estamos separando tus productos.',
  'Listo para entregar': '¡Listo! Ya puedes pasar a recoger tu pedido.',
  Entregado: 'Pedido entregado. ¡Gracias por tu compra!',
  Cancelado: 'Esta reserva fue cancelada.',
  Rechazado: 'No pudimos atender esta reserva.',
};

// Texto del botón para avanzar a cada estado (panel del personal).
export const ACCION_ESTADO: Partial<Record<EstadoPedido, string>> = {
  Aceptado: 'Aceptar',
  'En preparación': 'Empezar a preparar',
  'Listo para entregar': 'Marcar como listo',
  Entregado: 'Entregar',
  Rechazado: 'Rechazar',
  Cancelado: 'Cancelar',
};
