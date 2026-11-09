import { EstadoPedido } from './modelos';

// Los estados exactos del ENUM de la tabla `pedido`, en el orden del recorrido.
export const ESTADOS_LISTA: EstadoPedido[] = [
  'Pendiente',
  'Aceptado',
  'En preparación',
  'Listo para entregar',
  'Entregado',
  'Cancelado',
  'Rechazado',
];
