import { Component, ElementRef, afterRenderEffect, computed, inject, viewChild } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { API, Categoria, PaginaProductos } from '../../core/modelos';
import { mensajeError } from '../../core/interceptores';
import { Icono } from '../../ui/icono';
import { Ficha } from './ficha';

interface Estado {
  cargando: boolean;
  datos: PaginaProductos | null;
  error: string;
}

@Component({
  selector: 'app-catalogo',
  imports: [RouterLink, Icono, Ficha],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.scss',
})
export class Catalogo {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);

  protected readonly categorias = toSignal(this.http.get<Categoria[]>(`${API}/categorias`).pipe(catchError(() => of([] as Categoria[]))), { initialValue: [] });

  // Los filtros viven en la URL (?q=&categoria=&orden=&pagina=&disponibles=): se pueden compartir y el "atrás" funciona.
  private readonly params = toSignal(this.ruta.queryParamMap, { requireSync: true });
  protected readonly q = computed(() => this.params().get('q') ?? '');
  protected readonly categoria = computed(() => Number(this.params().get('categoria')) || 0);
  protected readonly orden = computed(() => this.params().get('orden') ?? 'nombre_asc');
  protected readonly disponibles = computed(() => this.params().get('disponibles') === '1');
  protected readonly pagina = computed(() => Math.max(1, Number(this.params().get('pagina')) || 1));

  protected readonly estado = toSignal(
    this.ruta.queryParamMap.pipe(
      switchMap((p) => {
        let params = new HttpParams().set('limite', 24);
        for (const clave of ['q', 'categoria', 'orden', 'pagina', 'disponibles']) {
          const valor = p.get(clave);
          if (valor) params = params.set(clave, valor);
        }
        return this.http.get<PaginaProductos>(`${API}/productos`, { params }).pipe(
          map((datos): Estado => ({ cargando: false, datos, error: '' })),
          catchError((e) => of<Estado>({ cargando: false, datos: null, error: mensajeError(e) })),
          startWith<Estado>({ cargando: true, datos: null, error: '' }),
        );
      }),
    ),
    { initialValue: { cargando: true, datos: null, error: '' } as Estado },
  );

  protected readonly nombreCategoria = computed(() => this.categorias().find((c) => c.idCategoria === this.categoria())?.nombreCategoria ?? '');
  protected readonly totalCatalogo = computed(() => this.categorias().reduce((s, c) => s + (c.productos ?? 0), 0));
  protected readonly esqueleto = Array.from({ length: 8 }, (_, i) => i);

  protected readonly paginas = computed(() => {
    const total = this.estado().datos?.totalPaginas ?? 1;
    const actual = this.pagina();
    const lista = new Set([1, total, actual - 1, actual, actual + 1].filter((n) => n >= 1 && n <= total));
    return [...lista].sort((a, b) => a - b);
  });

  protected filtrar(cambios: Record<string, string | number | null>): void {
    this.router.navigate([], { queryParams: { ...cambios, pagina: cambios['pagina'] ?? null }, queryParamsHandling: 'merge' });
  }

  private readonly carril = viewChild<ElementRef<HTMLElement>>('carril');

  constructor() {
    // En celular, la categoría elegida se desliza a la vista dentro del carril.
    afterRenderEffect(() => {
      this.categoria();
      this.categorias();
      const activo = this.carril()?.nativeElement.querySelector<HTMLElement>('.chip.activo');
      activo?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    });
  }

  /** Al cambiar de categoría, lleva al inicio del listado si quedó fuera de la vista. */
  protected alElegir(): void {
    const destino = document.getElementById('resultados');
    if (destino && destino.getBoundingClientRect().top < 0) {
      destino.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    }
  }

  protected irAPagina(n: number): void {
    this.filtrar({ pagina: n === 1 ? null : n });
    document.getElementById('resultados')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
