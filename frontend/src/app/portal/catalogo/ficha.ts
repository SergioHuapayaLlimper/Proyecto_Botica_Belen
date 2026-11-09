import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Producto } from '../../core/modelos';
import { CarritoService } from '../../core/carrito.service';
import { formatoSoles, separarPresentacion } from '../../core/formato';
import { Icono } from '../../ui/icono';
import { Pictograma } from '../../ui/pictograma';
import { Sello } from '../../ui/sello';

// Ficha de producto: casillas rotuladas (precio y disponibilidad) y el sello "Separado" al reservar.
@Component({
  selector: 'app-ficha',
  imports: [RouterLink, Icono, Pictograma, Sello],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="ficha" [class.agotada]="p().stock === 0">
      <a class="cabeza" [routerLink]="['/producto', p().idProducto]">
        <app-pictograma [categoria]="p().idCategoria" [imagen]="p().imagenURL" [alt]="p().nombreProducto" [tamIcono]="24" [style.view-transition-name]="'producto-' + p().idProducto" />
        <div class="nombre">
          <h3>{{ partes().nombre }}</h3>
          <p class="presentacion">
            @if (partes().presentacion) {
              {{ partes().presentacion }} ·
            }
            {{ p().nombreCategoria }}
          </p>
        </div>
      </a>

      <dl class="casillas">
        <div>
          <dt class="rotulo">Precio</dt>
          <dd class="precio cifra">{{ precio() }}</dd>
        </div>
        <div>
          <dt class="rotulo">Disponibilidad</dt>
          <dd>
            @if (p().stock === 0) {
              <app-sello variante="agotado" etiqueta="Agotado" />
            } @else if (p().stock <= 5) {
              <app-sello variante="pendiente" [etiqueta]="'Quedan ' + p().stock" />
            } @else {
              <app-sello variante="listo" etiqueta="Disponible" />
            }
          </dd>
        </div>
      </dl>

      <div class="accion">
        @if (enReserva() > 0) {
          <div class="paso" role="group" [attr.aria-label]="'Cantidad de ' + p().nombreProducto + ' en tu reserva'">
            <button type="button" (click)="carrito.cambiarCantidad(p().idProducto, enReserva() - 1)" [attr.aria-label]="enReserva() === 1 ? 'Quitar de tu reserva' : 'Una unidad menos'">
              <app-icono [nombre]="enReserva() === 1 ? 'papelera' : 'menos'" [tam]="18" />
            </button>
            <span class="cifra"><strong>{{ enReserva() }}</strong> en tu reserva</span>
            <button type="button" (click)="carrito.separar(p())" [disabled]="enReserva() >= p().stock" aria-label="Una unidad más">
              <app-icono nombre="mas" [tam]="18" />
            </button>
          </div>
        } @else {
          <button type="button" class="btn btn--bloque separar" [disabled]="p().stock === 0" (click)="carrito.separar(p())">
            @if (p().stock === 0) {
              Sin stock por ahora
            } @else {
              <app-icono nombre="reserva" [tam]="20" /> Separar
            }
          </button>
        }
      </div>

      @if (sellado()) {
        <div class="sello-encima" aria-hidden="true"><app-sello variante="rojo" etiqueta="Separado" [grande]="true" [cae]="true" /></div>
      }
    </article>
  `,
  styleUrl: './ficha.scss',
})
export class Ficha {
  protected readonly carrito = inject(CarritoService);
  readonly p = input.required<Producto>({ alias: 'producto' });

  protected readonly partes = computed(() => separarPresentacion(this.p().nombreProducto));
  protected readonly precio = computed(() => formatoSoles(this.p().precioProducto));
  protected readonly enReserva = computed(() => this.carrito.cantidadDe(this.p().idProducto));
  protected readonly sellado = computed(() => this.carrito.ultimoSeparado()?.idProducto === this.p().idProducto);
}
