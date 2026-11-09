import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { ESTADOS_LISTA } from '../../core/estados';
import { Producto, Reporte as ReporteModelo } from '../../core/modelos';
import { formatoFecha, formatoSoles, separarPresentacion } from '../../core/formato';
import { mensajeError } from '../../core/interceptores';
import { Icono } from '../../ui/icono';
import { Sello } from '../../ui/sello';
import { GestionService } from '../gestion.service';

@Component({
  selector: 'app-reporte',
  imports: [FormsModule, RouterLink, Icono, Sello],
  template: `
    <div class="pagina">
      <header class="pagina-cabecera no-imprimir">
        <div>
          <h1>Reporte de ventas</h1>
          <p>Filtra por fechas, estado o producto. Puedes exportarlo a Excel (CSV) o imprimirlo.</p>
        </div>
        @if (datos()) {
          <div class="botones">
            <button type="button" class="btn btn--borde" (click)="exportar()"><app-icono nombre="descargar" [tam]="18" /> Exportar CSV</button>
            <button type="button" class="btn btn--borde" (click)="imprimir()"><app-icono nombre="imprimir" [tam]="18" /> Imprimir</button>
          </div>
        }
      </header>

      <form class="filtros no-imprimir" (submit)="$event.preventDefault(); cargar()">
        <label class="casilla"><span class="rotulo">Desde</span><input type="date" name="desde" [(ngModel)]="desde" /></label>
        <label class="casilla"><span class="rotulo">Hasta</span><input type="date" name="hasta" [(ngModel)]="hasta" /></label>
        <label class="casilla">
          <span class="rotulo">Estado</span>
          <select name="estado" [(ngModel)]="estado">
            <option value="">Todos</option>
            @for (e of estados; track e) {
              <option [value]="e">{{ e }}</option>
            }
          </select>
        </label>
        <label class="casilla">
          <span class="rotulo">Producto</span>
          <select name="producto" [(ngModel)]="producto">
            <option value="">Todos</option>
            @for (p of productos(); track p.idProducto) {
              <option [value]="p.idProducto">{{ partes(p.nombreProducto).nombre }} ({{ p.codigoProducto }})</option>
            }
          </select>
        </label>
        <button class="btn btn--tinta">Generar reporte</button>
      </form>

      @if (error()) {
        <div class="aviso aviso--error" role="alert"><app-icono nombre="alerta" [tam]="20" /><p>{{ error() }}</p></div>
      }

      @if (datos(); as d) {
        <section class="hoja impreso">
          <header class="cabeza-impresa">
            <img src="img/logo-botica-belen-192.png" alt="" width="44" height="44" />
            <div>
              <h2>Botica Belén: reporte de ventas</h2>
              <p class="cifra">Del {{ fechaCorta(d.desde) }} al {{ fechaCorta(d.hasta) }}{{ estado ? ', solo pedidos «' + estado + '»' : '' }}</p>
            </div>
          </header>

          <dl class="totales">
            <div><dt class="rotulo">Pedidos</dt><dd class="cifra">{{ d.totales.cantidad }}</dd></div>
            <div><dt class="rotulo">Entregados</dt><dd class="cifra">{{ d.totales.entregados }}</dd></div>
            <div><dt class="rotulo">Anulados</dt><dd class="cifra">{{ d.totales.cancelados }}</dd></div>
            <div><dt class="rotulo">IGV</dt><dd class="cifra">{{ soles(d.totales.igv) }}</dd></div>
            <div class="principal"><dt class="rotulo">Ventas (sin anulados)</dt><dd class="cifra">{{ soles(d.totales.monto) }}</dd></div>
          </dl>

          @if (d.pedidos.length === 0) {
            <p class="sin-datos">No hay pedidos con estos filtros.</p>
          } @else {
            <div class="tabla-envoltura">
              <table class="tabla">
                <thead>
                  <tr>
                    <th scope="col">Fecha</th>
                    <th scope="col">Reserva</th>
                    <th scope="col">Cliente</th>
                    <th scope="col">Pago</th>
                    <th scope="col">Estado</th>
                    <th scope="col" class="derecha">Op. gravada</th>
                    <th scope="col" class="derecha">IGV</th>
                    <th scope="col" class="derecha">Total</th>
                  </tr>
                </thead>
                <tbody>
                  @for (p of d.pedidos; track p.idPedido) {
                    <tr [class.anulado]="p.estadoPedido === 'Cancelado' || p.estadoPedido === 'Rechazado'">
                      <td class="fecha">{{ fecha(p.fechaHoraToma) }}</td>
                      <td><a [routerLink]="['/gestion/pedidos', p.idPedido]" class="cifra codigo">{{ p.codigoPedido }}</a></td>
                      <td>{{ p.nombreCliente }}</td>
                      <td>{{ p.metodoPago }}</td>
                      <td><app-sello [estado]="p.estadoPedido" /></td>
                      <td class="derecha cifra">{{ soles(p.subtotalGeneral) }}</td>
                      <td class="derecha cifra">{{ soles(p.igv) }}</td>
                      <td class="derecha cifra"><strong>{{ soles(p.total) }}</strong></td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </section>
      } @else if (cargando()) {
        <p class="hoja cargando">Generando reporte…</p>
      }
    </div>
  `,
  styles: `
    .botones { display: flex; gap: var(--e2); }
    .filtros { display: grid; grid-template-columns: repeat(2, minmax(150px, 1fr)) minmax(160px, 1fr) minmax(220px, 1.6fr) auto; gap: var(--e3); align-items: stretch; margin-bottom: var(--e5); }
    .cabeza-impresa { display: flex; gap: var(--e3); align-items: center; padding: var(--e4) var(--e5); border-bottom: 1px solid var(--rayado); }
    .cabeza-impresa h2 { font-size: var(--t-medio); }
    .cabeza-impresa p { font-size: var(--t-chico); color: var(--texto-2); }
    .totales { display: grid; grid-template-columns: repeat(4, 1fr) 1.4fr; margin: 0; border-bottom: 1px solid var(--rayado); }
    .totales > div { display: grid; gap: 2px; padding: var(--e3) var(--e5); }
    .totales > div + div { border-left: 1px solid var(--rayado); }
    .totales dd { margin: 0; font-size: var(--t-medio); font-weight: 750; color: var(--tinta); }
    .totales .principal { background: var(--velo); }
    .totales .principal dd { font-size: var(--t-grande); font-weight: 800; }
    .tabla th:first-child, .tabla td:first-child { padding-left: var(--e5); }
    .tabla th:last-child, .tabla td:last-child { padding-right: var(--e5); }
    .fecha { white-space: nowrap; color: var(--texto-2); }
    .codigo { font-weight: 700; color: var(--tinta); text-decoration: none; white-space: nowrap; }
    .anulado td { color: var(--texto-2); }
    .anulado td:last-child strong { text-decoration: line-through; }
    .sin-datos { padding: var(--e6); text-align: center; color: var(--texto-2); }
    .cargando { padding: var(--e7); text-align: center; color: var(--texto-2); }
    @media (max-width: 1100px) { .filtros { grid-template-columns: repeat(2, minmax(0, 1fr)); } .totales { grid-template-columns: repeat(2, 1fr); } .totales > div { border-left: 0 !important; border-top: 1px solid var(--rayado); } }
    @media (max-width: 520px) { .filtros { grid-template-columns: minmax(0, 1fr); } }
    @media print { .impreso { border: 0; } .tabla { font-size: 11px; } }
  `,
})
export class Reporte {
  private readonly gestion = inject(GestionService);

