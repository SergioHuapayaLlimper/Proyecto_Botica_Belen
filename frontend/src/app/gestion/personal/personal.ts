import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Empleado } from '../../core/modelos';
import { aFecha } from '../../core/formato';
import { AuthService } from '../../core/auth.service';
import { AvisosService } from '../../core/avisos.service';
import { mensajeError } from '../../core/interceptores';
import { Icono } from '../../ui/icono';
import { Sello } from '../../ui/sello';
import { GestionService } from '../gestion.service';

interface Ficha {
  nombre: string;
  email: string;
  telefono: string;
  rol: 'Admin' | 'Empleado';
  estado: boolean;
  password: string;
}

const vacia = (): Ficha => ({ nombre: '', email: '', telefono: '', rol: 'Empleado', estado: true, password: '' });

@Component({
  selector: 'app-personal',
  imports: [FormsModule, Icono, Sello],
  template: `
    <div class="pagina">
      <header class="pagina-cabecera">
        <div>
          <h1>Personal</h1>
          <p>Cuentas del equipo de la botica. Reactivar una cuenta también la desbloquea.</p>
        </div>
        @if (!editando()) {
          <button type="button" class="btn btn--tinta" (click)="nuevo()"><app-icono nombre="mas" [tam]="18" /> Agregar persona</button>
        }
      </header>

      <div class="disposicion" [class.con-panel]="editando()">
        <section class="hoja">
          @if (error()) {
            <div class="aviso aviso--error" role="alert"><app-icono nombre="alerta" [tam]="20" /><p>{{ error() }}</p></div>
          }
          <ul class="lista">
            @for (e of lista(); track e.idUsuario) {
              <li [class.elegido]="editandoId() === e.idUsuario">
                <span class="inicial" aria-hidden="true">{{ e.nombre.charAt(0) }}</span>
                <span class="datos">
                  <strong>{{ e.nombre }} @if (e.idUsuario === auth.usuario()?.idUsuario) {<small class="tu">tú</small>}</strong>
                  <small class="cifra">{{ e.email }}{{ e.telefono ? ', tel. ' + e.telefono : '' }}</small>
                </span>
                <app-sello [variante]="e.rol === 'Admin' ? 'tinta' : 'aceptado'" [etiqueta]="e.rol === 'Admin' ? 'Administrador' : 'Empleado'" />
                @if (!e.estado) {
                  <app-sello variante="cancelado" etiqueta="Inactivo" />
                } @else if (e.bloqueado_hasta) {
                  <app-sello variante="pendiente" [etiqueta]="'Bloqueado hasta las ' + horaBloqueo(e.bloqueado_hasta)" />
                }
                <span class="acciones">
                  <button type="button" class="btn btn--chico btn--texto" (click)="editar(e)"><app-icono nombre="editar" [tam]="16" /> Editar</button>
                  @if (e.idUsuario !== auth.usuario()?.idUsuario) {
                    @if (eliminarId() === e.idUsuario) {
                      <button type="button" class="btn btn--chico btn--peligro" (click)="eliminar(e)">Sí, eliminar</button>
                      <button type="button" class="btn btn--chico btn--texto" (click)="eliminarId.set(null)">No</button>
                    } @else {
                      <button type="button" class="btn btn--chico btn--texto quitar" (click)="eliminarId.set(e.idUsuario)" [attr.aria-label]="'Eliminar a ' + e.nombre"><app-icono nombre="papelera" [tam]="16" /></button>
                    }
                  }
                </span>
              </li>
            }
          </ul>
        </section>

        @if (editando()) {
          <form class="hoja panel" (ngSubmit)="guardar()" novalidate>
            <h2>{{ editandoId() ? 'Editar cuenta' : 'Nueva cuenta' }}</h2>
            <label class="casilla"><span class="rotulo">Nombres y apellidos</span><input name="nombre" [(ngModel)]="f.nombre" /></label>
            <label class="casilla"><span class="rotulo">Correo</span><input type="email" name="email" [(ngModel)]="f.email" /></label>
            <label class="casilla"><span class="rotulo">Celular</span><input type="tel" name="telefono" [(ngModel)]="f.telefono" /></label>
            <label class="casilla">
              <span class="rotulo">Rol</span>
              <select name="rol" [(ngModel)]="f.rol">
                <option value="Empleado">Empleado (atiende pedidos)</option>
                <option value="Admin">Administrador (ventas, productos y personal)</option>
              </select>
            </label>
            <label class="casilla">
              <span class="rotulo">{{ editandoId() ? 'Nueva contraseña (opcional)' : 'Contraseña inicial' }}</span>
              <input type="text" name="password" [(ngModel)]="f.password" autocomplete="new-password" placeholder="Mínimo 6 caracteres" />
            </label>
            <label class="activa">
              <input type="checkbox" name="estado" [(ngModel)]="f.estado" />
              <span>Cuenta activa</span>
            </label>
            @if (errorForm()) {
              <p class="error-campo">{{ errorForm() }}</p>
            }
            <div class="botones">
              <button type="button" class="btn btn--borde" (click)="cerrar()">Cancelar</button>
              <button class="btn btn--tinta" [disabled]="guardando()">{{ guardando() ? 'Guardando…' : 'Guardar' }}</button>
            </div>
          </form>
        }
      </div>
    </div>
  `,
  styles: `
    .disposicion { display: grid; gap: var(--e5); align-items: start; }
    .disposicion.con-panel { grid-template-columns: minmax(0, 1fr) 380px; }
    .lista { padding: 0; margin: 0; list-style: none; }
    .lista li { display: flex; flex-wrap: wrap; gap: var(--e3); align-items: center; padding: var(--e4) var(--e5); }
    .lista li + li { border-top: 1px solid var(--rayado); }
    .lista li.elegido { background: var(--velo); }
    .inicial { display: grid; flex-shrink: 0; place-items: center; width: 40px; height: 40px; font-weight: 800; color: #fff; background: var(--tinta); border-radius: 50%; }
    .datos { display: grid; flex: 1; min-width: 180px; }
    .datos small { font-size: var(--t-chico); color: var(--texto-2); }
    .tu { margin-left: var(--e1); padding: 1px 6px; font-size: 0.6875rem; color: var(--azul) !important; border: 1px solid currentColor; border-radius: 4px; }
    .acciones { display: flex; gap: var(--e1); margin-left: auto; }
    .quitar:hover { color: var(--error); }
    .panel { position: sticky; top: var(--e4); display: grid; gap: var(--e3); padding: var(--e5); }
    .panel h2 { margin-bottom: var(--e2); font-size: var(--t-medio); }
    .activa { display: flex; gap: var(--e2); align-items: center; min-height: 40px; font-weight: 600; cursor: pointer; }
    .activa input { width: 20px; height: 20px; accent-color: var(--tinta); }
    .botones { display: flex; gap: var(--e2); justify-content: flex-end; margin-top: var(--e2); }
    @media (max-width: 1020px) { .disposicion.con-panel { grid-template-columns: 1fr; } .panel { position: static; order: -1; } }
  `,
})
export class Personal {
  protected readonly auth = inject(AuthService);
  private readonly gestion = inject(GestionService);
  private readonly avisos = inject(AvisosService);

