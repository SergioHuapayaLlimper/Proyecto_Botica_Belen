import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { urlMapa } from '../core/negocio.service';

// Minimapa de Google Maps centrado en las coordenadas que configura el admin.
@Component({
  selector: 'app-mapa',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (url(); as u) {
      <iframe [src]="u" [title]="titulo()" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
    } @else {
      <p class="sin-mapa">Aún no hay una ubicación configurada.</p>
    }
  `,
  styles: `
    :host { display: block; overflow: hidden; background: var(--velo); border-radius: var(--radio-hoja); }
    iframe { display: block; width: 100%; height: 100%; min-height: inherit; border: 0; }
    .sin-mapa { display: grid; place-items: center; height: 100%; min-height: inherit; padding: var(--e5); color: var(--texto-2); text-align: center; }
  `,
})
export class Mapa {
  private readonly sanitizer = inject(DomSanitizer);
  readonly lat = input<number | null>(null);
  readonly lng = input<number | null>(null);
  readonly titulo = input('Mapa de ubicación de la botica');

  // Angular exige marcar como confiable la URL de un iframe externo; solo se arma con números.
  protected readonly url = computed(() => {
    const lat = this.lat();
    const lng = this.lng();
    if (lat === null || lng === null || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(urlMapa(lat, lng));
  });
}
