import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { API, Permiso, Sesion, Usuario } from './modelos';

const CLAVE = 'botica-belen-sesion';

function leerSesion(): Sesion | null {
  try {
    return JSON.parse(localStorage.getItem(CLAVE) ?? 'null') as Sesion | null;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  readonly sesion = signal<Sesion | null>(leerSesion());
  readonly usuario = computed(() => this.sesion()?.usuario ?? null);
  readonly token = computed(() => this.sesion()?.token ?? null);
  readonly rol = computed(() => this.usuario()?.rol ?? null);
  readonly esCliente = computed(() => this.usuario()?.tipo === 'Cliente');
  readonly esPersonal = computed(() => this.usuario()?.tipo === 'Personal');
  readonly permisos = computed(() => new Set<Permiso>(this.usuario()?.permisos ?? []));

  constructor() {
    // Al abrir la app se refrescan los datos de la sesión guardada (rol y permisos pueden haber cambiado).
    // Se difiere: el interceptor HTTP usa este mismo servicio y aún se está construyendo.
    if (this.token()) setTimeout(() => this.refrescar());
  }

  private refrescar(): void {
    this.http.get<Usuario>(`${API}/auth/me`).subscribe({
      next: (usuario) => {
        const sesion = this.sesion();
        if (sesion) this.guardar({ ...sesion, usuario });
      },
      error: () => undefined, // un 401 ya cierra la sesión en el interceptor
    });
  }

  /** ¿El rol del usuario tiene alguno de estos permisos? */
  puede(...permisos: Permiso[]): boolean {
    const mios = this.permisos();
    return permisos.some((p) => mios.has(p));
  }

  // Primer nombre para saludar ("Juan Pérez" → "Juan").
  readonly nombreCorto = computed(() => this.usuario()?.nombre.split(' ')[0] ?? '');

  ingresar(email: string, password: string): Observable<Sesion> {
    return this.http.post<Sesion>(`${API}/auth/login`, { email, password }).pipe(tap((s) => this.guardar(s)));
  }

  registrar(datos: { nombre: string; email: string; telefono: string; password: string }): Observable<Sesion> {
    return this.http.post<Sesion>(`${API}/auth/registro`, datos).pipe(tap((s) => this.guardar(s)));
  }

  actualizarPerfil(datos: { nombre: string; email: string; telefono: string }): Observable<Usuario> {
    return this.http.put<Usuario>(`${API}/auth/perfil`, datos).pipe(
      tap((usuario) => {
        const sesion = this.sesion();
        if (sesion) this.guardar({ ...sesion, usuario });
      }),
    );
  }

  cambiarPassword(actual: string, nueva: string): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${API}/auth/password`, { actual, nueva });
  }

  salir(destino = '/'): void {
    this.sesion.set(null);
    try {
      localStorage.removeItem(CLAVE);
    } catch {
      /* sin almacenamiento */
    }
    this.router.navigateByUrl(destino);
  }

  // A dónde ir después de iniciar sesión: el cliente al catálogo; el personal a la primera sección que puede usar.
  inicioSegunRol(): string {
    if (!this.esPersonal()) return '/productos';
    const secciones: [Permiso[], string][] = [
      [['resumen'], '/gestion/resumen'],
      [['mostrador'], '/gestion/mostrador'],
      [['pedidos'], '/gestion/pedidos'],
      [['productos', 'productos_editar'], '/gestion/productos'],
      [['categorias'], '/gestion/categorias'],
      [['reporte'], '/gestion/reporte'],
      [['personal'], '/gestion/personal'],
      [['configuracion'], '/gestion/negocio'],
    ];
    return secciones.find(([permisos]) => this.puede(...permisos))?.[1] ?? '/productos';
  }

  private guardar(sesion: Sesion): void {
    this.sesion.set(sesion);
    try {
      localStorage.setItem(CLAVE, JSON.stringify(sesion));
    } catch {
      /* sin almacenamiento */
    }
  }
}
