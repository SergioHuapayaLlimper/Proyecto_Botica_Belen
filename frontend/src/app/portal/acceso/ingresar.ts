import { Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { mensajeError } from '../../core/interceptores';
import { Icono } from '../../ui/icono';

@Component({
  selector: 'app-ingresar',
  imports: [FormsModule, RouterLink, Icono],
  template: `
    <div class="acceso">
      <section class="panel">
        <header class="encabezado">
          <img src="img/logo-botica-belen-192.png" alt="" width="76" height="76" />
          <h1>Ingresa a tu cuenta</h1>
          <p>Para confirmar reservas y ver su estado.</p>
        </header>

        <form (ngSubmit)="ingresar()" novalidate>
          <label class="casilla">
            <span class="rotulo">Correo electrónico</span>
            <input type="email" name="email" [(ngModel)]="email" autocomplete="email" inputmode="email" required />
          </label>
          <label class="casilla">
            <span class="rotulo">Contraseña</span>
            <span class="con-ojo">
              <input [type]="ver() ? 'text' : 'password'" name="password" [(ngModel)]="password" autocomplete="current-password" required />
              <button type="button" (click)="ver.set(!ver())" [attr.aria-label]="ver() ? 'Ocultar contraseña' : 'Mostrar contraseña'" [attr.aria-pressed]="ver()">
                <app-icono [nombre]="ver() ? 'cerrar' : 'candado'" [tam]="18" />
              </button>
            </span>
          </label>

          @if (error()) {
            <div class="aviso aviso--error" role="alert"><app-icono nombre="alerta" [tam]="20" /><p>{{ error() }}</p></div>
          }

          <button class="btn btn--grande btn--bloque btn--tinta enviar" [disabled]="enviando()">
            {{ enviando() ? 'Ingresando…' : 'Ingresar' }}
          </button>
        </form>

        <p class="cambio">¿No tienes cuenta? <a routerLink="/registro" [queryParams]="{ volver: volver() ?? null }">Crea una aquí</a></p>

        <div class="prueba">
          <p>Cuentas de prueba del proyecto (contraseña <strong>admin123</strong>):</p>
          <ul>
            @for (c of demos; track c.email) {
              <li>
                <button type="button" (click)="usar(c.email)"><strong>{{ c.rol }}</strong> <span>{{ c.email }}</span></button>
              </li>
            }
          </ul>
        </div>
      </section>
    </div>
  `,
  styleUrl: './acceso.scss',
})
export class Ingresar {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  // ?volver=/reserva → regresa a donde estaba.
  readonly volver = input<string>();

  protected email = '';
  protected password = '';
  protected readonly ver = signal(false);
  protected readonly enviando = signal(false);
  protected readonly error = signal('');

  protected readonly demos = [
    { rol: 'Cliente', email: 'juan.perez@gmail.com' },
    { rol: 'Empleado', email: 'empleado1@botica.com' },
    { rol: 'Admin', email: 'admin@botica.com' },
  ];

  protected usar(email: string): void {
    this.email = email;
    this.password = 'admin123';
    this.ingresar();
  }

  protected ingresar(): void {
    if (!this.email.trim() || !this.password) {
      this.error.set('Escribe tu correo y tu contraseña.');
      return;
    }
    this.enviando.set(true);
    this.error.set('');
    this.auth.ingresar(this.email.trim(), this.password).subscribe({
      next: () => {
        const destino = this.auth.esCliente() && this.volver()?.startsWith('/') ? this.volver()! : this.auth.inicioSegunRol();
        this.router.navigateByUrl(destino);
      },
      error: (e) => {
        this.enviando.set(false);
        this.error.set(mensajeError(e));
      },
    });
  }
}
