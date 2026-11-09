import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';
import { Rol } from './modelos';

// Exige sesión con uno de los roles indicados; si no, lleva a "Ingresar" y luego regresa.
export function conRol(...roles: Rol[]): CanActivateFn {
  return (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const rol = auth.rol();
    if (!rol) return router.createUrlTree(['/ingresar'], { queryParams: { volver: state.url } });
    if (roles.includes(rol)) return true;
    return router.parseUrl(auth.inicioSegunRol());
  };
}

export const soloInvitados: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.usuario() ? inject(Router).parseUrl(auth.inicioSegunRol()) : true;
};
