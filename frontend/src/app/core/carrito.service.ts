import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API, ItemCarrito, Producto } from './modelos';
import { AuthService } from './auth.service';

const CLAVE = 'botica-belen-reserva';
const TASA_IGV = 0.18;

function leerLocal(): ItemCarrito[] {
  try {
    return JSON.parse(localStorage.getItem(CLAVE) ?? '[]') as ItemCarrito[];
  } catch {
    return [];
  }
}

// "Tu reserva": vive en signals; se guarda en el navegador y, si el cliente
// inició sesión, también en su cuenta (usuario.carrito_json), igual que la versión PHP.
@Injectable({ providedIn: 'root' })
export class CarritoService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  readonly items = signal<ItemCarrito[]>(leerLocal());
  // Último producto separado: dispara el sello en su ficha.
  readonly ultimoSeparado = signal<{ idProducto: number; vez: number } | null>(null);
  // Texto para lectores de pantalla (región aria-live del portal).
  readonly anuncio = signal('');

  readonly unidades = computed(() => this.items().reduce((n, i) => n + i.cantidad, 0));
  readonly total = computed(() => Math.round(this.items().reduce((s, i) => s + i.precioProducto * i.cantidad, 0) * 100) / 100);
  readonly subtotal = computed(() => Math.round((this.total() / (1 + TASA_IGV)) * 100) / 100);
  readonly igv = computed(() => Math.round((this.total() - this.subtotal()) * 100) / 100);
  readonly conProblemas = computed(() => this.items().filter((i) => i.cantidad > i.stock));

  private sincronizado = false;
  private temporizador: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    effect(() => {
      const items = this.items();
      try {
        localStorage.setItem(CLAVE, JSON.stringify(items));
      } catch {
        /* sin almacenamiento */
      }
      if (untracked(() => this.auth.esCliente()) && this.sincronizado) this.programarGuardado();
    });

    // Al iniciar sesión como cliente: se une la reserva del navegador con la guardada en la cuenta.
    effect(() => {
      if (this.auth.esCliente()) {
        untracked(() => this.traerDeLaCuenta());
      } else {
        this.sincronizado = false;
      }
    });
  }

  cantidadDe(idProducto: number): number {
    return this.items().find((i) => i.idProducto === idProducto)?.cantidad ?? 0;
  }

  separar(producto: Producto, cantidad = 1): void {
    this.items.update((items) => {
      const existente = items.find((i) => i.idProducto === producto.idProducto);
      if (existente) {
        return items.map((i) =>
          i.idProducto === producto.idProducto ? { ...i, stock: producto.stock, cantidad: Math.min(producto.stock, i.cantidad + cantidad) } : i,
        );
      }
      return [
        ...items,
        {
          idProducto: producto.idProducto,
          nombreProducto: producto.nombreProducto,
          precioProducto: producto.precioProducto,
          imagenURL: producto.imagenURL,
          stock: producto.stock,
          idCategoria: producto.idCategoria,
          cantidad: Math.min(producto.stock, cantidad),
        },
      ];
    });
    const marca = { idProducto: producto.idProducto, vez: Date.now() };
    this.ultimoSeparado.set(marca);
    this.anuncio.set(`${producto.nombreProducto} se agregó a tu reserva. Total: ${this.unidades()} unidades.`);
    setTimeout(() => {
      if (this.ultimoSeparado() === marca) this.ultimoSeparado.set(null);
    }, 1600);
  }

  cambiarCantidad(idProducto: number, cantidad: number): void {
    if (cantidad <= 0) return this.quitar(idProducto);
    this.items.update((items) => items.map((i) => (i.idProducto === idProducto ? { ...i, cantidad: Math.min(Math.max(i.stock, 1), cantidad, 99) } : i)));
  }

  quitar(idProducto: number): void {
    this.items.update((items) => items.filter((i) => i.idProducto !== idProducto));
  }

  vaciar(): void {
    this.items.set([]);
  }

  // Reemplaza los datos guardados con los actuales del servidor (precio y stock vigentes).
  reemplazar(items: ItemCarrito[]): void {
    this.items.set(items);
  }

  private traerDeLaCuenta(): void {
    this.http.get<ItemCarrito[]>(`${API}/carrito`).subscribe({
      next: (enCuenta) => {
        const locales = this.items();
        const unidos = [...enCuenta];
        for (const local of locales) {
          const igual = unidos.find((i) => i.idProducto === local.idProducto);
          if (igual) igual.cantidad = Math.max(igual.cantidad, local.cantidad);
          else unidos.push(local);
        }
        this.sincronizado = true;
        this.items.set(unidos);
      },
      error: () => (this.sincronizado = true),
    });
  }

  private programarGuardado(): void {
    clearTimeout(this.temporizador);
    this.temporizador = setTimeout(() => {
      const items = this.items().map(({ idProducto, cantidad }) => ({ idProducto, cantidad }));
      this.http.put<ItemCarrito[]>(`${API}/carrito`, { items }).subscribe({ error: () => undefined });
    }, 600);
  }
}
