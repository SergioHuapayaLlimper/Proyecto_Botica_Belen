import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { API, PedidoResumen } from '../../core/modelos';
import { formatoFecha, formatoSoles } from '../../core/formato';
import { mensajeError } from '../../core/interceptores';
import { SeguimientoService } from '../../core/seguimiento.service';
import { Icono } from '../../ui/icono';
import { Sello } from '../../ui/sello';

@Component({
  selector: 'app-mis-reservas',
  imports: [RouterLink, Icono, Sello],
  template: `
    <div class="pagina pagina--angosta">
      <header class="pagina-cabecera">
        <div>
          <h1>Mis reservas</h1>
          <p>Esta lista se actualiza sola. Te avisamos aquí cuando tu reserva cambie de estado.</p>
        </div>
        <a routerLink="/productos" class="btn btn--borde"><app-icono nombre="reserva" [tam]="18" /> Nueva reserva</a>
      </header>

      @if (estado().cargando) {
        <div class="hoja cargando" aria-busy="true">Cargando tus reservas…</div>
      } @else if (estado().error) {
        <div class="aviso aviso--error" role="alert"><app-icono nombre="alerta" [tam]="20" /><p>{{ estado().error }}</p></div>
      } @else if (estado().lista.length === 0) {
        <div class="vacio hoja">
          <app-icono nombre="lista" [tam]="48" [trazo]="1.25" />
          <h3>Todavía no tienes reservas</h3>
          <p>Cuando confirmes una, aparecerá aquí con su estado.</p>
          <a routerLink="/productos" class="btn btn--tinta">Ir al catálogo</a>
        </div>
      } @else {
        <ul class="hoja lista">
          @for (r of estado().lista; track r.idPedido) {
            <li>
              <a [routerLink]="['/mis-reservas', r.idPedido]">
                <span class="codigo">
                  <strong class="cifra">{{ r.codigoPedido }}</strong>
                  <small>{{ fecha(r.fechaHoraToma) }}</small>
                </span>
                <span class="detalle">
                  <app-icono nombre="tienda" [tam]="18" />
                  {{ r.unidades }} {{ r.unidades === 1 ? 'unidad' : 'unidades' }}, pago con {{ r.metodoPago }}
                </span>
                <strong class="monto cifra">{{ soles(r.total) }}</strong>
                <app-sello [estado]="r.estadoPedido" />
                <app-icono class="flecha" nombre="derecha" [tam]="18" />
              </a>
            </li>
          }
        </ul>
      }
    </div>
  `,
  styles: `
    .cargando { padding: var(--e7); text-align: center; color: var(--texto-2); }
    .lista { padding: 0; margin: 0; list-style: none; }
    .lista li + li { border-top: 1px solid var(--rayado); }
    .lista a {
      display: grid; grid-template-columns: minmax(150px, 1.2fr) 1.4fr auto auto 18px; gap: var(--e4); align-items: center;
      padding: var(--e4) var(--e5); color: var(--texto); text-decoration: none; transition: background-color 140ms var(--sale);
    }
    .lista a:hover { background: #f7f9fc; }
    .lista a:hover .flecha { color: var(--tinta); transform: translateX(2px); }
    .codigo { display: grid; }
    .codigo small, .detalle { font-size: var(--t-chico); color: var(--texto-2); }
    .detalle { display: flex; gap: var(--e2); align-items: center; }
    .monto { font-size: var(--t-cuerpo); }
    .flecha { color: var(--rayado-fuerte); transition: transform 160ms var(--sale), color 160ms var(--sale); }
    @media (max-width: 640px) {
      .lista a { grid-template-columns: 1fr auto; padding: var(--e4); gap: var(--e2) var(--e3); }
      .detalle { grid-column: 1; }
      .monto { grid-row: 1; grid-column: 2; text-align: right; }
      app-sello { grid-column: 2; justify-self: end; }
      .flecha { display: none; }
    }
  `,
})
export class MisReservas {
  private readonly http = inject(HttpClient);
  protected readonly fecha = formatoFecha;
  protected readonly soles = formatoSoles;

  // RF10: se vuelve a pedir la lista cada vez que el seguimiento detecta un cambio de estado.
  protected readonly estado = toSignal(
    toObservable(inject(SeguimientoService).version).pipe(
      switchMap(() =>
        this.http.get<PedidoResumen[]>(`${API}/pedidos/mios`).pipe(
          map((lista) => ({ cargando: false, lista, error: '' })),
          catchError((e) => of({ cargando: false, lista: [] as PedidoResumen[], error: mensajeError(e) })),
        ),
      ),
      startWith({ cargando: true, lista: [] as PedidoResumen[], error: '' }),
    ),
    { requireSync: true },
  );
}
