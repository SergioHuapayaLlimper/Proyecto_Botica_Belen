import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Permiso, PermisoInfo, RolPersonal } from '../../core/modelos';
import { formatoFecha } from '../../core/formato';
import { AvisosService } from '../../core/avisos.service';
import { mensajeError } from '../../core/interceptores';
import { Icono } from '../../ui/icono';
import { Sello } from '../../ui/sello';
import { GestionService } from '../gestion.service';

interface Ficha {
  nombre: string;
  descripcion: string;
  permisos: Set<Permiso>;
}

const vacia = (): Ficha => ({ nombre: '', descripcion: '', permisos: new Set<Permiso>() });

// Un permiso que necesita a otro para tener sentido (mismas reglas que el backend).
const REQUIERE: Partial<Record<Permiso, Permiso>> = { pedidos_estado: 'pedidos', productos_editar: 'productos' };

@Component({
  selector: 'app-roles',
  imports: [FormsModule, RouterLink, Icono, Sello],
  template: `
    <div class="pagina">
      <header class="pagina-cabecera">
        <div>
          <h1>Roles</h1>
          <p>Qué secciones del panel puede usar cada persona del equipo. Las cuentas se asignan en <a routerLink="/gestion/personal">Personal</a>.</p>
        </div>
        @if (!editando()) {
          <button type="button" class="btn btn--tinta" (click)="nuevo()"><app-icono nombre="mas" [tam]="18" /> Nuevo rol</button>
        }
      </header>

      <div class="disposicion" [class.con-panel]="editando()">
        <section class="hoja">
          @if (error()) {
            <div class="aviso aviso--error" role="alert"><app-icono nombre="alerta" [tam]="20" /><p>{{ error() }}</p></div>
          }
          <ul class="lista">
            @for (r of roles(); track r.idRol) {
              <li [class.elegido]="editandoId() === r.idRol">
                <div class="cabeza">
                  <div class="titulo">
                    <h2>{{ r.nombre }}</h2>
                    @if (r.esSistema) {
                      <app-sello variante="tinta" etiqueta="Del sistema" />
                    }
                  </div>
                  <span class="acciones">
                    @if (r.esSistema) {
                      <small class="fijo"><app-icono nombre="candado" [tam]="14" /> No se puede modificar</small>
                    } @else if (eliminarId() === r.idRol) {
                      <button type="button" class="btn btn--chico btn--peligro" (click)="eliminar(r)">Sí, eliminar</button>
                      <button type="button" class="btn btn--chico btn--texto" (click)="eliminarId.set(null)">No</button>
                    } @else {
                      <button type="button" class="btn btn--chico btn--texto" (click)="editar(r)"><app-icono nombre="editar" [tam]="16" /> Editar</button>
                      <button type="button" class="btn btn--chico btn--texto quitar" (click)="eliminarId.set(r.idRol)" [attr.aria-label]="'Eliminar el rol ' + r.nombre">
                        <app-icono nombre="papelera" [tam]="16" />
                      </button>
                    }
                  </span>
                </div>
                <p class="meta">
                  {{ r.totalUsuarios === 1 ? '1 cuenta' : r.totalUsuarios + ' cuentas' }} con este rol{{ r.creadoEn ? ', creado el ' + fecha(r.creadoEn) : '' }}.
                </p>
                @if (r.descripcion) {
                  <p class="descripcion">{{ r.descripcion }}</p>
                }
                <ul class="permisos" [attr.aria-label]="'Permisos de ' + r.nombre">
                  @for (p of r.permisos; track p) {
                    <li>{{ nombrePermiso(p) }}</li>
                  }
                </ul>
              </li>
            }
          </ul>
        </section>

        @if (editando()) {
          <form class="hoja panel" (ngSubmit)="guardar()" novalidate>
            <h2>{{ editandoId() ? 'Editar rol' : 'Nuevo rol' }}</h2>
            <label class="casilla">
              <span class="rotulo">Nombre</span>
              <input name="nombre" [(ngModel)]="f.nombre" maxlength="40" placeholder="Por ejemplo, Cajero" />
            </label>
            <label class="casilla">
              <span class="rotulo">Descripción (opcional)</span>
              <textarea name="descripcion" [(ngModel)]="f.descripcion" maxlength="150" placeholder="Qué hace este rol en la botica"></textarea>
            </label>

            <fieldset class="elegir">
              <legend class="rotulo">Permisos</legend>
              @for (p of catalogo(); track p.clave) {
                <label class="permiso" [class.marcado]="f.permisos.has(p.clave)">
                  <input type="checkbox" [checked]="f.permisos.has(p.clave)" (change)="alternar(p.clave, $any($event.target).checked)" />
                  <span>
                    <strong>{{ p.nombre }}</strong>
                    <small>{{ p.descripcion }}</small>
                  </span>
                </label>
              }
            </fieldset>

            @if (errorForm()) {
              <p class="error-campo">{{ errorForm() }}</p>
            }
            <div class="botones">
              <button type="button" class="btn btn--borde" (click)="cerrar()">Cancelar</button>
              <button class="btn btn--tinta" [disabled]="guardando()">{{ guardando() ? 'Guardando…' : 'Guardar rol' }}</button>
            </div>
          </form>
        }
      </div>
    </div>
  `,
  styles: `
    .disposicion { display: grid; gap: var(--e5); align-items: start; }
    .disposicion.con-panel { grid-template-columns: minmax(0, 1fr) 420px; }
    .lista { padding: 0; margin: 0; list-style: none; }
    .lista > li { display: grid; gap: var(--e2); padding: var(--e5); }
    .lista > li + li { border-top: 1px solid var(--rayado); }
    .lista > li.elegido { background: var(--velo); }
    .cabeza { display: flex; flex-wrap: wrap; gap: var(--e3); align-items: center; justify-content: space-between; }
    .titulo { display: flex; flex-wrap: wrap; gap: var(--e3); align-items: center; }
    .titulo h2 { font-size: 1.625rem; line-height: 1; }
    .acciones { display: flex; gap: var(--e1); align-items: center; }
    .fijo { display: inline-flex; gap: 4px; align-items: center; font-size: var(--t-chico); color: var(--texto-2); }
    .quitar:hover { color: var(--error); }
    .meta { font-size: var(--t-chico); color: var(--texto-2); }
    .descripcion { max-width: 70ch; }
    .permisos { display: flex; flex-wrap: wrap; gap: 6px; padding: 0; margin: var(--e1) 0 0; list-style: none; }
    .permisos li {
      padding: 3px 10px; font-size: var(--t-chico); font-weight: 600; color: var(--tinta);
      background: var(--velo); border: 1px solid var(--rayado); border-radius: var(--radio-etiqueta);
    }
    .panel { position: sticky; top: var(--e4); display: grid; gap: var(--e4); padding: var(--e5); }
    .panel h2 { font-size: var(--t-medio); }
    .elegir { display: grid; gap: var(--e2); padding: 0; margin: 0; border: 0; }
    .elegir legend { margin-bottom: var(--e2); padding: 0; font-weight: 600; color: var(--texto); }
    .permiso {
      display: grid; grid-template-columns: 20px 1fr; gap: var(--e3); align-items: start;
      padding: var(--e3); cursor: pointer; border: 1px solid var(--rayado); border-radius: var(--radio);
      transition: border-color 140ms var(--sale), background-color 140ms var(--sale);
    }
    .permiso:hover { border-color: var(--rayado-fuerte); }
    .permiso.marcado { background: var(--velo); border-color: var(--tinta); }
    .permiso input { width: 18px; height: 18px; margin-top: 2px; accent-color: var(--tinta); }
    .permiso span { display: grid; gap: 2px; }
    .permiso small { font-size: var(--t-chico); color: var(--texto-2); }
    .botones { display: flex; gap: var(--e2); justify-content: flex-end; }
    @media (max-width: 1080px) { .disposicion.con-panel { grid-template-columns: 1fr; } .panel { position: static; order: -1; } }
  `,
})
export class Roles {
  private readonly gestion = inject(GestionService);
  private readonly avisos = inject(AvisosService);

