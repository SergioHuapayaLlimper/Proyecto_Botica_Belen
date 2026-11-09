import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { AvisosService } from '../../core/avisos.service';
import { mensajeError } from '../../core/interceptores';
import { Icono } from '../../ui/icono';
import { celularValido } from '../acceso/registro';

@Component({
  selector: 'app-mi-cuenta',
  imports: [FormsModule, Icono],
  template: `
    <div class="pagina pagina--angosta">
      <header class="pagina-cabecera">
        <div class="quien">
          <span class="inicial" aria-hidden="true">{{ auth.usuario()?.nombre?.charAt(0) }}</span>
          <div>
            <h1>Mi cuenta</h1>
            <p>{{ auth.usuario()?.email }}</p>
          </div>
        </div>
        <button type="button" class="btn btn--borde" (click)="auth.salir()"><app-icono nombre="salir" [tam]="18" /> Cerrar sesión</button>
      </header>

      <div class="hoja">
        <form class="seccion" (ngSubmit)="guardarDatos()" novalidate>
          <div class="seccion-titulo">
            <h2>Datos personales</h2>
            <p>Los usamos para coordinar el recojo de tus reservas.</p>
          </div>
          <div class="campos">
            <label class="casilla ancho" [class.casilla--error]="intento() && nombre.trim().length < 3">
              <span class="rotulo">Nombres y apellidos</span>
              <input name="nombre" [(ngModel)]="nombre" autocomplete="name" required />
            </label>
            <label class="casilla" [class.casilla--error]="intento() && !emailOk()">
              <span class="rotulo">Correo electrónico</span>
              <input type="email" name="email" [(ngModel)]="email" autocomplete="email" required />
            </label>
            <label class="casilla" [class.casilla--error]="intento() && !celularOk()">
              <span class="rotulo">Celular</span>
              <input type="tel" name="telefono" [(ngModel)]="telefono" autocomplete="tel" inputmode="tel" placeholder="987 654 321" maxlength="15" required />
            </label>
            @if (intento() && !celularOk()) {
              <p class="error-campo ancho">Escribe un celular de 9 dígitos que empiece con 9.</p>
            }
            <div class="ancho">
              <button class="btn btn--tinta" [disabled]="guardando()">{{ guardando() ? 'Guardando…' : 'Guardar cambios' }}</button>
            </div>
          </div>
        </form>

        <section class="seccion">
          <div class="seccion-titulo">
            <h2>Contraseña</h2>
            <p>Para cambiarla te pedimos la actual.</p>
          </div>
          <div class="campos">
            @if (!editandoClave()) {
              <div class="ancho">
                <button type="button" class="btn btn--borde" (click)="editandoClave.set(true)"><app-icono nombre="candado" [tam]="18" /> Cambiar contraseña</button>
              </div>
            } @else {
              <form class="campos ancho" (ngSubmit)="cambiarClave()" novalidate>
                <label class="casilla ancho"><span class="rotulo">Contraseña actual</span><input type="password" name="actual" [(ngModel)]="actual" autocomplete="current-password" /></label>
                <label class="casilla"><span class="rotulo">Nueva contraseña</span><input type="password" name="nueva" [(ngModel)]="nueva" autocomplete="new-password" /></label>
                <label class="casilla"><span class="rotulo">Repite la nueva</span><input type="password" name="repetir" [(ngModel)]="repetir" autocomplete="new-password" /></label>
                @if (errorClave()) {
                  <p class="error-campo ancho">{{ errorClave() }}</p>
                }
                <div class="ancho botones">
                  <button class="btn btn--tinta" [disabled]="cambiando()">{{ cambiando() ? 'Actualizando…' : 'Actualizar contraseña' }}</button>
                  <button type="button" class="btn btn--texto" (click)="cancelarClave()">Cancelar</button>
                </div>
              </form>
            }
          </div>
        </section>
      </div>
    </div>
  `,
  styles: `
    .quien { display: flex; gap: var(--e4); align-items: center; }
    .inicial {
      display: grid; place-items: center; flex-shrink: 0; width: 56px; height: 56px;
      font-size: 1.75rem; font-weight: 800; font-stretch: 72%; color: #fff; background: var(--tinta); border-radius: 50%;
    }
    .seccion { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 2fr); gap: var(--e6); padding: var(--e6); }
    .seccion + .seccion { border-top: 1px solid var(--rayado); }
    .seccion-titulo h2 { font-size: var(--t-medio); }
    .seccion-titulo p { margin-top: var(--e1); font-size: var(--t-chico); color: var(--texto-2); }
    .campos { display: grid; grid-template-columns: 1fr 1fr; gap: var(--e4); align-content: start; }
    .ancho { grid-column: 1 / -1; }
    .botones { display: flex; flex-wrap: wrap; gap: var(--e2); }
    @media (max-width: 760px) {
      .seccion { grid-template-columns: 1fr; gap: var(--e4); padding: var(--e5) var(--e4); }
      .campos { grid-template-columns: 1fr; }
    }
  `,
})
export class MiCuenta {
  protected readonly auth = inject(AuthService);
  private readonly avisos = inject(AvisosService);

  protected nombre = this.auth.usuario()?.nombre ?? '';
  protected email = this.auth.usuario()?.email ?? '';
  protected telefono = this.auth.usuario()?.telefono ?? '';
  protected actual = '';
  protected nueva = '';
  protected repetir = '';
  protected readonly guardando = signal(false);
  protected readonly cambiando = signal(false);
  protected readonly errorClave = signal('');
  protected readonly intento = signal(false);
  protected readonly editandoClave = signal(false);

  protected emailOk(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email.trim());
  }

  protected celularOk(): boolean {
    return celularValido(this.telefono);
  }

  protected cancelarClave(): void {
    this.actual = this.nueva = this.repetir = '';
    this.errorClave.set('');
    this.editandoClave.set(false);
  }

  protected guardarDatos(): void {
    this.intento.set(true);
    if (this.nombre.trim().length < 3 || !this.emailOk() || !this.celularOk()) {
      this.avisos.error('Revisa los campos marcados en rojo.');
      return;
    }
    this.guardando.set(true);
    this.auth.actualizarPerfil({ nombre: this.nombre.trim(), email: this.email.trim(), telefono: this.telefono.trim() }).subscribe({
      next: () => {
        this.guardando.set(false);
        this.avisos.ok('Tus datos se guardaron.');
      },
      error: (e) => {
        this.guardando.set(false);
        this.avisos.error(mensajeError(e));
      },
    });
  }

  protected cambiarClave(): void {
    this.errorClave.set('');
    if (this.nueva.length < 6) return this.errorClave.set('La nueva contraseña debe tener al menos 6 caracteres.');
    if (this.nueva !== this.repetir) return this.errorClave.set('Las contraseñas nuevas no coinciden.');
    this.cambiando.set(true);
    this.auth.cambiarPassword(this.actual, this.nueva).subscribe({
      next: (r) => {
        this.cambiando.set(false);
        this.cancelarClave();
        this.avisos.ok(r.message);
      },
      error: (e) => {
        this.cambiando.set(false);
        this.errorClave.set(mensajeError(e));
      },
    });
  }
}