  protected readonly estados = ESTADOS_LISTA;
  protected readonly productos = toSignal(this.gestion.productos({ orden: 'nombre_asc' }).pipe(catchError(() => of([] as Producto[]))), { initialValue: [] });
  protected desde = `${new Date().getFullYear()}-01-01`;
  protected hasta = new Date().toLocaleDateString('en-CA');
  protected estado = '';
  protected producto = '';
  protected readonly datos = signal<ReporteModelo | null>(null);
  protected readonly cargando = signal(true);
  protected readonly error = signal('');

  protected readonly soles = formatoSoles;
  protected readonly fecha = formatoFecha;
  protected readonly partes = separarPresentacion;
  protected fechaCorta = (d: string) => formatoFecha(`${d} 00:00:00`, false);

  constructor() {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.gestion.reporte({ desde: this.desde, hasta: this.hasta, estado: this.estado, producto: this.producto }).subscribe({
      next: (d) => {
        this.datos.set(d);
        this.cargando.set(false);
        this.error.set('');
      },
      error: (e) => {
        this.cargando.set(false);
        this.error.set(mensajeError(e));
      },
    });
  }

  protected imprimir(): void {
    window.print();
  }

  // CSV con separador ";" y BOM para que Excel en español lo abra con tildes y columnas correctas.
  protected exportar(): void {
    const d = this.datos();
    if (!d) return;
    const filas = [
      ['Fecha', 'Código', 'Cliente', 'Pago', 'Estado', 'Op. gravada', 'IGV', 'Total'],
      ...d.pedidos.map((p) => [p.fechaHoraToma, p.codigoPedido, p.nombreCliente ?? '', p.metodoPago ?? '', p.estadoPedido, p.subtotalGeneral.toFixed(2), p.igv.toFixed(2), p.total.toFixed(2)]),
    ];
    const csv = filas.map((f) => f.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\r\n');
    const enlace = document.createElement('a');
    enlace.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    enlace.download = `reporte-ventas-${d.desde}-al-${d.hasta}.csv`;
    enlace.click();
    URL.revokeObjectURL(enlace.href);
  }
}
