import { Routes } from '@angular/router';
import { conRol, soloInvitados } from './core/guards';
import { PortalShell } from './portal/portal-shell';

export const routes: Routes = [
  {
    path: '',
    component: PortalShell,
    children: [
      { path: '', title: 'Catálogo – Botica Belén', loadComponent: () => import('./portal/catalogo/catalogo').then((m) => m.Catalogo) },
      { path: 'producto/:id', title: 'Producto – Botica Belén', loadComponent: () => import('./portal/producto/producto').then((m) => m.Producto) },
      { path: 'reserva', title: 'Tu reserva – Botica Belén', loadComponent: () => import('./portal/reserva/reserva').then((m) => m.Reserva) },
      {
        path: 'reserva/confirmada/:id',
        title: 'Reserva registrada – Botica Belén',
        canActivate: [conRol('Cliente')],
        data: { confirmada: true },
        loadComponent: () => import('./portal/mis-reservas/detalle-reserva').then((m) => m.DetalleReserva),
      },
      { path: 'ingresar', title: 'Ingresar – Botica Belén', canActivate: [soloInvitados], loadComponent: () => import('./portal/acceso/ingresar').then((m) => m.Ingresar) },
      { path: 'registro', title: 'Crear cuenta – Botica Belén', canActivate: [soloInvitados], loadComponent: () => import('./portal/acceso/registro').then((m) => m.Registro) },
      {
        path: 'mis-reservas',
        title: 'Mis reservas – Botica Belén',
        canActivate: [conRol('Cliente')],
        loadComponent: () => import('./portal/mis-reservas/mis-reservas').then((m) => m.MisReservas),
      },
      {
        path: 'mis-reservas/:id',
        title: 'Detalle de reserva – Botica Belén',
        canActivate: [conRol('Cliente')],
        loadComponent: () => import('./portal/mis-reservas/detalle-reserva').then((m) => m.DetalleReserva),
      },
      {
        path: 'mi-cuenta',
        title: 'Mi cuenta – Botica Belén',
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
      { path: 'mostrador', title: 'Mostrador – Gestión Botica Belén', loadComponent: () => import('./gestion/mostrador/mostrador').then((m) => m.Mostrador) },
      { path: 'pedidos', title: 'Pedidos – Gestión Botica Belén', loadComponent: () => import('./gestion/pedidos/pedidos').then((m) => m.Pedidos) },
      { path: 'pedidos/:id', title: 'Pedido – Gestión Botica Belén', loadComponent: () => import('./gestion/pedidos/pedido-gestion').then((m) => m.PedidoGestion) },
      { path: 'productos', title: 'Productos y stock – Gestión Botica Belén', loadComponent: () => import('./gestion/productos/productos').then((m) => m.Productos) },
      {
        path: 'productos/nuevo',
        title: 'Nuevo producto – Gestión Botica Belén',
        canActivate: [conRol('Admin')],
        loadComponent: () => import('./gestion/productos/producto-form').then((m) => m.ProductoForm),
      },
      {
        path: 'productos/:id',
        title: 'Editar producto – Gestión Botica Belén',
        canActivate: [conRol('Admin')],
        loadComponent: () => import('./gestion/productos/producto-form').then((m) => m.ProductoForm),
      },
      { path: 'resumen', title: 'Resumen – Gestión Botica Belén', canActivate: [conRol('Admin')], loadComponent: () => import('./gestion/resumen/resumen').then((m) => m.Resumen) },
      { path: 'reporte', title: 'Reporte de ventas – Gestión Botica Belén', canActivate: [conRol('Admin')], loadComponent: () => import('./gestion/reporte/reporte').then((m) => m.Reporte) },
      { path: 'personal', title: 'Personal – Gestión Botica Belén', canActivate: [conRol('Admin')], loadComponent: () => import('./gestion/personal/personal').then((m) => m.Personal) },
    ],
  },
  { path: '**', redirectTo: '' },
];
