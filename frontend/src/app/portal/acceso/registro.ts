import { Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { mensajeError } from '../../core/interceptores';
import { Icono } from '../../ui/icono';
import { InfoRecojo } from '../../ui/info-recojo';

// Celular peruano: 9 dígitos que empiezan con 9 (se acepta +51 delante y espacios).
export const celularValido = (valor: string) => /^(\+?51)?9\d{8}$/.test(valor.replace(/[\s-]/g, ''));

@Component({
  selector: 'app-registro',
  imports: [FormsModule, RouterLink, Icono, InfoRecojo],
  template: `
    <div class="acceso">
      <section class="panel">
        <header class="encabezado">
          <h1>Crea tu cuenta</h1>
          <p>Así guardamos tus reservas y te avisamos cuando estén listas.</p>
        </header>

        <form (ngSubmit)="registrar()" novalidate>
          <label class="casilla" [class.casilla--error]="intento() && nombre.trim().length < 3">
            <span class="rotulo">Nombres y apellidos</span>
            <input name="nombre" [(ngModel)]="nombre" autocomplete="name" required />
          </label>
          <div class="dos">
            <label class="casilla" [class.casilla--error]="intento() && !emailValido()">
              <span class="rotulo">Correo electrónico</span>
              <input type="email" name="email" [(ngModel)]="email" autocomplete="email" inputmode="email" required />
            </label>
            <label class="casilla" [class.casilla--error]="intento() && !celularOk()">
              <span class="rotulo">Celular</span>
              <input type="tel" name="telefono" [(ngModel)]="telefono" autocomplete="tel" inputmode="tel" placeholder="987 654 321" maxlength="15" required />
            </label>
          </div>
          @if (intento() && !celularOk()) {
            <p class="error-campo">Escribe un celular de 9 dígitos que empiece con 9. Lo usamos para avisarte del recojo.</p>
          }
          <label class="casilla" [class.casilla--error]="intento() && password.length < 6">
            <span class="rotulo">Contraseña</span>
            <input type="password" name="password" [(ngModel)]="password" autocomplete="new-password" required />
            <span class="ayuda-campo">Mínimo 6 caracteres.</span>
          </label>

          @if (error()) {
            <div class="aviso aviso--error" role="alert"><app-icono nombre="alerta" [tam]="20" /><p>{{ error() }}</p></div>
          }

          <button class="btn btn--grande btn--bloque btn--tinta enviar" [disabled]="enviando()">
            {{ enviando() ? 'Creando tu cuenta…' : 'Crear cuenta' }}
          </button>
        </form>

        <p class="cambio">¿Ya tienes cuenta? <a routerLink="/ingresar" [queryParams]="{ volver: volver() ?? null }">Ingresa</a></p>
      </section>
      <app-info-recojo />
    </div>
  `,
  styleUrl: './acceso.scss',
})
export class Registro {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly volver = input<string>();

  protected nombre = '';
  protected email = '';
  protected telefono = '';
  protected password = '';
  protected readonly intento = signal(false);
  protected readonly enviando = signal(false);
  protected readonly error = signal('');

  protected emailValido(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email.trim());
  }

  protected celularOk(): boolean {
    return celularValido(this.telefono);
  }

  protected registrar(): void {
    this.intento.set(true);
    if (this.nombre.trim().length < 3 || !this.emailValido() || !this.celularOk() || this.password.length < 6) {
      this.error.set('Revisa los campos marcados en rojo.');
      return;
    }
    this.enviando.set(true);
    this.error.set('');
    this.auth.registrar({ nombre: this.nombre.trim(), email: this.email.trim(), telefono: this.telefono.trim(), password: this.password }).subscribe({
      next: () => this.router.navigateByUrl(this.volver()?.startsWith('/') ? this.volver()! : '/productos'),
      error: (e) => {
        this.enviando.set(false);
        this.error.set(mensajeError(e));
      },
    });
  }
}
