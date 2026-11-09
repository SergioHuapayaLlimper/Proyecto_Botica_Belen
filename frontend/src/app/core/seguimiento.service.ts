import { DestroyRef, Injectable, effect, inject, signal, untracked } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API, EstadoPedido, PedidoResumen } from './modelos';
import { AuthService } from './auth.service';
import { AvisosService } from './avisos.service';

const CADA_MS = 15000;

// Mensaje para el cliente según el nuevo estado de su reserva.
function mensaje(codigo: string, estado: EstadoPedido): { texto: string; tipo: 'ok' | 'error' | 'info' } {
  switch (estado) {
    case 'Aceptado':
      return { texto: `Aceptamos tu reserva ${codigo}. Ya la estamos separando.`, tipo: 'info' };
    case 'En preparación':
      return { texto: `Estamos preparando tu reserva ${codigo}.`, tipo: 'info' };
    case 'Listo para entregar':
      return { texto: `Tu reserva ${codigo} está lista. Ya puedes pasar a recogerla.`, tipo: 'ok' };
    case 'Entregado':
      return { texto: `Entregamos tu reserva ${codigo}. Gracias por tu compra.`, tipo: 'ok' };
    case 'Rechazado':
      return { texto: `No pudimos atender tu reserva ${codigo}. Revisa el motivo en el detalle.`, tipo: 'error' };
    case 'Cancelado':
      return { texto: `Tu reserva ${codigo} fue cancelada. Revisa el motivo en el detalle.`, tipo: 'error' };
    default:
      return { texto: `Tu reserva ${codigo} cambió a «${estado}».`, tipo: 'info' };
  }
}

/**
 * RF10 / RF15: seguimiento en tiempo (casi) real de las reservas del cliente.
 * - Mientras hay un cliente con sesión, consulta sus reservas cada 15 s (y al volver a la pestaña).
 * - Si una reserva cambió de estado, muestra un aviso y sube `version` para que las páginas recarguen.
 * - Los últimos estados vistos se guardan en el navegador: si el cambio pasó mientras no estaba,
 *   el aviso aparece apenas vuelve a entrar.
 */
@Injectable({ providedIn: 'root' })
export class SeguimientoService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly avisos = inject(AvisosService);

  /** Sube cada vez que alguna reserva cambia de estado. */
  readonly version = signal(0);

  private idUsuario: number | null = null;
  private vistos: Record<number, EstadoPedido> = {}; // último estado visto de cada reserva
  private conocido = false; // false = aún no hay con qué comparar (no se avisa nada)
  private temporizador: ReturnType<typeof setInterval> | undefined;
  private tituloOriginal = '';
  private sinLeer = 0;
  private readonly alVolver = () => {
    if (document.visibilityState !== 'visible') return;
    this.limpiarTitulo();
    this.consultar();
  };

  constructor() {
    effect(() => {
      const usuario = this.auth.usuario();
      untracked(() => (usuario?.rol === 'Cliente' ? this.iniciar(usuario.idUsuario) : this.detener()));
    });
    inject(DestroyRef).onDestroy(() => this.detener());
  }

  /** Para cambios que hizo el propio cliente (por ejemplo, cancelar): no se le avisa de su propia acción. */
  marcar(idPedido: number, estado: EstadoPedido): void {
    this.vistos[idPedido] = estado;
    this.guardar();
  }

  private iniciar(idUsuario: number): void {
    if (this.idUsuario === idUsuario) return;
    this.detener();
    this.idUsuario = idUsuario;
    this.vistos = this.leer();
    this.conocido = Object.keys(this.vistos).length > 0;
    this.consultar();
    this.temporizador = setInterval(() => this.consultar(), CADA_MS);
    document.addEventListener('visibilitychange', this.alVolver);
  }

  private detener(): void {
    clearInterval(this.temporizador);
    document.removeEventListener('visibilitychange', this.alVolver);
    this.limpiarTitulo();
    this.idUsuario = null;
  }

  private consultar(): void {
    if (this.idUsuario === null) return;
    this.http.get<PedidoResumen[]>(`${API}/pedidos/mios`).subscribe({
      next: (lista) => this.comparar(lista),
      error: () => undefined, // sin conexión: se reintenta en la siguiente vuelta
    });
  }

  private comparar(lista: PedidoResumen[]): void {
    let cambios = 0;
    for (const p of lista) {
      const antes = this.vistos[p.idPedido];
      if (this.conocido && antes && antes !== p.estadoPedido) {
        const { texto, tipo } = mensaje(p.codigoPedido, p.estadoPedido);
        this.avisos.mostrar(texto, tipo, 9000);
        cambios++;
      }
      this.vistos[p.idPedido] = p.estadoPedido;
    }
    this.conocido = true;
    this.guardar();
    if (cambios > 0) {
      this.version.update((v) => v + 1);
      if (document.visibilityState === 'hidden') this.marcarTitulo(cambios);
    }
  }

  // Pestaña en segundo plano: "(1) Mis reservas – Botica Belén" hasta que el cliente vuelva.
  private marcarTitulo(cambios: number): void {
    if (!this.sinLeer) this.tituloOriginal = document.title;
    this.sinLeer += cambios;
    document.title = `(${this.sinLeer}) ${this.tituloOriginal}`;
  }

  private limpiarTitulo(): void {
    if (!this.sinLeer) return;
    document.title = this.tituloOriginal;
    this.sinLeer = 0;
  }

  private clave(): string {
    return `botica.estadosReservas.${this.idUsuario}`;
  }

  private leer(): Record<number, EstadoPedido> {
    try {
      return JSON.parse(localStorage.getItem(this.clave()) ?? '{}') as Record<number, EstadoPedido>;
    } catch {
      return {};
    }
  }

  private guardar(): void {
    try {
      localStorage.setItem(this.clave(), JSON.stringify(this.vistos));
    } catch {
      /* sin almacenamiento: los avisos funcionan igual mientras la página esté abierta */
    }
  }
}
