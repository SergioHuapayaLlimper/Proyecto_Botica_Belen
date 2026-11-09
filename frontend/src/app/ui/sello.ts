import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { EstadoPedido } from '../core/modelos';
import { claseEstado } from '../core/formato';

// Sello de tinta: doble filete, versalitas espaciadas. Es la "firma" visual del sistema.
// Con [cae]="true" entra con el movimiento de presión de tinta.
@Component({
  selector: 'app-sello',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="sello" [class]="'sello sello--' + clase() + (grande() ? ' sello--grande' : '') + (cae() ? ' sello--cae' : '')"><ng-content />{{ texto() }}</span>`,
  styles: `
    :host { display: inline-flex; }
    .sello {
      --c: var(--st-pendiente);
      display: inline-flex; align-items: center; gap: 6px;
      padding: 3px 11px 3px; min-height: 26px;
      font-size: 0.8125rem; font-weight: 750; line-height: 1.1; letter-spacing: 0.07em; text-transform: uppercase;
      white-space: nowrap; color: var(--c);
      border: 1.5px solid var(--c); border-radius: 999px;
      box-shadow: inset 0 0 0 2px #fff, inset 0 0 0 3px color-mix(in srgb, var(--c) 45%, transparent);
      background: color-mix(in srgb, var(--c) 6%, #fff);
    }
    .sello--pendiente { --c: var(--st-pendiente); }
    .sello--aceptado { --c: var(--st-aceptado); }
    .sello--preparacion { --c: var(--st-preparacion); }
    .sello--listo { --c: var(--st-listo); }
    .sello--entregado { --c: var(--st-entregado); }
    .sello--cancelado { --c: var(--st-cancelado); }
    .sello--rojo { --c: var(--rojo); }
    .sello--tinta { --c: var(--tinta); }
    .sello--agotado { --c: #6b7385; }
    .sello--grande {
      --giro: -3deg;
      padding: 8px 18px; font-size: 1rem; letter-spacing: 0.12em; border-width: 2.5px;
      box-shadow: inset 0 0 0 3px #fff, inset 0 0 0 4.5px color-mix(in srgb, var(--c) 55%, transparent);
      transform: rotate(var(--giro));
    }
    .sello--cae { animation: sello-cae 220ms var(--sale) both; }
  `,
})
export class Sello {
  // Un estado de pedido o una variante libre: 'rojo', 'tinta', 'agotado', 'listo', etc.
  readonly estado = input<EstadoPedido | null>(null);
  readonly variante = input<string | null>(null);
  readonly etiqueta = input<string | null>(null);
  readonly grande = input(false);
  readonly cae = input(false);

  protected readonly clase = computed(() => this.variante() ?? (this.estado() ? claseEstado(this.estado()!) : 'tinta'));
  protected readonly texto = computed(() => this.etiqueta() ?? this.estado() ?? '');
}
