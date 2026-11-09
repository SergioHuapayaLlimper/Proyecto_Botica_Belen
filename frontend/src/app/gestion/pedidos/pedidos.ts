import { Component, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ESTADOS_LISTA } from '../../core/estados';
import { PedidoResumen } from '../../core/modelos';
import { formatoFecha, formatoSoles } from '../../core/formato';
import { mensajeError } from '../../core/interceptores';
import { Icono } from '../../ui/icono';
import { Sello } from '../../ui/sello';
import { GestionService } from '../gestion.service';

@Component({
  selector: 'app-pedidos',
  imports: [FormsModule, RouterLink, Icono, Sello],
  template: `
    <div class="pagina">
      <header class="pagina-cabecera">
        <div>
          <h1>Pedidos</h1>
          <p>Todas las reservas, de la más nueva a la más antigua. Las pendientes aparecen primero.</p>
        </div>
      </header>

      <form class="filtros" (submit)="$event.preventDefault(); cargar()">
        <label class="casilla buscar">
          <span class="rotulo">Buscar</span>
          <input name="q" [(ngModel)]="q" placeholder="Código, cliente o correo" (input)="buscarLuego()" />
        </label>
        <label class="casilla">
          <span class="rotulo">Estado</span>
          <select name="estado" [(ngModel)]="estado" (change)="cargar()">
            <option value="">Todos</option>
            <option value="activos">En curso (sin cerrar)</option>
            @for (e of estados; track e) {
              <option [value]="e">{{ e }}</option>
            }
          </select>
        </label>
      </form>

      <section class="hoja">
        @if (error()) {
          <div class="aviso aviso--error" role="alert"><app-icono nombre="alerta" [tam]="20" /><p>{{ error() }}</p></div>
        } @else if (cargando()) {
          <p class="cargando">Cargando pedidos…</p>
        } @else if (lista().length === 0) {
          <div class="vacio">
            <app-icono nombre="buscar" [tam]="44" [trazo]="1.25" />
            <h3>Sin resultados</h3>
            <p>No hay pedidos con esos filtros.</p>
          </div>
        } @else {
          <div class="tabla-envoltura">
            <table class="tabla">
              <thead>
                <tr>
                  <th scope="col">Fecha</th>
                  <th scope="col">Reserva</th>
                  <th scope="col">Cliente</th>
                  <th scope="col" class="derecha">Unid.</th>
                  <th scope="col" class="derecha">Total</th>
                  <th scope="col">Pago</th>
                  <th scope="col">Estado</th>
                </tr>
              </thead>
              <tbody>
                @for (p of lista(); track p.idPedido) {
                  <tr>
                    <td class="fecha">{{ fecha(p.fechaHoraToma) }}</td>
                    <td><a [routerLink]="['/gestion/pedidos', p.idPedido]" class="codigo cifra">{{ p.codigoPedido }}</a></td>
                    <td>{{ p.nombreCliente }}</td>
                    <td class="derecha cifra">{{ p.unidades }}</td>
                    <td class="derecha cifra"><strong>{{ soles(p.total) }}</strong></td>
                    <td>{{ p.metodoPago }}</td>
                    <td><app-sello [estado]="p.estadoPedido" /></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <p class="pie-tabla cifra">{{ lista().length }} {{ lista().length === 1 ? 'pedido' : 'pedidos' }}</p>
        }
      </section>
    </div>
  `,
  styles: `
    .filtros { display: grid; grid-template-columns: minmax(0, 2fr) minmax(200px, 1fr); gap: var(--e3); margin-bottom: var(--e4); }
    .cargando { padding: var(--e6); text-align: center; color: var(--texto-2); }
    .tabla th:first-child, .tabla td:first-child { padding-left: var(--e5); }
    .fecha { white-space: nowrap; color: var(--texto-2); }
    .codigo { font-weight: 700; color: var(--tinta); text-decoration: none; white-space: nowrap; }
    .codigo:hover { color: var(--azul); text-decoration: underline; }
    .pie-tabla { padding: var(--e3) var(--e5); font-size: var(--t-chico); color: var(--texto-2); }
    // En el celular cada pedido es una ficha: código y sello arriba, cliente y total, fecha y pago.
    @media (max-width: 640px) {
      .filtros { grid-template-columns: 1fr; }
      .tabla-envoltura { overflow: visible; }
      .tabla thead { display: none; }
      .tabla tbody tr {
        display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center;
        grid-template-areas: 'codigo estado' 'cliente total' 'fecha pago';
        gap: 2px var(--e3); padding: var(--e3) var(--e4); border-bottom: 1px solid var(--rayado);
      }
      .tabla td { padding: 0 !important; border: 0; }
      .tabla td:nth-child(1) { grid-area: fecha; font-size: var(--t-chico); }
      .tabla td:nth-child(2) { grid-area: codigo; }
      .tabla td:nth-child(3) { grid-area: cliente; }
      .tabla td:nth-child(4) { display: none; }
      .tabla td:nth-child(5) { grid-area: total; text-align: right; }
      .tabla td:nth-child(6) { grid-area: pago; text-align: right; font-size: var(--t-chico); color: var(--texto-2); }
      .tabla td:nth-child(7) { grid-area: estado; justify-self: end; }
      .pie-tabla { padding-inline: var(--e4); }
    }
  `,
})
export class Pedidos {
  private readonly gestion = inject(GestionService);
  protected readonly estados = ESTADOS_LISTA;
  protected readonly fecha = formatoFecha;
  protected readonly soles = formatoSoles;

  protected q = '';
  protected estado = '';
  protected readonly lista = signal<PedidoResumen[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal('');
  private espera: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    effect(() => {
      this.gestion.cambios();
      untracked(() => this.cargar());
    });
  }

  protected buscarLuego(): void {
    clearTimeout(this.espera);
    this.espera = setTimeout(() => this.cargar(), 300);
  }

  protected cargar(): void {
    this.gestion.pedidos({ estado: this.estado, q: this.q.trim() }).subscribe({
      next: (l) => {
        this.lista.set(l);
        this.cargando.set(false);
        this.error.set('');
      },
      error: (e) => {
        this.cargando.set(false);
        this.error.set(mensajeError(e));
      },
    });
  }
}