  protected readonly lista = signal<Empleado[]>([]);
  protected readonly error = signal('');
  protected readonly editando = signal(false);
  protected readonly editandoId = signal<number | null>(null);
  protected readonly eliminarId = signal<number | null>(null);
  protected readonly guardando = signal(false);
  protected readonly errorForm = signal('');

  // RF02: "14:35" a partir de 'AAAA-MM-DD HH:MM:SS'.
  protected horaBloqueo(valor: string): string {
    return aFecha(valor).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  }
  protected f: Ficha = vacia();

  constructor() {
    this.cargar();
  }

  private cargar(): void {
    this.gestion.empleados().subscribe({
      next: (l) => this.lista.set(l),
      error: (e) => this.error.set(mensajeError(e)),
    });
  }

  protected nuevo(): void {
    this.f = vacia();
    this.editandoId.set(null);
    this.errorForm.set('');
    this.editando.set(true);
  }

  protected editar(e: Empleado): void {
    this.f = { nombre: e.nombre, email: e.email, telefono: e.telefono ?? '', rol: e.rol, estado: !!e.estado, password: '' };
    this.editandoId.set(e.idUsuario);
    this.errorForm.set('');
    this.editando.set(true);
  }

  protected cerrar(): void {
    this.editando.set(false);
    this.editandoId.set(null);
  }

  protected guardar(): void {
    const id = this.editandoId();
    if (this.f.nombre.trim().length < 3) return this.errorForm.set('Escribe el nombre completo.');
    if (!id && this.f.password.length < 6) return this.errorForm.set('La contraseña inicial debe tener al menos 6 caracteres.');
    this.guardando.set(true);
    const datos = { ...this.f, estado: this.f.estado ? 1 : 0, password: this.f.password || undefined };
    this.gestion.guardarEmpleado(datos, id ?? undefined).subscribe({
      next: (e) => {
        this.guardando.set(false);
        this.avisos.ok(id ? `Cuenta de ${e.nombre} actualizada.` : `Cuenta de ${e.nombre} creada.`);
        this.cerrar();
        this.cargar();
      },
      error: (e) => {
        this.guardando.set(false);
        this.errorForm.set(mensajeError(e));
      },
    });
  }

  protected eliminar(e: Empleado): void {
    this.gestion.eliminarEmpleado(e.idUsuario).subscribe({
      next: () => {
        this.eliminarId.set(null);
        this.avisos.ok(`Cuenta de ${e.nombre} eliminada.`);
        this.cargar();
      },
      error: (err) => {
        this.eliminarId.set(null);
        this.avisos.error(mensajeError(err));
      },
    });
  }
}
