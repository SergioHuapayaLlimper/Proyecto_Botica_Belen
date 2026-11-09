import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AvisosService } from '../core/avisos.service';
import { Icono } from './icono';

@Component({
  selector: 'app-avisos',
  imports: [Icono],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pila" role="status" aria-live="polite">
      @for (a of avisos.lista(); track a.id) {
        <div class="aviso-flotante" [class.es-error]="a.tipo === 'error'">
          <app-icono [nombre]="a.tipo === 'error' ? 'alerta' : 'check'" [tam]="18" />
          <span>{{ a.texto }}</span>
          <button type="button" (click)="avisos.cerrar(a.id)" aria-label="Cerrar aviso"><app-icono nombre="cerrar" [tam]="16" /></button>
        </div>
      }
    </div>
  `,
  styles: `
    .pila {
      position: fixed; z-index: 100; right: 20px; bottom: 20px;
      display: grid; gap: 8px; width: min(380px, calc(100vw - 32px));
    }
    .aviso-flotante {
      display: grid; grid-template-columns: auto 1fr auto; gap: 10px; align-items: start;
      padding: 12px 12px 12px 14px; font-size: 0.9375rem; line-height: 1.4;
      color: #fff; background: var(--tinta); border-radius: var(--radio);
      box-shadow: var(--sombra-flota);
      animation: entra 260ms var(--sale) both;
    }
    .aviso-flotante.es-error { background: #7d1520; }
    .aviso-flotante app-icono { margin-top: 1px; }
    button {
      display: grid; place-items: center; width: 28px; height: 28px; margin: -4px -4px 0 0;
      color: var(--texto-claro); background: none; border: 0; border-radius: 4px; cursor: pointer;
    }
    button:hover { color: #fff; background: rgb(255 255 255 / 0.12); }
    @keyframes entra { from { opacity: 0; transform: translateY(10px); } }
    @media (max-width: 600px) { .pila { right: 16px; left: 16px; bottom: 16px; width: auto; } }
  `,
})
export class Avisos {
  protected readonly avisos = inject(AvisosService);
}
