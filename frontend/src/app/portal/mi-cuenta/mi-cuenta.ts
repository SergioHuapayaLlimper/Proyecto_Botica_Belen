import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { AvisosService } from '../../core/avisos.service';
import { mensajeError } from '../../core/interceptores';
import { Icono } from '../../ui/icono';

@Component({
  selector: 'app-mi-cuenta',
  imports: [FormsModule, Icono],
  template: `
    <div class="pagina pagina--angosta">
      <header class="pagina-cabecera">
        <div>
          <h1>Mi cuenta</h1>
          <p>Tus datos para coordinar el recojo de tus reservas.</p>
        </div>
        <button type="button" class="btn btn--borde" (click)="auth.salir()"><app-icono nombre="salir" [tam]="18" /> Cerrar sesión</button>
      </header>

      <div class="columnas">
        <form class="hoja bloque" (ngSubmit)="guardarDatos()">
          <h2>Datos personales</h2>
          <label class="casilla"><span class="rotulo">Nombres y apellidos</span><input name="nombre" [(ngModel)]="nombre" autocomplete="name" /></label>
          <label class="casilla"><span class="rotulo">Correo electrónico</span><input type="email" name="email" [(ngModel)]="email" autocomplete="email" /></label>
          <label class="casilla"><span class="rotulo">Celular</span><input type="tel" name="telefono" [(ngModel)]="telefono" autocomplete="tel" /></label>
          <button class="btn btn--tinta" [disabled]="guardando()">{{ guardando() ? 'Guardando…' : 'Guardar cambios' }}</button>
        </form>

        <form class="hoja bloque" (ngSubmit)="cambiarClave()">
          <h2>Cambiar contraseña</h2>
          <label class="casilla"><span class="rotulo">Contraseña actual</span><input type="password" name="actual" [(ngModel)]="actual" autocomplete="current-password" /></label>
          <label class="casilla"><span class="rotulo">Nueva contraseña</span><input type="password" name="nueva" [(ngModel)]="nueva" autocomplete="new-password" /></label>
          <label class="casilla"><span class="rotulo">Repite la nueva contraseña</span><input type="password" name="repetir" [(ngModel)]="repetir" autocomplete="new-password" /></label>
          @if (errorClave()) {
            <p class="error-campo">{{ errorClave() }}</p>
          }
          <button class="btn btn--borde" [disabled]="cambiando()">{{ cambiando() ? 'Actualizando…' : 'Actualizar contraseña' }}</button>
        </form>
      </div>
    </div>
  `,
  styles: `
    .columnas { display: grid; grid-template-columns: 1fr 1fr; gap: var(--e5); align-items: start; }
    .bloque { display: grid; gap: var(--e3); padding: var(--e5); }
    .bloque h2 { margin-bottom: var(--e2); font-size: var(--t-medio); }
    .bloque .btn { justify-self: start; margin-top: var(--e2); }
    @media (max-width: 760px) { .columnas { grid-template-columns: 1fr; } .bloque { padding: var(--e4); } }
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

  protected guardarDatos(): void {
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
        this.actual = this.nueva = this.repetir = '';
        this.avisos.ok(r.message);
      },
      error: (e) => {
        this.cambiando.set(false);
        this.errorClave.set(mensajeError(e));
      },
    });
  }
}
