import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface Barra {
  etiqueta: string;
  valor: number;
  texto?: string;
  color?: string;
  destacada?: boolean;
}

// Barras horizontales: etiqueta, barra proporcional y valor. Se leen como una tabla.
@Component({
  selector: 'app-barras-h',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="lista" role="list">
      @for (b of filas(); track b.etiqueta) {
        <li>
          <span class="etiqueta">{{ b.etiqueta }}</span>
          <span class="pista" aria-hidden="true"><span class="relleno" [style.width.%]="b.porcentaje" [style.background]="b.color ?? 'var(--tinta)'"></span></span>
          <span class="valor cifra">{{ b.texto ?? b.valor }}</span>
        </li>
      } @empty {
        <li class="sin-datos">Sin datos en este periodo.</li>
      }
    </ul>
  `,
  styles: `
    .lista { display: grid; gap: var(--e3); padding: 0; margin: 0; list-style: none; }
    li { display: grid; grid-template-columns: minmax(110px, 0.9fr) 1.6fr auto; gap: var(--e3); align-items: center; font-size: var(--t-chico); }
    .etiqueta { font-weight: 600; color: var(--texto); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .pista { height: 12px; background: var(--velo); border-radius: 999px; overflow: hidden; }
    .relleno { display: block; height: 100%; border-radius: 999px; transform-origin: left; animation: crece 700ms var(--sale) both; }
    .valor { min-width: 64px; font-weight: 700; text-align: right; color: var(--tinta); }
    .sin-datos { display: block; color: var(--texto-2); }
    @keyframes crece { from { transform: scaleX(0); } }
  `,
})
export class BarrasH {
  readonly datos = input.required<Barra[]>();
  protected readonly filas = computed(() => {
    const max = Math.max(1, ...this.datos().map((d) => d.valor));
    return this.datos().map((d) => ({ ...d, porcentaje: (d.valor / max) * 100 }));
  });
}

// Columnas verticales con línea base, para series en el tiempo (ventas por mes).
@Component({
  selector: 'app-barras-v',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (datos().length) {
      <div class="grafico" role="img" [attr.aria-label]="descripcion()">
        @for (b of filas(); track b.etiqueta) {
          <div class="columna" [title]="b.etiqueta + ': ' + (b.texto ?? b.valor)">
            <span class="cifra monto" [class.visible]="b.destacada" [style.--alto.%]="b.porcentaje">{{ b.texto ?? b.valor }}</span>
            <span class="barra" [class.destacada]="b.destacada" [style.height.%]="b.porcentaje"></span>
            <span class="mes">{{ b.etiqueta }}</span>
          </div>
        }
      </div>
    } @else {
      <p class="sin-datos">Sin ventas registradas en los últimos 12 meses.</p>
    }
  `,
  styles: `
    .grafico { display: grid; grid-auto-columns: minmax(0, 1fr); grid-auto-flow: column; gap: var(--e2); align-items: end; height: 220px; padding-top: var(--e5); border-bottom: 1.5px solid var(--tinta); }
    .columna { position: relative; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; height: 100%; }
    .barra { width: min(100%, 38px); min-height: 3px; background: var(--azul); border-radius: 4px 4px 0 0; transform-origin: bottom; animation: sube 700ms var(--sale) both; transition: filter 160ms var(--sale); }
    .barra.destacada { background: var(--rojo); }
    .columna:hover .barra { filter: brightness(1.15); }
    .columna:hover .monto { opacity: 1; }
    .monto { position: absolute; bottom: calc(var(--alto, 0%) + 4px); font-size: 0.75rem; font-weight: 700; color: var(--tinta); white-space: nowrap; opacity: 0; transition: opacity 160ms var(--sale); }
    .monto.visible { opacity: 1; }
    .mes { position: absolute; bottom: -24px; font-size: 0.75rem; font-weight: 600; color: var(--texto-2); text-transform: capitalize; }
    :host { display: block; padding-bottom: 28px; }
    .sin-datos { color: var(--texto-2); font-size: var(--t-chico); }
    @keyframes sube { from { transform: scaleY(0); } }
  `,
})
export class BarrasV {
  readonly datos = input.required<Barra[]>();
  readonly descripcion = input('Gráfico de barras');
  protected readonly filas = computed(() => {
    const max = Math.max(1, ...this.datos().map((d) => d.valor));
    return this.datos().map((d) => ({ ...d, porcentaje: d.valor > 0 ? Math.max(2, (d.valor / max) * 100) : 0 }));
  });
}
