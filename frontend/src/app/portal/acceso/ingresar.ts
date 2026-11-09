import { Component, DestroyRef, inject, input, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
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

          @if (bloqueado()) {
            <div class="aviso aviso--error bloqueo" role="alert">
              <app-icono nombre="candado" [tam]="20" />
              <p>
                Cuenta bloqueada por superar los 5 intentos permitidos.
                Podrás intentarlo de nuevo en <strong class="cifra">{{ reloj(restante()) }}</strong>.
              </p>
            </div>
          } @else if (error()) {
            <div class="aviso aviso--error" role="alert"><app-icono nombre="alerta" [tam]="20" /><p>{{ error() }}</p></div>
          }

          <button class="btn btn--grande btn--bloque btn--tinta enviar" [disabled]="enviando() || bloqueado()">
            @if (bloqueado()) {
              <app-icono nombre="candado" [tam]="18" /> Bloqueado ({{ reloj(restante()) }})
            } @else {
              {{ enviando() ? 'Ingresando…' : 'Ingresar' }}
            }
          </button>
        </form>

        <p class="cambio">¿No tienes cuenta? <a routerLink="/registro" [queryParams]="{ volver: volver() ?? null }">Crea una aquí</a></p>
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

  // ---- RF02: bloqueo temporal con cuenta regresiva ----
  // Se recuerda en el navegador para que el contador siga aunque se recargue la página.
  private static readonly CLAVE_BLOQUEO = 'botica.bloqueoLogin';
  protected readonly restante = signal(0); // segundos que faltan
  private bloqueoEmail = '';
  private bloqueoFin = 0;
  private temporizador: ReturnType<typeof setInterval> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearInterval(this.temporizador));
    try {
      const guardado = JSON.parse(localStorage.getItem(Ingresar.CLAVE_BLOQUEO) ?? 'null') as { email: string; fin: number } | null;
      if (guardado && guardado.fin > Date.now()) {
        this.email = guardado.email;
        this.iniciarBloqueo(guardado.email, Math.ceil((guardado.fin - Date.now()) / 1000));
      }
    } catch {
      /* sin almacenamiento disponible: el servidor igual mantiene el bloqueo */
    }
  }

  /** El bloqueo es de UNA cuenta: si se escribe otro correo, se puede intentar. */
  protected bloqueado(): boolean {
    return this.restante() > 0 && this.email.trim().toLowerCase() === this.bloqueoEmail;
  }

  /** 299 -> "4:59" */
  protected reloj(segundos: number): string {
    return `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, '0')}`;
  }

  private iniciarBloqueo(email: string, segundos: number): void {
    clearInterval(this.temporizador);
    this.bloqueoEmail = email.trim().toLowerCase();
    this.bloqueoFin = Date.now() + segundos * 1000;
    try {
      localStorage.setItem(Ingresar.CLAVE_BLOQUEO, JSON.stringify({ email: this.bloqueoEmail, fin: this.bloqueoFin }));
    } catch {
      /* opcional */
    }
    const actualizar = () => {
      const quedan = Math.max(0, Math.ceil((this.bloqueoFin - Date.now()) / 1000));
      this.restante.set(quedan);
      if (quedan === 0) this.terminarBloqueo();
    };
    actualizar();
    this.temporizador = setInterval(actualizar, 1000);
  }

  private terminarBloqueo(): void {
    clearInterval(this.temporizador);
    this.restante.set(0);
    this.error.set('');
    try {
      localStorage.removeItem(Ingresar.CLAVE_BLOQUEO);
    } catch {
      /* opcional */
    }
  }

  protected ingresar(): void {
    if (this.bloqueado()) return;
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
        const segundos = e instanceof HttpErrorResponse && e.status === 423 ? Number(e.error?.segundosRestantes) : 0;
        if (segundos > 0) {
          this.password = '';
          this.iniciarBloqueo(this.email, segundos);
          return;
        }
        this.error.set(mensajeError(e));
      },
    });
  }
}
