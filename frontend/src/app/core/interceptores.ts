import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { API } from './modelos';

// Agrega el token JWT a las peticiones hacia la API y cierra la sesión si expiró.
export const interceptorAuth: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token();
  const peticion = token && req.url.startsWith(API) ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(peticion).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && token && !req.url.endsWith('/auth/login')) auth.salir('/ingresar');
      return throwError(() => error);
    }),
  );
};

// Mensaje legible para el usuario a partir de un error HTTP.
export function mensajeError(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return 'No hay conexión con el servidor. Revisa que la API esté encendida (npm run dev en la carpeta backend).';
    return (error.error as { message?: string } | null)?.message ?? 'Ocurrió un error inesperado. Inténtalo de nuevo.';
  }
  return 'Ocurrió un error inesperado. Inténtalo de nuevo.';
}
