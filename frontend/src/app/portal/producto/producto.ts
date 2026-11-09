import { Component, computed, inject, input, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { API, Producto as ProductoModelo } from '../../core/modelos';
import { CarritoService } from '../../core/carrito.service';
import { formatoSoles, separarPresentacion } from '../../core/formato';
import { mensajeError } from '../../core/interceptores';
import { Icono } from '../../ui/icono';
import { Pictograma } from '../../ui/pictograma';
import { Sello } from '../../ui/sello';

@Component({
  selector: 'app-producto',
  imports: [RouterLink, Icono, Pictograma, Sello],
  templateUrl: './producto.html',
  styleUrl: './producto.scss',
})
export class Producto {
  private readonly http = inject(HttpClient);
  protected readonly carrito = inject(CarritoService);
  readonly id = input.required<string>();

  protected readonly estado = toSignal(
    toObservable(this.id).pipe(
      switchMap((id) =>
        this.http.get<ProductoModelo>(`${API}/productos/${id}`).pipe(
          map((p) => ({ cargando: false, p, error: '' })),
          catchError((e) => of({ cargando: false, p: null, error: e.status === 404 ? 'Este producto no está disponible para reservar en línea.' : mensajeError(e) })),
          startWith({ cargando: true, p: null as ProductoModelo | null, error: '' }),
        ),
      ),
    ),
    { initialValue: { cargando: true, p: null as ProductoModelo | null, error: '' } },
  );

  protected readonly cantidad = signal(1);
  protected readonly partes = computed(() => separarPresentacion(this.estado().p?.nombreProducto ?? ''));
  protected readonly enReserva = computed(() => this.carrito.cantidadDe(this.estado().p?.idProducto ?? 0));
  protected readonly sellado = computed(() => this.carrito.ultimoSeparado()?.idProducto === this.estado().p?.idProducto);
  protected readonly soles = formatoSoles;

  protected separar(p: ProductoModelo): void {
    const disponible = p.stock - this.enReserva();
    this.carrito.separar(p, Math.min(this.cantidad(), Math.max(disponible, 0)));
    this.cantidad.set(1);
  }
}