  protected readonly roles = signal<RolPersonal[]>([]);
  protected readonly catalogo = signal<PermisoInfo[]>([]);
  protected readonly error = signal('');
  protected readonly editando = signal(false);
  protected readonly editandoId = signal<number | null>(null);
  protected readonly eliminarId = signal<number | null>(null);
  protected readonly guardando = signal(false);
  protected readonly errorForm = signal('');
  protected f: Ficha = vacia();

  private readonly nombres = computed(() => new Map(this.catalogo().map((p) => [p.clave, p.nombre])));
  protected readonly fecha = (valor: string) => formatoFecha(valor, false);

  constructor() {
    this.gestion.catalogoPermisos().subscribe({ next: (c) => this.catalogo.set(c), error: (e) => this.error.set(mensajeError(e)) });
    this.cargar();
  }

  protected nombrePermiso(clave: Permiso): string {
    return this.nombres().get(clave) ?? clave;
  }

  private cargar(): void {
    this.gestion.roles().subscribe({
      next: (r) => this.roles.set(r),
      error: (e) => this.error.set(mensajeError(e)),
    });
  }

  protected alternar(clave: Permiso, marcado: boolean): void {
    const permisos = new Set(this.f.permisos);
    if (marcado) {
      permisos.add(clave);
      const necesario = REQUIERE[clave];
      if (necesario) permisos.add(necesario);
    } else {
      permisos.delete(clave);
      // Si se quita "ver", también se quita la acción que depende de él.
      for (const [accion, base] of Object.entries(REQUIERE)) if (base === clave) permisos.delete(accion as Permiso);
    }
    this.f = { ...this.f, permisos };
  }

