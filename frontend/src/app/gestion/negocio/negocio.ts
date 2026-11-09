import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatosNegocio, NegocioService } from '../../core/negocio.service';
import { AvisosService } from '../../core/avisos.service';
import { mensajeError } from '../../core/interceptores';
import { Icono } from '../../ui/icono';
import { Mapa } from '../../ui/mapa';

@Component({
  selector: 'app-negocio',
  imports: [FormsModule, Icono, Mapa],
  template: `
    <div class="pagina">
      <header class="pagina-cabecera">
        <div>
          <h1>Información del negocio</h1>
          <p>Lo que ven los clientes en Contacto, en el pie de página y al reservar.</p>
        </div>
      </header>

      <form class="hoja formulario" (ngSubmit)="guardar()" novalidate>
        <section class="seccion">
          <div class="seccion-titulo">
            <h2>Ubicación</h2>
            <p>Para obtener las coordenadas: en Google Maps haz clic derecho sobre el local y copia los dos números (latitud, longitud).</p>
          </div>
          <div class="campos">
            <label class="casilla ancho"><span class="rotulo">Nombre del negocio</span><input name="nombre" [(ngModel)]="f.nombre_negocio" maxlength="100" /></label>
            <label class="casilla ancho"><span class="rotulo">Dirección</span><input name="direccion" [(ngModel)]="f.direccion" maxlength="200" /></label>
            <label class="casilla ancho"><span class="rotulo">Referencia (opcional)</span><input name="referencia" [(ngModel)]="f.referencia" maxlength="200" placeholder="A media cuadra de la Plaza de Armas" /></label>
            <label class="casilla">
              <span class="rotulo">Latitud</span>
              <input name="lat" class="cifra" [(ngModel)]="f.mapa_lat" (ngModelChange)="refrescarMapa()" inputmode="decimal" placeholder="-13.0775" />
            </label>
            <label class="casilla">
              <span class="rotulo">Longitud</span>
              <input name="lng" class="cifra" [(ngModel)]="f.mapa_lng" (ngModelChange)="refrescarMapa()" inputmode="decimal" placeholder="-76.3871" />
            </label>
            <button type="button" class="btn btn--borde ancho pegar" (click)="pegarCoordenadas()">
              <app-icono nombre="ubicacion" [tam]="18" /> Pegar «latitud, longitud» copiadas de Google Maps
            </button>
            <app-mapa class="ancho vista-mapa" [lat]="vistaLat()" [lng]="vistaLng()" titulo="Vista previa del mapa" />
          </div>
        </section>

        <section class="seccion">
          <div class="seccion-titulo">
            <h2>Atención</h2>
            <p>Se muestran en Contacto y al confirmar una reserva.</p>
          </div>
          <div class="campos">
            <label class="casilla ancho"><span class="rotulo">Horario de atención</span><textarea name="horario" [(ngModel)]="f.horario_atencion" maxlength="300"></textarea></label>
            <label class="casilla">
              <span class="rotulo">Número de Yape</span>
              <input name="yape" type="tel" [(ngModel)]="f.yape_numero" maxlength="20" />
              <span class="ayuda-campo">La botica acepta efectivo o Yape al recoger.</span>
            </label>
          </div>
        </section>

        <section class="seccion">
          <div class="seccion-titulo">
            <h2>Contacto</h2>
            <p>El WhatsApp abre un chat con el mensaje que escribas aquí.</p>
          </div>
          <div class="campos">
            <label class="casilla"><span class="rotulo">Teléfono</span><input name="telefono" type="tel" [(ngModel)]="f.telefono_contacto" maxlength="30" /></label>
            <label class="casilla"><span class="rotulo">Correo</span><input name="correo" type="email" [(ngModel)]="f.correo_contacto" maxlength="100" /></label>
            <label class="casilla">
              <span class="rotulo">WhatsApp</span>
              <input name="whatsapp" type="tel" [(ngModel)]="f.whatsapp_numero" maxlength="20" placeholder="51987654321" />
              <span class="ayuda-campo">Con código de país, por ejemplo 51 987 654 321.</span>
            </label>
            <label class="casilla ancho"><span class="rotulo">Mensaje inicial de WhatsApp</span><input name="mensaje" [(ngModel)]="f.whatsapp_mensaje" maxlength="200" /></label>
          </div>
        </section>

        <footer class="pie-form">
          @if (error()) {
            <div class="aviso aviso--error" role="alert"><app-icono nombre="alerta" [tam]="20" /><p>{{ error() }}</p></div>
          }
          <button class="btn btn--tinta btn--grande" [disabled]="guardando()">{{ guardando() ? 'Guardando…' : 'Guardar cambios' }}</button>
        </footer>
      </form>
    </div>
  `,
  styles: `
    .formulario { overflow: hidden; }
    .seccion { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 2.2fr); gap: var(--e6); padding: var(--e6); }
    .seccion + .seccion { border-top: 1px solid var(--rayado); }
    .seccion-titulo h2 { font-size: var(--t-medio); }
    .seccion-titulo p { margin-top: var(--e1); font-size: var(--t-chico); color: var(--texto-2); }
    .campos { display: grid; grid-template-columns: 1fr 1fr; gap: var(--e4); align-content: start; }
    .ancho { grid-column: 1 / -1; }
    .pegar { justify-self: start; }
    .vista-mapa { min-height: 280px; border: 1px solid var(--rayado); }
    .pie-form { display: grid; gap: var(--e3); justify-items: end; padding: var(--e5) var(--e6); background: var(--velo); border-top: 1px solid var(--rayado); }
    @media (max-width: 860px) {
      .seccion { grid-template-columns: 1fr; gap: var(--e4); padding: var(--e5) var(--e4); }
      .campos { grid-template-columns: 1fr; }
      .pie-form { padding: var(--e4); justify-items: stretch; }
    }
  `,
})
export class Negocio {
  private readonly negocio = inject(NegocioService);
  private readonly avisos = inject(AvisosService);

