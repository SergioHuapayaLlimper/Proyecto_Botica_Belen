import { Routes } from '@angular/router';
import { conRol, soloInvitados } from './core/guards';
import { PortalShell } from './portal/portal-shell';

export const routes: Routes = [
  {
    path: '',
    component: PortalShell,
    children: [
      { path: '', title: 'Botica Belén · Catálogo', loadComponent: () => import('./portal/catalogo/catalogo').then((m) => m.Catalogo) },
      { path: 'producto/:id', title: 'Botica Belén · Producto', loadComponent: () => import('./portal/producto/producto').then((m) => m.Producto) },
      { path: 'reserva', title: 'Botica Belén · Tu reserva', loadComponent: () => import('./portal/reserva/reserva').then((m) => m.Reserva) },
      {
        path: 'reserva/confirmada/:id',
        title: 'Botica Belén · Reserva registrada',
        canActivate: [conRol('Cliente')],
        data: { confirmada: true },
        loadComponent: () => import('./portal/mis-reservas/detalle-reserva').then((m) => m.DetalleReserva),
      },
      { path: 'ingresar', title: 'Botica Belén · Ingresar', canActivate: [soloInvitados], loadComponent: () => import('./portal/acceso/ingresar').then((m) => m.Ingresar) },
      { path: 'registro', title: 'Botica Belén · Crear cuenta', canActivate: [soloInvitados], loadComponent: () => import('./portal/acceso/registro').then((m) => m.Registro) },
      {
        path: 'mis-reservas',
        title: 'Botica Belén · Mis reservas',
        canActivate: [conRol('Cliente')],
        loadComponent: () => import('./portal/mis-reservas/mis-reservas').then((m) => m.MisReservas),
      },
      {
        path: 'mis-reservas/:id',
        title: 'Botica Belén · Detalle de reserva',
        canActivate: [conRol('Cliente')],
        loadComponent: () => import('./portal/mis-reservas/detalle-reserva').then((m) => m.DetalleReserva),
      },
      {
        path: 'mi-cuenta',
        title: 'Botica Belén · Mi cuenta',
        canActivate: [conRol('Cliente', 'Admin', 'Empleado')],
        loadComponent: () => import('./portal/mi-cuenta/mi-cuenta').then((m) => m.MiCuenta),
      },
    ],
  },
  {
    path: 'gestion',
    canActivate: [conRol('Admin', 'Empleado')],
    loadComponent: () => import('./gestion/gestion-shell').then((m) => m.GestionShell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'mostrador' },
      { path: 'mostrador', title: 'Gestión · Mostrador', loadComponent: () => import('./gestion/mostrador/mostrador').then((m) => m.Mostrador) },
      { path: 'pedidos', title: 'Gestión · Pedidos', loadComponent: () => import('./gestion/pedidos/pedidos').then((m) => m.Pedidos) },
      { path: 'pedidos/:id', title: 'Gestión · Pedido', loadComponent: () => import('./gestion/pedidos/pedido-gestion').then((m) => m.PedidoGestion) },
      { path: 'productos', title: 'Gestión · Productos y stock', loadComponent: () => import('./gestion/productos/productos').then((m) => m.Productos) },
      {
        path: 'productos/nuevo',
        title: 'Gestión · Nuevo producto',
        canActivate: [conRol('Admin')],
        loadComponent: () => import('./gestion/productos/producto-form').then((m) => m.ProductoForm),
      },
      {
        path: 'productos/:id',
        title: 'Gestión · Editar producto',
        canActivate: [conRol('Admin')],
        loadComponent: () => import('./gestion/productos/producto-form').then((m) => m.ProductoForm),
      },
      { path: 'resumen', title: 'Gestión · Resumen', canActivate: [conRol('Admin')], loadComponent: () => import('./gestion/resumen/resumen').then((m) => m.Resumen) },
      { path: 'reporte', title: 'Gestión · Reporte de ventas', canActivate: [conRol('Admin')], loadComponent: () => import('./gestion/reporte/reporte').then((m) => m.Reporte) },
      { path: 'personal', title: 'Gestión · Personal', canActivate: [conRol('Admin')], loadComponent: () => import('./gestion/personal/personal').then((m) => m.Personal) },
    ],
  },
  { path: '**', redirectTo: '' },
];
