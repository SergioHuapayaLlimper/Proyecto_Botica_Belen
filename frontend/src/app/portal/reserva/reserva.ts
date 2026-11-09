import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { catchError, forkJoin, map, of } from 'rxjs';
import { API, ItemCarrito, MetodoPago, Producto, TIENDA } from '../../core/modelos';
import { AuthService } from '../../core/auth.service';
import { CarritoService } from '../../core/carrito.service';
import { mensajeError } from '../../core/interceptores';
import { formatoSoles, separarPresentacion } from '../../core/formato';
import { Icono } from '../../ui/icono';
import { Pictograma } from '../../ui/pictograma';

@Component({
  selector: 'app-reserva',
  imports: [RouterLink, FormsModule, Icono, Pictograma],
  templateUrl: './reserva.html',
  styleUrl: './reserva.scss',
})
export class Reserva implements OnInit {
  protected readonly auth = inject(AuthService);
  protected readonly carrito = inject(CarritoService);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  protected readonly tienda = TIENDA;
  protected readonly soles = formatoSoles;
  protected readonly partes = separarPresentacion;

  protected readonly metodo = signal<MetodoPago | null>(null);
  protected observaciones = '';
  protected readonly enviando = signal(false);
  protected readonly error = signal('');
  protected readonly intento = signal(false);
  protected readonly retirados = signal<string[]>([]);

  protected readonly metodos: { valor: MetodoPago; icono: string; detalle: string }[] = [
    { valor: 'Efectivo', icono: 'efectivo', detalle: 'Pagas en caja al recoger' },
    { valor: 'Yape', icono: 'celular', detalle: `Al ${TIENDA.yape}` },
    { valor: 'Plin', icono: 'celular', detalle: `Al ${TIENDA.yape}` },
    { valor: 'Tarjeta', icono: 'tarjeta', detalle: 'Débito o crédito en tienda' },
  ];

  ngOnInit(): void {
    this.actualizarPreciosYStock();
  }

  // Antes de confirmar, se traen el precio y el stock vigentes de cada producto.
  private actualizarPreciosYStock(): void {
    const items = this.carrito.items();
    if (!items.length) return;
    forkJoin(
      items.map((i) =>
        this.http.get<Producto>(`${API}/productos/${i.idProducto}`).pipe(
          map((p): ItemCarrito | null => ({ ...i, nombreProducto: p.nombreProducto, precioProducto: p.precioProducto, stock: p.stock, idCategoria: p.idCategoria })),
          catchError(() => of(null)),
        ),
      ),
    ).subscribe((actualizados) => {
      const retirados = items.filter((_, i) => actualizados[i] === null).map((i) => i.nombreProducto);
      this.retirados.set(retirados);
      this.carrito.reemplazar(actualizados.filter((i): i is ItemCarrito => i !== null));
    });
  }

  protected confirmar(): void {
    this.intento.set(true);
    this.error.set('');
    if (!this.metodo() || this.carrito.conProblemas().length) return;

    this.enviando.set(true);
    const cuerpo = {
      items: this.carrito.items().map(({ idProducto, cantidad }) => ({ idProducto, cantidad })),
      metodoPago: this.metodo(),
      observaciones: this.observaciones.trim(),
    };
    this.http.post<{ idPedido: number }>(`${API}/pedidos`, cuerpo).subscribe({
      next: ({ idPedido }) => {
        this.carrito.vaciar();
        this.router.navigate(['/reserva/confirmada', idPedido]);
      },
      error: (e: HttpErrorResponse) => {
        this.enviando.set(false);
        this.error.set(mensajeError(e));
        if (e.status === 409) this.actualizarPreciosYStock();
      },
    });
  }
}