  protected f: DatosNegocio = { ...this.negocio.datos() };
  protected readonly guardando = signal(false);
  protected readonly error = signal('');
  protected readonly vistaLat = signal<number | null>(null);
  protected readonly vistaLng = signal<number | null>(null);
  private espera: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    // Datos frescos de la BD (por si otro admin los cambió).
    this.negocio.cargar().subscribe({
      next: (d) => {
        this.f = { ...d };
        this.actualizarVista();
      },
      error: (e) => this.error.set(mensajeError(e)),
    });
  }

  // El mapa se mueve al escribir, con una pequeña espera (como en Pastelería Web).
  protected refrescarMapa(): void {
    clearTimeout(this.espera);
    this.espera = setTimeout(() => this.actualizarVista(), 600);
  }

  private actualizarVista(): void {
    const lat = Number(this.f.mapa_lat);
    const lng = Number(this.f.mapa_lng);
    const ok = this.f.mapa_lat !== '' && this.f.mapa_lng !== '' && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
    this.vistaLat.set(ok ? lat : null);
    this.vistaLng.set(ok ? lng : null);
  }

  // Google Maps copia "-13.0775, -76.3871": se reparten en los dos campos.
  protected async pegarCoordenadas(): Promise<void> {
    try {
      const texto = await navigator.clipboard.readText();
      const partes = texto.split(',').map((p) => p.trim());
      if (partes.length !== 2 || partes.some((p) => p === '' || Number.isNaN(Number(p)))) {
        this.avisos.error('Lo copiado no son coordenadas. En Google Maps, clic derecho sobre el local y clic en los números.');
        return;
      }
      this.f = { ...this.f, mapa_lat: partes[0], mapa_lng: partes[1] };
      this.actualizarVista();
    } catch {
      this.avisos.error('El navegador no permitió leer el portapapeles. Escribe las coordenadas a mano.');
    }
  }

  protected guardar(): void {
    this.error.set('');
    this.guardando.set(true);
    this.negocio.guardar(this.f).subscribe({
      next: (d) => {
        this.f = { ...d };
        this.guardando.set(false);
        this.avisos.ok('Información del negocio guardada.');
      },
      error: (e) => {
        this.guardando.set(false);
        this.error.set(mensajeError(e));
      },
    });
  }
}
