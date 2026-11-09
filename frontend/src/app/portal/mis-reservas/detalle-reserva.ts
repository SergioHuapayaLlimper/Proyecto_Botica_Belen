import { Component, OnInit, effect, inject, input, signal, untracked } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { API, Pedido } from '../../core/modelos';
import { AvisosService } from '../../core/avisos.service';
import { mensajeError } from '../../core/interceptores';
import { SeguimientoService } from '../../core/seguimiento.service';
import { Icono } from '../../ui/icono';
import { TarjetaControl } from '../../ui/tarjeta-control';

// Se usa para la confirmación (/reserva/confirmada/:id) y para el detalle (/mis-reservas/:id).
@Component({
  selector: 'app-detalle-reserva',
  imports: [RouterLink, Icono, TarjetaControl],
  template: `
    <div class="pagina pagina--angosta">
      @if (confirmada()) {
        <header class="pagina-cabecera">
          <div>
            <h1>¡Reserva registrada!</h1>
            <p>Te la separamos. Te avisaremos aquí cuando esté lista para recoger.</p>
          </div>
        </header>
      } @else {
        <a routerLink="/mis-reservas" class="volver no-imprimir"><app-icono nombre="izquierda" [tam]="18" /> Mis reservas</a>
      }

      @if (pedido(); as p) {
        <app-tarjeta-control [pedido]="p" [recienCreada]="confirmada()" />

        <div class="acciones no-imprimir">
          <button type="button" class="btn btn--borde" (click)="imprimir()"><app-icono nombre="imprimir" [tam]="18" /> Imprimir o guardar PDF</button>
          @if (confirmada()) {
            <a routerLink="/mis-reservas" class="btn btn--borde"><app-icono nombre="lista" [tam]="18" /> Ver mis reservas</a>
            <a routerLink="/" class="btn btn--tinta">Seguir comprando</a>
          } @else if (p.estadoPedido === 'Pendiente') {
            @if (confirmando()) {
              <div class="confirmar-cancelar" role="group" aria-label="Confirmar cancelación">
                <p>¿Cancelar esta reserva? Los productos vuelven a estar disponibles.</p>
                <button type="button" class="btn btn--peligro" [disabled]="cancelando()" (click)="cancelar()">Sí, cancelar</button>
                <button type="button" class="btn btn--texto" (click)="confirmando.set(false)">No</button>
              </div>
            } @else {
              <button type="button" class="btn btn--peligro" (click)="confirmando.set(true)"><app-icono nombre="cerrar" [tam]="18" /> Cancelar reserva</button>
            }
          }
        </div>
      } @else if (error()) {
        <div class="aviso aviso--error" role="alert"><app-icono nombre="alerta" [tam]="20" /><p>{{ error() }}</p></div>
      } @else {
        <div class="hoja cargando" aria-busy="true">Cargando tu reserva…</div>
      }
    </div>
  `,
  styles: `
    .acciones { display: flex; flex-wrap: wrap; gap: var(--e3); margin-top: var(--e5); }
    .confirmar-cancelar { display: flex; flex-wrap: wrap; gap: var(--e3); align-items: center; padding: var(--e3) var(--e4); background: #fdf0f1; border: 1px solid #f1c4c9; border-radius: var(--radio); }
    .confirmar-cancelar p { font-weight: 600; color: #7d1520; }
    .cargando { padding: var(--e7); text-align: center; color: var(--texto-2); }
  `,
})
export class DetalleReserva implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly avisos = inject(AvisosService);
  private readonly seguimiento = inject(SeguimientoService);

  readonly id = input.required<string>();
  readonly confirmada = input(false);

  protected readonly pedido = signal<Pedido | null>(null);
  protected readonly error = signal('');
  protected readonly confirmando = signal(false);
  protected readonly cancelando = signal(false);

  constructor() {
    // RF10: si el personal avanza esta reserva, la tarjeta se actualiza sin recargar la página.
    let primera = true;
    effect(() => {
      this.seguimiento.version();
      if (primera) {
        primera = false;
        return;
      }
      untracked(() => this.cargar());
    });
  }

  ngOnInit(): void {
    this.cargar();
  }

  private cargar(): void {
    this.http.get<Pedido>(`${API}/pedidos/${this.id()}`).subscribe({
      next: (p) => this.pedido.set(p),
      error: (e) => this.error.set(mensajeError(e)),
    });
  }

  protected imprimir(): void {
    window.print();
  }

  protected cancelar(): void {
    this.cancelando.set(true);
    this.http.post<Pedido>(`${API}/pedidos/${this.id()}/cancelar`, {}).subscribe({
      next: (p) => {
        this.pedido.set(p);
        this.seguimiento.marcar(p.idPedido, p.estadoPedido); // fue su propia acción: no se le avisa
        this.confirmando.set(false);
        this.cancelando.set(false);
        this.avisos.ok('Reserva cancelada. Los productos volvieron al stock.');
      },
      error: (e) => {
        this.cancelando.set(false);
        this.avisos.error(mensajeError(e));
      },
    });
  }
}