  protected nuevo(): void {
    this.f = vacia();
    this.editandoId.set(null);
    this.errorForm.set('');
    this.editando.set(true);
  }

  protected editar(r: RolPersonal): void {
    this.f = { nombre: r.nombre, descripcion: r.descripcion ?? '', permisos: new Set(r.permisos) };
    this.editandoId.set(r.idRol);
    this.errorForm.set('');
    this.editando.set(true);
  }

  protected cerrar(): void {
    this.editando.set(false);
    this.editandoId.set(null);
  }

  protected guardar(): void {
    const id = this.editandoId();
    const nombre = this.f.nombre.trim();
    if (nombre.length < 3) return this.errorForm.set('El nombre del rol debe tener al menos 3 letras.');
    if (!this.f.permisos.size) return this.errorForm.set('Marca al menos un permiso.');
    this.guardando.set(true);
    const datos = { nombre, descripcion: this.f.descripcion.trim(), permisos: [...this.f.permisos] };
    this.gestion.guardarRol(datos, id ?? undefined).subscribe({
      next: (r) => {
        this.guardando.set(false);
        this.avisos.ok(id ? `Rol ${r.nombre} actualizado.` : `Rol ${r.nombre} creado.`);
        this.cerrar();
        this.cargar();
      },
      error: (e) => {
        this.guardando.set(false);
        this.errorForm.set(mensajeError(e));
      },
    });
  }

  protected eliminar(r: RolPersonal): void {
    this.gestion.eliminarRol(r.idRol).subscribe({
      next: () => {
        this.eliminarId.set(null);
        this.avisos.ok(`Rol ${r.nombre} eliminado.`);
        this.cargar();
      },
      error: (e) => {
        this.eliminarId.set(null);
        this.avisos.error(mensajeError(e));
      },
    });
  }
}
