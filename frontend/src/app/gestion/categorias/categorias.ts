import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Categoria } from '../../core/modelos';
import { AvisosService } from '../../core/avisos.service';
import { mensajeError } from '../../core/interceptores';
import { Icono } from '../../ui/icono';
import { Sello } from '../../ui/sello';
import { GestionService } from '../gestion.service';

interface Ficha {
  nombreCategoria: string;
  prefijo: string;
  activa: boolean;
}

const vacia = (): Ficha => ({ nombreCategoria: '', prefijo: '', activa: true });

// "Cuidado Personal" → "CUI": tres primeras letras, sin tildes.
const sugerirPrefijo = (nombre: string) =>
  nombre
    .normalize('NFD')
    .replace(/[^A-Za-z]/g, '')
    .slice(0, 3)
    .toUpperCase();

@Component({
  selector: 'app-categorias',
  imports: [FormsModule, RouterLink, Icono, Sello],
  template: `
    <div class="pagina">
      <header class="pagina-cabecera">
        <div>
          <h1>Categorías</h1>
          <p>Agrupan el catálogo. El prefijo arma el código de cada producto: CUI-0001, CUI-0002…</p>
        </div>
        @if (!editando()) {
          <button type="button" class="btn btn--tinta" (click)="nuevo()"><app-icono nombre="mas" [tam]="18" /> Nueva categoría</button>
        }
      </header>

      <div class="disposicion" [class.con-panel]="editando()">
        <section class="hoja">
          @if (error()) {
            <div class="aviso aviso--error" role="alert"><app-icono nombre="alerta" [tam]="20" /><p>{{ error() }}</p></div>
          }
          <table class="tabla">
            <thead>
              <tr>
                <th>Prefijo</th>
                <th>Categoría</th>
                <th class="derecha">Productos</th>
                <th><span class="visualmente-oculto">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              @for (c of categorias(); track c.idCategoria) {
                <tr [class.elegida]="editandoId() === c.idCategoria" [class.inactiva]="c.estadoCategoria === 'Inactivo'">
                  <td><span class="prefijo cifra">{{ c.prefijo }}</span></td>
                  <td>
                    <strong>{{ c.nombreCategoria }}</strong>
                    @if (c.estadoCategoria === 'Inactivo') {
                      <app-sello variante="agotado" etiqueta="Inactiva" />
                    }
                  </td>
                  <td class="derecha cifra">
                    @if (c.totalProductos) {
                      <a routerLink="/gestion/productos" [queryParams]="{ categoria: c.idCategoria }">{{ c.totalProductos }}</a>
                    } @else {
                      0
                    }
                  </td>
                  <td class="acciones">
                    @if (eliminarId() === c.idCategoria) {
                      <button type="button" class="btn btn--chico btn--peligro" (click)="eliminar(c)">Sí, eliminar</button>
                      <button type="button" class="btn btn--chico btn--texto" (click)="eliminarId.set(null)">No</button>
                    } @else {
                      <button type="button" class="btn btn--chico btn--texto" (click)="editar(c)"><app-icono nombre="editar" [tam]="16" /> Editar</button>
                      <button type="button" class="btn btn--chico btn--texto quitar" (click)="eliminarId.set(c.idCategoria)" [attr.aria-label]="'Eliminar ' + c.nombreCategoria">
                        <app-icono nombre="papelera" [tam]="16" />
                      </button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </section>

        @if (editando()) {
          <form class="hoja panel" (ngSubmit)="guardar()" novalidate>
            <h2>{{ editandoId() ? 'Editar categoría' : 'Nueva categoría' }}</h2>
            <label class="casilla">
              <span class="rotulo">Nombre</span>
              <input name="nombre" [(ngModel)]="f.nombreCategoria" (ngModelChange)="alEscribirNombre($event)" maxlength="100" placeholder="Por ejemplo, Cuidado Personal" />
            </label>
            <label class="casilla">
              <span class="rotulo">Prefijo del código</span>
              <input name="prefijo" class="cifra" [(ngModel)]="f.prefijo" (ngModelChange)="prefijoTocado = true" maxlength="5" placeholder="CUI" />
              <span class="ayuda-campo">
                De 2 a 5 letras. Ejemplo de código: <strong class="cifra">{{ (f.prefijo || 'XXX').toUpperCase() }}-0001</strong>
              </span>
            </label>
            @if (aviso(); as texto) {
              <div class="aviso aviso--atencion"><app-icono nombre="alerta" [tam]="18" /><p>{{ texto }}</p></div>
            }
            <label class="activa">
              <input type="checkbox" name="activa" [(ngModel)]="f.activa" />
              <span>Activa (se puede elegir al registrar productos)</span>
            </label>
            @if (errorForm()) {
              <p class="error-campo">{{ errorForm() }}</p>
            }
            <div class="botones">
              <button type="button" class="btn btn--borde" (click)="cerrar()">Cancelar</button>
              <button class="btn btn--tinta" [disabled]="guardando()">{{ guardando() ? 'Guardando…' : 'Guardar categoría' }}</button>
            </div>
          </form>
        }
      </div>
    </div>
  `,
  styles: `
    .disposicion { display: grid; gap: var(--e5); align-items: start; }
    .disposicion.con-panel { grid-template-columns: minmax(0, 1fr) 380px; }
    .hoja { overflow: hidden; }
    .tabla td strong { margin-right: var(--e2); }
    .tabla tr.elegida td { background: var(--velo); }
    .tabla tr.inactiva td:not(.acciones) { color: var(--texto-2); }
    .prefijo {
      display: inline-block; min-width: 56px; padding: 3px 8px; font-weight: 800; font-stretch: 72%; text-align: center;
      color: var(--tinta); background: var(--velo); border: 1px solid var(--rayado-fuerte); border-radius: var(--radio-etiqueta);
    }
    .acciones { white-space: nowrap; text-align: right; }
    .quitar:hover { color: var(--error); }
    .panel { position: sticky; top: var(--e4); display: grid; gap: var(--e4); padding: var(--e5); }
    .panel h2 { font-size: var(--t-medio); }
    .panel input[name='prefijo'] { text-transform: uppercase; }
    .activa { display: flex; gap: var(--e2); align-items: center; min-height: 40px; font-weight: 600; cursor: pointer; }
    .activa input { width: 20px; height: 20px; accent-color: var(--tinta); }
    .botones { display: flex; gap: var(--e2); justify-content: flex-end; }
    @media (max-width: 1020px) { .disposicion.con-panel { grid-template-columns: 1fr; } .panel { position: static; order: -1; } }
  `,
})
export class Categorias {
  private readonly gestion = inject(GestionService);
  private readonly avisos = inject(AvisosService);

