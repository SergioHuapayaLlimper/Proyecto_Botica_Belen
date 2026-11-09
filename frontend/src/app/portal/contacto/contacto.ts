import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NegocioService, urlAbrirMapa } from '../../core/negocio.service';
import { Icono } from '../../ui/icono';
import { Mapa } from '../../ui/mapa';

@Component({
  selector: 'app-contacto',
  imports: [RouterLink, Icono, Mapa],
  template: `
    <div class="pagina">
      <header class="pagina-cabecera">
        <div>
          <h1>Contacto</h1>
          <p>Aquí recoges tus reservas. Escríbenos si tienes una consulta antes de venir.</p>
        </div>
      </header>

      <div class="contacto">
        <app-mapa class="mapa" [lat]="negocio.coordenadas()?.lat ?? null" [lng]="negocio.coordenadas()?.lng ?? null" [titulo]="'Ubicación de ' + d().nombre_negocio" />

        <section class="hoja datos" aria-label="Datos de contacto">
          <h2>{{ d().nombre_negocio }}</h2>

          <dl>
            <div>
              <dt><app-icono nombre="ubicacion" [tam]="20" /> Dirección</dt>
              <dd>
                {{ d().direccion }}
                @if (d().referencia) {
                  <small>{{ d().referencia }}</small>
                }
              </dd>
            </div>
            @if (d().horario_atencion) {
              <div>
                <dt><app-icono nombre="reloj" [tam]="20" /> Horario</dt>
                <dd>{{ d().horario_atencion }}</dd>
              </div>
            }
            @if (d().telefono_contacto) {
              <div>
                <dt><app-icono nombre="telefono" [tam]="20" /> Teléfono</dt>
                <dd><a [href]="'tel:' + soloDigitos(d().telefono_contacto)">{{ d().telefono_contacto }}</a></dd>
              </div>
            }
            @if (d().correo_contacto) {
              <div>
                <dt><app-icono nombre="documento" [tam]="20" /> Correo</dt>
                <dd>{{ d().correo_contacto }}</dd>
              </div>
            }
            @if (d().metodos_pago) {
              <div>
                <dt><app-icono nombre="efectivo" [tam]="20" /> Formas de pago</dt>
                <dd>{{ d().metodos_pago }}, al recoger.</dd>
              </div>
            }
          </dl>

          <div class="botones">
            @if (negocio.whatsappUrl(); as wa) {
              <a class="btn btn--grande" [href]="wa" target="_blank" rel="noopener"><app-icono nombre="celular" [tam]="20" /> Escribir por WhatsApp</a>
            }
            @if (abrirMapa(); as url) {
              <a class="btn btn--grande btn--borde" [href]="url" target="_blank" rel="noopener"><app-icono nombre="ubicacion" [tam]="20" /> Cómo llegar</a>
            }
          </div>
          <p class="volver-productos">¿Ya sabes qué necesitas? <a routerLink="/productos">Sepáralo aquí</a> y recógelo sin hacer cola.</p>
        </section>
      </div>
    </div>
  `,
  styles: `
    .contacto { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); gap: var(--e5); align-items: stretch; }
    .mapa { min-height: 460px; border: 1px solid var(--rayado); }
    .datos { display: grid; gap: var(--e5); align-content: start; padding: var(--e6); }
    .datos h2 { font-size: 2rem; line-height: 1; }
    dl { display: grid; gap: var(--e4); margin: 0; }
    dt { display: flex; gap: var(--e2); align-items: center; font-weight: 700; }
    dt app-icono { color: var(--rojo); }
    dd { display: grid; gap: 2px; margin: 4px 0 0 28px; color: var(--texto-2); }
    dd small { font-size: var(--t-chico); }
    .botones { display: flex; flex-wrap: wrap; gap: var(--e3); }
    .botones .btn { flex: 1; min-width: 210px; }
    .volver-productos { font-size: var(--t-chico); color: var(--texto-2); }
    @media (max-width: 900px) {
      .contacto { grid-template-columns: 1fr; }
      .mapa { min-height: 300px; }
      .datos { padding: var(--e5) var(--e4); }
    }
  `,
})
export class Contacto {
  protected readonly negocio = inject(NegocioService);
  protected readonly d = this.negocio.datos;

  protected readonly abrirMapa = computed(() => {
    const c = this.negocio.coordenadas();
    return c ? urlAbrirMapa(c.lat, c.lng) : null;
  });

  protected soloDigitos(valor: string): string {
    return valor.replace(/[^\d+]/g, '');
  }
}
