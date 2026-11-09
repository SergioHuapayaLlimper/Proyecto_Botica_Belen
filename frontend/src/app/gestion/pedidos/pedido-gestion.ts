import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EstadoPedido, Pedido } from '../../core/modelos';
import { AuthService } from '../../core/auth.service';
import { AvisosService } from '../../core/avisos.service';
import { ACCION_ESTADO } from '../../core/formato';
import { NegocioService } from '../../core/negocio.service';
import { reservaPdf } from '../../core/exportar';
import { mensajeError } from '../../core/interceptores';
import { Icono } from '../../ui/icono';
import { TarjetaControl } from '../../ui/tarjeta-control';
import { GestionService } from '../gestion.service';

@Component({
  selector: 'app-pedido-gestion',
  imports: [FormsModule, RouterLink, Icono, TarjetaControl],
  template: `
    <div class="pagina">
      <div class="arriba">
        <a routerLink="/gestion/pedidos" class="volver"><app-icono nombre="izquierda" [tam]="18" /> Pedidos</a>
        @if (pedido(); as p) {
          <button type="button" class="btn btn--borde btn--chico" (click)="descargarPdf(p)"><app-icono nombre="documento" [tam]="16" /> Constancia PDF</button>
        }
      </div>

      @if (pedido(); as p) {
        <div class="disposicion">
          <app-tarjeta-control [pedido]="p" [vistaPersonal]="true" />

          <aside class="hoja panel">
            <h2>Siguiente paso</h2>
            @if (!puedeActuar()) {
              <p class="nota">Tu rol puede consultar este pedido, pero no cambiar su estado (falta el permiso «Atender pedidos»).</p>
            } @else if (avances().length === 0 && !anulables().length) {
              <p class="nota">Este pedido ya está cerrado: {{ p.estadoPedido.toLowerCase() }}.</p>
            } @else {
              <div class="botones">
                @for (e of avances(); track e) {
                  <button type="button" class="btn btn--grande btn--bloque" [class.btn--tinta]="e !== 'Entregado'" [disabled]="ocupado()" (click)="cambiar(e)">
                    <app-icono nombre="check" [tam]="20" /> {{ accion[e] }}
                  </button>
                }
              </div>

              @if (anulables().length) {
                <div class="anular">
                  <span class="rotulo">¿No se puede atender?</span>
                  @if (anularCon()) {
                    <label class="casilla">
                      <span class="rotulo">Motivo ({{ anularCon() === 'Rechazado' ? 'rechazo' : 'cancelación' }})</span>
                      <textarea name="motivo" [(ngModel)]="motivo" placeholder="Explica el motivo al cliente (mínimo 10 caracteres)"></textarea>
                    </label>
                    <div class="fila">
                      <button type="button" class="btn btn--peligro" [disabled]="motivo.trim().length < 10 || ocupado()" (click)="cambiar(anularCon()!, motivo)">
                        Confirmar {{ anularCon() === 'Rechazado' ? 'rechazo' : 'cancelación' }}
                      </button>
                      <button type="button" class="btn btn--texto" (click)="anularCon.set(null)">Volver</button>
                    </div>
                    <p class="ayuda-campo">Las unidades separadas vuelven al stock.</p>
                  } @else {
                    <div class="fila">
                      @for (e of anulables(); track e) {
                        <button type="button" class="btn btn--peligro btn--chico" (click)="anularCon.set(e); motivo = ''">{{ accion[e] }}</button>
                      }
                    </div>
                  }
                </div>
              }
            }
          </aside>
        </div>
      } @else if (error()) {
        <div class="aviso aviso--error" role="alert"><app-icono nombre="alerta" [tam]="20" /><p>{{ error() }}</p></div>
      } @else {
        <p class="cargando hoja">Cargando pedido…</p>
      }
    </div>
  `,
  styles: `
    .arriba { display: flex; flex-wrap: wrap; gap: var(--e3); align-items: center; justify-content: space-between; }
    .disposicion { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: var(--e5); align-items: start; }
    .panel { position: sticky; top: var(--e4); display: grid; gap: var(--e4); padding: var(--e5); }
    .panel h2 { font-size: var(--t-medio); }
    .nota { color: var(--texto-2); }
    .botones { display: grid; gap: var(--e2); }
    .anular { display: grid; gap: var(--e3); padding-top: var(--e4); border-top: 1px dashed var(--rayado-fuerte); }
    .fila { display: flex; flex-wrap: wrap; gap: var(--e2); }
    .cargando { padding: var(--e7); text-align: center; color: var(--texto-2); }
    @media (max-width: 1020px) { .disposicion { grid-template-columns: 1fr; } .panel { position: static; } }
  `,
})
export class PedidoGestion implements OnInit {
  private readonly gestion = inject(GestionService);
  private readonly avisos = inject(AvisosService);
  private readonly auth = inject(AuthService);
  private readonly negocio = inject(NegocioService);

  protected descargarPdf(p: Pedido): void {
    reservaPdf(p, this.negocio.datos()).catch(() => this.avisos.error('No se pudo generar el PDF. Inténtalo de nuevo.'));
  }

  readonly id = input.required<string>();
  protected readonly pedido = signal<Pedido | null>(null);
  protected readonly error = signal('');
  protected readonly ocupado = signal(false);
  protected readonly anularCon = signal<EstadoPedido | null>(null);
  protected motivo = '';
  protected readonly accion = ACCION_ESTADO;

  protected readonly puedeActuar = computed(() => this.auth.puede('pedidos_estado'));
  protected readonly avances = computed(() => (this.pedido()?.siguientes ?? []).filter((e) => e !== 'Cancelado' && e !== 'Rechazado'));
  protected readonly anulables = computed(() => (this.pedido()?.siguientes ?? []).filter((e) => e === 'Cancelado' || e === 'Rechazado'));

  ngOnInit(): void {
    this.gestion.pedido(this.id()).subscribe({
      next: (p) => this.pedido.set(p),
      error: (e) => this.error.set(mensajeError(e)),
    });
  }

  protected cambiar(estado: EstadoPedido, motivo = ''): void {
    const p = this.pedido();
    if (!p) return;
    this.ocupado.set(true);
    this.gestion.cambiarEstado(p.idPedido, estado, motivo).subscribe({
      next: (actualizado) => {
        this.pedido.set(actualizado);
        this.ocupado.set(false);
        this.anularCon.set(null);
        this.avisos.ok(`Pedido ${actualizado.codigoPedido}: ${estado.toLowerCase()}.`);
        this.gestion.refrescar();
      },
      error: (e) => {
        this.ocupado.set(false);
        this.avisos.error(mensajeError(e));
      },
    });
  }
}