  protected readonly categorias = signal<Categoria[]>([]);
  protected readonly error = signal('');
  protected readonly editando = signal(false);
  protected readonly editandoId = signal<number | null>(null);
  protected readonly eliminarId = signal<number | null>(null);
  protected readonly guardando = signal(false);
  protected readonly errorForm = signal('');
  protected f: Ficha = vacia();
  protected prefijoTocado = false;
  private original: Categoria | null = null;

  constructor() {
    this.cargar();
  }

  private cargar(): void {
    this.gestion.categorias().subscribe({
      next: (c) => this.categorias.set(c),
      error: (e) => this.error.set(mensajeError(e)),
    });
  }

  // En una categoría nueva el prefijo se sugiere del nombre, hasta que el usuario lo escriba a mano.
  protected alEscribirNombre(nombre: string): void {
    if (!this.editandoId() && !this.prefijoTocado) this.f = { ...this.f, prefijo: sugerirPrefijo(nombre) };
  }

  // Cambiar el prefijo de una categoría con productos renumera sus códigos: se avisa antes de guardar.
  protected aviso(): string {
    const o = this.original;
    const nuevo = this.f.prefijo.trim().toUpperCase();
    if (!o || !o.totalProductos || !nuevo || nuevo === o.prefijo) return '';
    return `Sus ${o.totalProductos} productos cambiarán de código: ${o.prefijo}-0001 pasará a ser ${nuevo}-0001, y así con los demás.`;
  }

  protected nuevo(): void {
    this.f = vacia();
    this.original = null;
    this.prefijoTocado = false;
    this.editandoId.set(null);
    this.errorForm.set('');
    this.editando.set(true);
  }

  protected editar(c: Categoria): void {
    this.f = { nombreCategoria: c.nombreCategoria, prefijo: c.prefijo ?? '', activa: c.estadoCategoria !== 'Inactivo' };
    this.original = c;
    this.prefijoTocado = true;
    this.editandoId.set(c.idCategoria);
    this.errorForm.set('');
    this.editando.set(true);
  }

  protected cerrar(): void {
    this.editando.set(false);
    this.editandoId.set(null);
  }

  protected guardar(): void {
    const id = this.editandoId();
    const nombre = this.f.nombreCategoria.trim();
    const prefijo = this.f.prefijo.trim().toUpperCase();
    if (nombre.length < 3) return this.errorForm.set('El nombre debe tener al menos 3 letras.');
    if (!/^[A-Z]{2,5}$/.test(prefijo)) return this.errorForm.set('El prefijo debe tener de 2 a 5 letras, sin números ni espacios.');
    this.guardando.set(true);
    const datos = { nombreCategoria: nombre, prefijo, estadoCategoria: this.f.activa ? 'Activo' : 'Inactivo' };
    this.gestion.guardarCategoria(datos, id ?? undefined).subscribe({
      next: (c) => {
        this.guardando.set(false);
        this.avisos.ok(id ? `Categoría ${c.nombreCategoria} actualizada.` : `Categoría ${c.nombreCategoria} creada.`);
        this.cerrar();
        this.cargar();
      },
      error: (e) => {
        this.guardando.set(false);
        this.errorForm.set(mensajeError(e));
      },
    });
  }

  protected eliminar(c: Categoria): void {
    this.gestion.eliminarCategoria(c.idCategoria).subscribe({
      next: () => {
        this.eliminarId.set(null);
        this.avisos.ok(`Categoría ${c.nombreCategoria} eliminada.`);
        this.cargar();
      },
      error: (e) => {
        this.eliminarId.set(null);
        this.avisos.error(mensajeError(e));
      },
    });
  }
}
