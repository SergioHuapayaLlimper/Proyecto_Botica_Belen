// URL de la API (Node.js + Express). Cambia aquí si la levantas en otro puerto.
export const API = 'http://localhost:3200/api';

// Permisos del panel de gestión (los mismos que backend-spring/.../seguridad/Permisos.java).
export type Permiso =
  | 'resumen'
  | 'mostrador'
  | 'pedidos'
  | 'pedidos_estado'
  | 'productos'
  | 'productos_editar'
  | 'categorias'
  | 'reporte'
  | 'personal'
  | 'configuracion';

export interface Usuario {
  idUsuario: number;
  nombre: string;
  email: string;
  telefono: string | null;
  rol: string; // nombre del rol ("Administrador", "Empleado"...) o "Cliente"
  tipo: 'Cliente' | 'Personal';
  permisos: Permiso[];
}

export interface PermisoInfo {
  clave: Permiso;
  nombre: string;
  descripcion: string;
}

export interface RolPersonal {
  idRol: number;
  nombre: string;
  descripcion: string | null;
  permisos: Permiso[];
  esSistema: boolean;
  totalUsuarios: number;
  creadoEn: string | null;
}

export interface Sesion {
  token: string;
  usuario: Usuario;
}

export interface Categoria {
  idCategoria: number;
  nombreCategoria: string;
  productos?: number;
  estadoCategoria?: string;
  prefijo?: string; // prefijo de los códigos de sus productos (CUI → CUI-0001)
  totalProductos?: number;
}

export interface Producto {
  idProducto: number;
  idCategoria: number;
  nombreCategoria: string;
  codigoProducto: string;
  nombreProducto: string;
  principioActivo?: string | null; // RF05
  descripcionProducto: string | null;
  precioProducto: number;
  stock: number;
  imagenURL: string | null;
  estadoProducto?: 'Activo' | 'Inactivo';
  requiere_receta?: number;
  ubicacionAnaquel?: string | null;
}

export interface PaginaProductos {
  items: Producto[];
  total: number;
  pagina: number;
  totalPaginas: number;
}

export interface ItemCarrito {
  idProducto: number;
  nombreProducto: string;
  precioProducto: number;
  imagenURL: string | null;
  stock: number;
  cantidad: number;
  idCategoria?: number;
}

export type EstadoPedido =
  | 'Pendiente'
  | 'Aceptado'
  | 'Rechazado'
  | 'En preparación'
  | 'Listo para entregar'
  | 'Entregado'
  | 'Cancelado';

export type MetodoPago = 'Efectivo' | 'Yape';

export interface PedidoResumen {
  idPedido: number;
  codigoPedido: string;
  fechaHoraToma: string;
  estadoPedido: EstadoPedido;
  metodoPago: MetodoPago | null;
  total: number;
  unidades: number;
  nombreCliente?: string;
  telefonoCliente?: string | null;
}

export interface DetallePedido {
  idDetallePedido: number;
  idProducto: number;
  nombreProducto: string;
  codigoProducto: string;
  imagenURL: string | null;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Pedido extends PedidoResumen {
  idUsuario: number;
  observaciones: string | null;
  subtotalGeneral: number;
  igv: number;
  nombreCliente: string;
  emailCliente: string;
  telefonoCliente: string | null;
  siguientes: EstadoPedido[];
  detalles: DetallePedido[];
}

export interface LineaPreparar {
  idPedido: number;
  codigoPedido: string;
  estadoPedido: EstadoPedido;
  fechaHoraToma: string;
  nombreCliente: string;
  idProducto: number;
  codigoProducto: string;
  nombreProducto: string;
  ubicacionAnaquel: string | null;
  cantidad: number;
}

export interface Empleado {
  idUsuario: number;
  nombre: string;
  email: string;
  telefono: string | null;
  idRol: number | null;
  rol: string;
  rolSistema: boolean;
  creadoEn: string | null;
  estado: number;
  intentos_fallidos: number;
  bloqueado_hasta?: string | null; // RF02: bloqueo temporal vigente ('AAAA-MM-DD HH:MM:SS')
}

export interface Dashboard {
  desde: string;
  hasta: string;
  kpis: {
    pedidos: number;
    ventas: number;
    pedidosValidos: number;
    pendientes: number;
    clientes: number;
    agotados: number;
    stockBajo: number;
    ticketPromedio: number;
  };
  ventasPorDia: { dia: string; pedidos: number; monto: number }[];
  porEstado: { estado: EstadoPedido; total: number }[];
  metodosPago: { metodo: string; total: number }[];
  ventasMensuales: { mes: string; monto: number; pedidos: number }[];
  topProductos: { idProducto: number; nombreProducto: string; unidades: number; monto: number }[];
  stockBajo: { idProducto: number; codigoProducto: string; nombreProducto: string; stock: number }[];
}

export interface Reporte {
  desde: string;
  hasta: string;
  pedidos: (PedidoResumen & { subtotalGeneral: number; igv: number })[];
  totales: { cantidad: number; monto: number; igv: number; entregados: number; cancelados: number };
}

// Datos de la tienda. EJEMPLO: reemplazar por los datos reales de la botica.
export const TIENDA = {
  direccion: 'Jr. Dos de Mayo 245, San Vicente de Cañete',
  horario: 'Lunes a sábado de 8:00 a. m. a 10:00 p. m. Domingos de 8:00 a. m. a 1:00 p. m.',
  telefono: '(01) 581-2245',
  whatsapp: '987 654 321',
  yape: '987 654 321',
  ejemplo: true,
};
