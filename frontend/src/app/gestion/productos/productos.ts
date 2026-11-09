import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { Categoria, Producto } from '../../core/modelos';
import { AuthService } from '../../core/auth.service';
import { AvisosService } from '../../core/avisos.service';
import { formatoSoles, separarPresentacion } from '../../core/formato';
import { mensajeError } from '../../core/interceptores';
import { Icono } from '../../ui/icono';
import { Sello } from '../../ui/sello';
import { GestionService } from '../gestion.service';

@Component({
  selector: 'app-productos',
  imports: [FormsModule, RouterLink, Icono, Sello],
  templateUrl: './productos.html',
  styleUrl: './productos.scss',
})
export class Productos {
  protected readonly auth = inject(AuthService);
  private readonly gestion = inject(GestionService);
  private readonly avisos = inject(AvisosService);

  protected readonly categorias = toSignal(this.gestion.categorias().pipe(catchError(() => of([] as Categoria[]))), { initialValue: [] });
  protected readonly lista = signal<Producto[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal('');
  protected readonly guardando = signal<number | null>(null);
  protected readonly stockEditado = signal<Record<number, number>>({});

  protected q = '';
  protected categoria = '';
  protected stock: string = inject(ActivatedRoute).snapshot.queryParamMap.get('stock') ?? '';
  protected orden = 'nombre_asc';
  protected estado = '';
  protected readonly soles = formatoSoles;
  protected readonly partes = separarPresentacion;
  private espera: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    this.cargar();
  }

  protected buscarLuego(): void {
    clearTimeout(this.espera);
    this.espera = setTimeout(() => this.cargar(), 300);
  }

  protected cargar(): void {
    this.gestion.productos({ q: this.q.trim(), categoria: this.categoria, stock: this.stock, orden: this.orden, estado: this.estado }).subscribe({
      next: (l) => {
        this.lista.set(l);
        this.cargando.set(false);
        this.error.set('');
        this.stockEditado.set({});
      },
      error: (e) => {
        this.cargando.set(false);
        this.error.set(mensajeError(e));
      },
    });
  }

  protected editarStock(p: Producto, valor: string): void {
    const n = Number(valor);
    this.stockEditado.update((m) => ({ ...m, [p.idProducto]: n }));
  }

  protected cambioPendiente(p: Producto): boolean {
    const n = this.stockEditado()[p.idProducto];
    return n !== undefined && n !== p.stock;
  }

  protected guardarStock(p: Producto): void {
    const nuevo = this.stockEditado()[p.idProducto];
    if (!Number.isInteger(nuevo) || nuevo < 0) {
      this.avisos.error('El stock debe ser un número entero, 0 o mayor.');
      return;
    }
    this.guardando.set(p.idProducto);
    this.gestion.fijarStock(p.idProducto, nuevo).subscribe({
      next: (actualizado) => {
        this.guardando.set(null);
        this.lista.update((l) => l.map((x) => (x.idProducto === p.idProducto ? { ...x, stock: actualizado.stock } : x)));
        this.stockEditado.update((m) => {
          const copia = { ...m };
          delete copia[p.idProducto];
          return copia;
        });
        this.avisos.ok(`Stock de ${p.codigoProducto} actualizado a ${actualizado.stock}.`);
      },
      error: (e) => {
        this.guardando.set(null);
        this.avisos.error(mensajeError(e));
      },
    });
  }
}
