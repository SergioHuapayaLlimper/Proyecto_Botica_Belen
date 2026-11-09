import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TIENDA } from '../core/modelos';
import { Icono } from './icono';

// Panel lateral de las pantallas de acceso: lo que el cliente necesita saber para recoger.
@Component({
  selector: 'app-info-recojo',
  imports: [Icono],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <img src="img/logo-botica-belen-192.png" alt="" width="64" height="64" />
    <p class="titulo">Tus reservas te esperan en el mostrador.</p>
    <dl>
      <div>
        <dt><app-icono nombre="ubicacion" [tam]="18" /> Dónde recoges</dt>
        <dd>{{ tienda.direccion }}</dd>
      </div>
      <div>
        <dt><app-icono nombre="reloj" [tam]="18" /> Horario</dt>
        <dd>{{ tienda.horario }}</dd>
      </div>
      <div>
        <dt><app-icono nombre="efectivo" [tam]="18" /> Cómo pagas</dt>
        <dd>Al recoger, con efectivo, Yape, Plin o tarjeta.</dd>
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
  `,
})
export class InfoRecojo {
  protected readonly tienda = TIENDA;
}
