import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NegocioService } from '../core/negocio.service';
import { Icono } from './icono';

// Panel lateral de las pantallas de acceso: lo que el cliente necesita saber para recoger.
@Component({
  selector: 'app-info-recojo',
  imports: [Icono, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <img src="img/logo-botica-belen-192.png" alt="" width="64" height="64" />
    <p class="titulo">Tus reservas te esperan en el mostrador.</p>
    <dl>
      <div>
        <dt><app-icono nombre="ubicacion" [tam]="18" /> Dónde recoges</dt>
        <dd>{{ negocio.datos().direccion }}. <a routerLink="/contacto">Ver mapa</a></dd>
      </div>
      <div>
        <dt><app-icono nombre="reloj" [tam]="18" /> Horario</dt>
        <dd>{{ negocio.datos().horario_atencion }}</dd>
      </div>
      <div>
        <dt><app-icono nombre="efectivo" [tam]="18" /> Cómo pagas</dt>
        <dd>Al recoger: {{ negocio.datos().metodos_pago }}.</dd>
      </div>
    </dl>
  `,
  styles: `
    :host {
      display: flex; flex-direction: column; gap: var(--e5);
      padding: var(--e7) var(--e6); color: #dce6f4; background: var(--tinta);
    }
    img { width: 64px; height: 64px; }
    .titulo {
      max-width: 14ch; font-size: 2.25rem; font-weight: 800; font-stretch: 62%; line-height: 0.95; color: #fff;
    }
    dl { display: grid; gap: var(--e4); margin: auto 0 0; }
    dt { display: flex; gap: var(--e2); align-items: center; font-weight: 700; color: #fff; }
    dt app-icono { color: #ff8a93; }
    dd { margin: 4px 0 0 26px; font-size: var(--t-chico); line-height: 1.5; }
    dd a { color: #fff; }
  `,
})
export class InfoRecojo {
  protected readonly negocio = inject(NegocioService);
}
