import { Component, OnInit, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { Categoria } from '../../core/modelos';
import { AvisosService } from '../../core/avisos.service';
import { mensajeError } from '../../core/interceptores';
import { Icono } from '../../ui/icono';
import { Pictograma } from '../../ui/pictograma';
import { GestionService } from '../gestion.service';

interface Formulario {
  codigoProducto: string;
  nombreProducto: string;
  principioActivo: string;
  idCategoria: number;
  precioProducto: number | null;
  stock: number;
  ubicacionAnaquel: string;
  estadoProducto: 'Activo' | 'Inactivo';
  requiere_receta: boolean;
  imagenURL: string;
  descripcionProducto: string;
}

@Component({
  selector: 'app-producto-form',
  imports: [FormsModule, RouterLink, Icono, Pictograma],
  template: `
    <div class="pagina pagina--angosta">
      <a routerLink="/gestion/productos" class="volver"><app-icono nombre="izquierda" [tam]="18" /> Productos</a>
      <header class="pagina-cabecera">
        <div>
          <h1>{{ id() ? 'Editar producto' : 'Nuevo producto' }}</h1>
          <p>{{ id() ? 'Los cambios se ven al instante en el catálogo.' : 'Aparecerá en el catálogo si está activo y no requiere receta.' }}</p>
        </div>
      </header>

      @if (cargado()) {
        <form class="hoja formulario" (ngSubmit)="guardar()" novalidate>
          <div class="vista">
            <app-pictograma [categoria]="f.idCategoria" [imagen]="f.imagenURL || null" [tamIcono]="40" />
            <p>Vista previa de la imagen. Si no hay URL, se usa el pictograma de la categoría.</p>
          </div>

          <div class="rejilla">
            <div class="casilla">
              <span class="rotulo">Código</span>
              <output class="codigo cifra" aria-live="polite">{{ codigoMostrado() }}</output>
              <span class="ayuda-campo">{{ ayudaCodigo() }}</span>
            </div>
            <label class="casilla ancho"><span class="rotulo">Nombre y presentación</span><input name="nombre" [(ngModel)]="f.nombreProducto" maxlength="100" placeholder="Panadol 500mg (Caja x 100 tab)" required /></label>
            <label class="casilla ancho"><span class="rotulo">Principio activo (opcional)</span><input name="principio" [(ngModel)]="f.principioActivo" maxlength="100" placeholder="Paracetamol" /></label>
            <label class="casilla">
              <span class="rotulo">Categoría</span>
              <select name="categoria" [(ngModel)]="f.idCategoria" (ngModelChange)="cambiarCategoria($event)">
                @for (c of categorias(); track c.idCategoria) {
                  <option [ngValue]="c.idCategoria">{{ c.nombreCategoria }}</option>
                }
              </select>
            </label>
            <label class="casilla"><span class="rotulo">Precio con IGV (S/)</span><input name="precio" type="number" step="0.01" min="0.01" [(ngModel)]="f.precioProducto" required /></label>
            @if (!id()) {
              <label class="casilla"><span class="rotulo">Stock inicial</span><input name="stock" type="number" min="0" step="1" [(ngModel)]="f.stock" /></label>
            }
            <label class="casilla"><span class="rotulo">Ubicación en anaquel</span><input name="ubicacion" [(ngModel)]="f.ubicacionAnaquel" maxlength="50" placeholder="Estante A-03" /></label>
            <label class="casilla">
              <span class="rotulo">Estado</span>
              <select name="estado" [(ngModel)]="f.estadoProducto">
                <option value="Activo">Activo (se puede reservar)</option>
                <option value="Inactivo">Inactivo (oculto)</option>
              </select>
            </label>
            <label class="casilla ancho"><span class="rotulo">URL de la imagen (opcional)</span><input name="imagen" type="url" [(ngModel)]="f.imagenURL" placeholder="https://…" /></label>
            <label class="casilla ancho"><span class="rotulo">Descripción</span><textarea name="descripcion" [(ngModel)]="f.descripcionProducto" maxlength="2000"></textarea></label>
          </div>

          <label class="receta">
            <input type="checkbox" name="receta" [(ngModel)]="f.requiere_receta" />
            <span><strong>Requiere receta médica</strong><small>No se muestra en el catálogo en línea; se vende solo en tienda.</small></span>
          </label>

          @if (error()) {
            <div class="aviso aviso--error" role="alert"><app-icono nombre="alerta" [tam]="20" /><p>{{ error() }}</p></div>
          }

          <div class="botones">
            <a routerLink="/gestion/productos" class="btn btn--borde">Cancelar</a>
            <button class="btn btn--tinta" [disabled]="guardando()">{{ guardando() ? 'Guardando…' : id() ? 'Guardar cambios' : 'Crear producto' }}</button>
          </div>
        </form>
      } @else {
        <p class="hoja cargando">Cargando…</p>
      }
    </div>
  `,
  styles: `
    .formulario { display: grid; gap: var(--e5); padding: var(--e5); }
    .vista { display: flex; gap: var(--e4); align-items: center; font-size: var(--t-chico); color: var(--texto-2); }
    .vista app-pictograma { --lado: 88px; }
    .rejilla { display: grid; grid-template-columns: 1fr 1fr; gap: var(--e3); }
    .ancho { grid-column: 1 / -1; }
    .receta { display: flex; gap: var(--e3); align-items: flex-start; padding: var(--e3) var(--e4); cursor: pointer; background: var(--velo); border-radius: var(--radio); }
    .receta input { width: 20px; height: 20px; margin-top: 2px; accent-color: var(--tinta); }
    .receta span { display: grid; }
    .receta small { font-size: var(--t-chico); color: var(--texto-2); }
    .botones { display: flex; gap: var(--e3); justify-content: flex-end; }
    /* Código generado: se muestra como una etiqueta, no como un campo editable. */
    .codigo {
      display: flex; align-items: center; min-height: 48px; padding: 0 14px;
      font-size: 1.25rem; font-weight: 800; font-stretch: 72%; color: var(--tinta);
      background: var(--velo); border: 1px dashed var(--rayado-fuerte); border-radius: var(--radio);
    }
    .cargando { padding: var(--e7); text-align: center; color: var(--texto-2); }
    @media (max-width: 640px) { .rejilla { grid-template-columns: 1fr; } .formulario { padding: var(--e4); } }
  `,
})
export class ProductoForm implements OnInit {
  private readonly gestion = inject(GestionService);
  private readonly router = inject(Router);
  private readonly avisos = inject(AvisosService);

  readonly id = input<string>();
  protected readonly categorias = toSignal(this.gestion.categorias().pipe(catchError(() => of([] as Categoria[]))), { initialValue: [] });
  protected readonly cargado = signal(false);
  protected readonly guardando = signal(false);
  protected readonly error = signal('');

  // ---- Código automático: prefijo de la categoría + correlativo (CUI-0004) ----
  private codigoOriginal = '';
  private categoriaOriginal: number | null = null;
  protected readonly codigoNuevo = signal('');

  protected codigoMostrado(): string {
    if (this.id() && this.f.idCategoria === this.categoriaOriginal) return this.codigoOriginal;
    return this.codigoNuevo() || '…';
  }

  protected ayudaCodigo(): string {
    if (!this.id()) return 'Se genera solo según la categoría.';
    if (this.f.idCategoria === this.categoriaOriginal) return 'Cambia solo si eliges otra categoría.';
    return `Al guardar pasará de ${this.codigoOriginal} a ${this.codigoNuevo() || 'un código de la nueva categoría'}.`;
  }

  protected cambiarCategoria(idCategoria: number): void {
    this.codigoNuevo.set('');
    if (!idCategoria || (this.id() && idCategoria === this.categoriaOriginal)) return;
    this.gestion.siguienteCodigo(idCategoria).subscribe({ next: (r) => this.codigoNuevo.set(r.codigo), error: () => undefined });
  }

  protected f: Formulario = {
    codigoProducto: '',
    nombreProducto: '',
    principioActivo: '',
    idCategoria: 1,
    precioProducto: null,
    stock: 0,
    ubicacionAnaquel: '',
    estadoProducto: 'Activo',
    requiere_receta: false,
    imagenURL: '',
    descripcionProducto: '',
  };

  ngOnInit(): void {
    const id = this.id();
    if (!id) {
      this.cambiarCategoria(this.f.idCategoria);
      this.cargado.set(true);
      return;
    }
    this.gestion.producto(id).subscribe({
      next: (p) => {
        this.f = {
          codigoProducto: p.codigoProducto,
          nombreProducto: p.nombreProducto,
          principioActivo: p.principioActivo ?? '',
          idCategoria: p.idCategoria,
          precioProducto: p.precioProducto,
          stock: p.stock,
          ubicacionAnaquel: p.ubicacionAnaquel ?? '',
          estadoProducto: p.estadoProducto ?? 'Activo',
          requiere_receta: !!p.requiere_receta,
          imagenURL: p.imagenURL ?? '',
          descripcionProducto: p.descripcionProducto ?? '',
        };
        this.codigoOriginal = p.codigoProducto;
        this.categoriaOriginal = p.idCategoria;
        this.cargado.set(true);
      },
      error: (e) => {
        this.error.set(mensajeError(e));
        this.cargado.set(true);
      },
    });
  }

  protected guardar(): void {
    this.error.set('');
    if (this.f.nombreProducto.trim().length < 3 || !(Number(this.f.precioProducto) > 0)) {
      this.error.set('Completa el nombre (mínimo 3 letras) y un precio mayor a 0.');
      return;
    }
    this.guardando.set(true);
    const id = this.id() ? Number(this.id()) : undefined;
    const datos = { ...this.f, precioProducto: Number(this.f.precioProducto), requiere_receta: this.f.requiere_receta ? 1 : 0 };
    this.gestion.guardarProducto(datos, id).subscribe({
      next: (p) => {
        this.avisos.ok(`${p.codigoProducto} ${id ? 'actualizado' : 'creado'} correctamente.`);
        this.router.navigateByUrl('/gestion/productos');
      },
      error: (e) => {
        this.guardando.set(false);
        this.error.set(mensajeError(e));
      },
    });
  }
}
