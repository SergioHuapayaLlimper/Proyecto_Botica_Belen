import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input, signal } from '@angular/core';
import { EstadoPedido, Pedido } from '../core/modelos';
import { NegocioService } from '../core/negocio.service';
import { MENSAJE_CLIENTE, formatoFecha, formatoSoles, separarPresentacion } from '../core/formato';
import { Icono } from './icono';
import { Sello } from './sello';

const CORTA: Partial<Record<EstadoPedido, string>> = {
  Pendiente: 'Recibida',
  Aceptado: 'Aceptada',
  'En preparación': 'Preparando',
  'Listo para entregar': 'Lista',
  Entregado: 'Entregada',
};

// Recorrido de toda reserva: se recoge en tienda.
const RECORRIDO: EstadoPedido[] = ['Pendiente', 'Aceptado', 'En preparación', 'Listo para entregar', 'Entregado'];

// Tarjeta de control de una reserva: el estado como sello y cada etapa en su casilla fija.
@Component({
  selector: 'app-tarjeta-control',
  imports: [Icono, Sello],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tarjeta-control.html',
  styleUrl: './tarjeta-control.scss',
})
export class TarjetaControl {
  readonly pedido = input.required<Pedido>();
  readonly recienCreada = input(false);
  readonly vistaPersonal = input(false);

  protected readonly negocio = inject(NegocioService);
  protected readonly soles = formatoSoles;
  protected readonly fecha = formatoFecha;
  protected readonly partes = separarPresentacion;

  protected readonly anulada = computed(() => this.pedido().estadoPedido === 'Cancelado' || this.pedido().estadoPedido === 'Rechazado');
  protected readonly mensaje = computed(() => MENSAJE_CLIENTE[this.pedido().estadoPedido]);

  // Etapas del recorrido, cada una en su casilla fija.
  protected readonly etapas = computed<{ estado: EstadoPedido; etiqueta: string; corta: string; marcada: boolean; actual: boolean }[]>(() => {
    const indice = RECORRIDO.indexOf(this.pedido().estadoPedido);
    return RECORRIDO.map((estado, i) => ({
      estado,
      etiqueta: estado === 'Listo para entregar' ? 'Listo para recoger' : estado,
      // Texto corto para que todos los sellos midan lo mismo.
      corta: CORTA[estado] ?? estado,
      marcada: indice >= 0 && i <= indice,
      actual: i === indice,
    }));
  });

  protected readonly observaciones = computed(() => (this.pedido().observaciones ?? '').split('\n').filter((l) => l.trim()));
  protected readonly unidades = computed(() => this.pedido().detalles.reduce((n, d) => n + d.cantidad, 0));

  // En el celular la columna "P. unit." no cabe: el precio unitario baja bajo el nombre.
  private readonly consulta = typeof matchMedia === 'function' ? matchMedia('(max-width: 520px)') : null;
  protected readonly angosto = signal(this.consulta?.matches ?? false);

  constructor() {
    const alCambiar = (e: MediaQueryListEvent) => this.angosto.set(e.matches);
    this.consulta?.addEventListener('change', alCambiar);
    inject(DestroyRef).onDestroy(() => this.consulta?.removeEventListener('change', alCambiar));
  }
}
