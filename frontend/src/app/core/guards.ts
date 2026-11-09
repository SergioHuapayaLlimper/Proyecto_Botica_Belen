import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';
import { Permiso } from './modelos';

const alIngreso = (url: string) => inject(Router).createUrlTree(['/ingresar'], { queryParams: { volver: url } });

// Cualquier usuario con sesión.
export const conSesion: CanActivateFn = (_r: ActivatedRouteSnapshot, state: RouterStateSnapshot) =>
  inject(AuthService).usuario() ? true : alIngreso(state.url);

// Solo clientes (reservas, mis reservas).
export const soloClientes: CanActivateFn = (_r: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const auth = inject(AuthService);
  if (!auth.usuario()) return alIngreso(state.url);
  return auth.esCliente() ? true : inject(Router).parseUrl(auth.inicioSegunRol());
};

// Personal con al menos uno de los permisos indicados (sin permisos = cualquier cuenta del personal).
export function conPermiso(...permisos: Permiso[]): CanActivateFn {
  return (_r: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const auth = inject(AuthService);
    if (!auth.usuario()) return alIngreso(state.url);
    if (auth.esPersonal() && (!permisos.length || auth.puede(...permisos))) return true;
    return inject(Router).parseUrl(auth.inicioSegunRol());
  };
}

export const soloInvitados: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.usuario() ? inject(Router).parseUrl(auth.inicioSegunRol()) : true;
};
