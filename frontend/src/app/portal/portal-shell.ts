import { Component, effect, inject, signal, untracked } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { CarritoService } from '../core/carrito.service';
import { SeguimientoService } from '../core/seguimiento.service';
import { TIENDA } from '../core/modelos';
import { Icono } from '../ui/icono';

@Component({
  selector: 'app-portal-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icono],
  templateUrl: './portal-shell.html',
  styleUrl: './portal-shell.scss',
})
export class PortalShell {
  protected readonly auth = inject(AuthService);
  protected readonly carrito = inject(CarritoService);
  // RF15: avisa al cliente cuando su reserva cambia de estado (en cualquier página del portal).
  private readonly seguimiento = inject(SeguimientoService);
  private readonly router = inject(Router);

  protected readonly tienda = TIENDA;
  protected readonly anio = new Date().getFullYear();
  protected readonly termino = signal('');
  private espera: ReturnType<typeof setTimeout> | undefined;

  // En la portada (catálogo) la banda muestra el lema; en el resto de páginas queda compacta.
  protected readonly enPortada = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.esPortada()),
    ),
    { initialValue: this.esPortada() },
  );

  // El contador de "Tu reserva" late cada vez que cambia.
  protected readonly late = signal(false);

  constructor() {
    let anterior = this.carrito.unidades();
    effect(() => {
      const actual = this.carrito.unidades();
      if (actual > anterior) {
        untracked(() => {
          this.late.set(false);
          requestAnimationFrame(() => this.late.set(true));
        });
      }
      anterior = actual;
    });

    // El buscador refleja la búsqueda actual (?q=) al navegar o recargar.
    inject(ActivatedRoute)
      .queryParamMap.pipe(takeUntilDestroyed())
      .subscribe((p) => this.termino.set(p.get('q') ?? ''));
  }

  private esPortada(): boolean {
    return this.router.url === '/' || this.router.url.startsWith('/?');
  }

  protected escribir(valor: string): void {
    this.termino.set(valor);
    clearTimeout(this.espera);
    // Búsqueda mientras escribe (solo si ya está en el catálogo, para no sacarlo de otra página).
    if (this.esPortada()) {
      this.espera = setTimeout(() => this.buscar(true), 320);
    }
  }

  protected buscar(reemplazar = false): void {
    clearTimeout(this.espera);
    const q = this.termino().trim();
    this.router.navigate(['/'], { queryParams: { q: q || null, pagina: null }, queryParamsHandling: 'merge', replaceUrl: reemplazar });
  }

  protected limpiar(campo: HTMLInputElement): void {
    this.termino.set('');
    this.buscar(true);
    campo.focus();
  }
}
