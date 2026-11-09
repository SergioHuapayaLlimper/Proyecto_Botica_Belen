import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { Icono } from './icono';

// Imagen del producto si existe; si no, el pictograma de su categoría sobre papel azul impreso.
@Component({
  selector: 'app-pictograma',
  imports: [Icono],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (imagen() && !falloImagen()) {
      <img [src]="imagen()" [alt]="alt()" loading="lazy" (error)="falloImagen.set(true)" />
    } @else {
      <app-icono [nombre]="'cat-' + (categoria() ?? 0)" [tam]="tamIcono()" [trazo]="1.5" />
    }
  `,
  styles: `
    :host {
      display: grid; place-items: center; flex-shrink: 0;
      width: var(--lado, 64px); height: var(--lado, 64px);
      color: var(--tinta);
      background:
        repeating-linear-gradient(0deg, transparent 0 11px, rgb(31 108 176 / 0.07) 11px 12px),
        var(--velo);
      border: 1px solid var(--rayado);
      border-radius: var(--radio);
      overflow: hidden;
    }
    img { width: 100%; height: 100%; object-fit: contain; padding: var(--relleno, 10%); background: #fff; transition: transform 220ms var(--sale); }
  `,
})
export class Pictograma {
  readonly categoria = input<number | null | undefined>(0);
  readonly imagen = input<string | null | undefined>(null);
  readonly alt = input('');
  readonly tamIcono = input(30);
  protected readonly falloImagen = signal(false);
}
