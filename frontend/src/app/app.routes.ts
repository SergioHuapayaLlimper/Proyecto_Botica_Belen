import { Routes } from '@angular/router';
import { conPermiso, conSesion, soloClientes, soloInvitados } from './core/guards';
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
        canActivate: [soloClientes],
        data: { confirmada: true },
        loadComponent: () => import('./portal/mis-reservas/detalle-reserva').then((m) => m.DetalleReserva),
      },
      { path: 'ingresar', title: 'Ingresar – Botica Belén', canActivate: [soloInvitados], loadComponent: () => import('./portal/acceso/ingresar').then((m) => m.Ingresar) },
      { path: 'registro', title: 'Crear cuenta – Botica Belén', canActivate: [soloInvitados], loadComponent: () => import('./portal/acceso/registro').then((m) => m.Registro) },
      {
        path: 'mis-reservas',
        title: 'Mis reservas – Botica Belén',
        canActivate: [soloClientes],
        loadComponent: () => import('./portal/mis-reservas/mis-reservas').then((m) => m.MisReservas),
      },
      {
        path: 'mis-reservas/:id',
        title: 'Detalle de reserva – Botica Belén',
        canActivate: [soloClientes],
        loadComponent: () => import('./portal/mis-reservas/detalle-reserva').then((m) => m.DetalleReserva),
      },
      {
        path: 'mi-cuenta',
        title: 'Mi cuenta – Botica Belén',
        canActivate: [conSesion],
        loadComponent: () => import('./portal/mi-cuenta/mi-cuenta').then((m) => m.MiCuenta),
      },
    ],
  },
  {
    path: 'gestion',
    canActivate: [conPermiso()],
    loadComponent: () => import('./gestion/gestion-shell').then((m) => m.GestionShell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'mostrador' },
      { path: 'mostrador', title: 'Mostrador – Gestión Botica Belén', canActivate: [conPermiso('mostrador')], loadComponent: () => import('./gestion/mostrador/mostrador').then((m) => m.Mostrador) },
      { path: 'pedidos', title: 'Pedidos – Gestión Botica Belén', canActivate: [conPermiso('pedidos')], loadComponent: () => import('./gestion/pedidos/pedidos').then((m) => m.Pedidos) },
      { path: 'pedidos/:id', title: 'Pedido – Gestión Botica Belén', canActivate: [conPermiso('pedidos', 'mostrador')], loadComponent: () => import('./gestion/pedidos/pedido-gestion').then((m) => m.PedidoGestion) },
      { path: 'productos', title: 'Productos y stock – Gestión Botica Belén', canActivate: [conPermiso('productos', 'productos_editar')], loadComponent: () => import('./gestion/productos/productos').then((m) => m.Productos) },
      {
        path: 'productos/nuevo',
        title: 'Nuevo producto – Gestión Botica Belén',
        canActivate: [conPermiso('productos_editar')],
        loadComponent: () => import('./gestion/productos/producto-form').then((m) => m.ProductoForm),
      },
      {
        path: 'productos/:id',
        title: 'Editar producto – Gestión Botica Belén',
        canActivate: [conPermiso('productos_editar')],
        loadComponent: () => import('./gestion/productos/producto-form').then((m) => m.ProductoForm),
      },
      { path: 'categorias', title: 'Categorías – Gestión Botica Belén', canActivate: [conPermiso('categorias')], loadComponent: () => import('./gestion/categorias/categorias').then((m) => m.Categorias) },
      { path: 'resumen', title: 'Resumen – Gestión Botica Belén', canActivate: [conPermiso('resumen')], loadComponent: () => import('./gestion/resumen/resumen').then((m) => m.Resumen) },
      { path: 'reporte', title: 'Reporte de ventas – Gestión Botica Belén', canActivate: [conPermiso('reporte')], loadComponent: () => import('./gestion/reporte/reporte').then((m) => m.Reporte) },
      { path: 'personal', title: 'Personal – Gestión Botica Belén', canActivate: [conPermiso('personal')], loadComponent: () => import('./gestion/personal/personal').then((m) => m.Personal) },
      { path: 'roles', title: 'Roles – Gestión Botica Belén', canActivate: [conPermiso('personal')], loadComponent: () => import('./gestion/roles/roles').then((m) => m.Roles) },
    ],
  },
  { path: '**', redirectTo: '' },
];
