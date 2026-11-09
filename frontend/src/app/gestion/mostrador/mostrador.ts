import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { EstadoPedido, LineaPreparar, PedidoResumen } from '../../core/modelos';
import { AuthService } from '../../core/auth.service';
import { AvisosService } from '../../core/avisos.service';
import { mensajeError } from '../../core/interceptores';
import { ACCION_ESTADO, formatoFecha, formatoSoles, haceCuanto, separarPresentacion } from '../../core/formato';
import { Icono } from '../../ui/icono';
import { Sello } from '../../ui/sello';
import { GestionService } from '../gestion.service';

interface GrupoEstante {
  estante: string;
  lineas: LineaPreparar[];
}

// Siguiente paso "normal" de un pedido en curso (lo demás se hace desde su detalle).
const SIGUIENTE: Partial<Record<EstadoPedido, EstadoPedido>> = {
  Aceptado: 'En preparación',
  'En preparación': 'Listo para entregar',
  'Listo para entregar': 'Entregado',
};

@Component({
  selector: 'app-mostrador',
  imports: [RouterLink, Icono, Sello],
  templateUrl: './mostrador.html',
  styleUrl: './mostrador.scss',
})
export class Mostrador {
  protected readonly auth = inject(AuthService);
  private readonly gestion = inject(GestionService);
  private readonly avisos = inject(AvisosService);

  protected readonly nuevas = signal<PedidoResumen[]>([]);
  protected readonly enCurso = signal<PedidoResumen[]>([]);
  protected readonly lineas = signal<LineaPreparar[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal('');
  protected readonly ocupado = signal<number | null>(null);
  protected readonly motivoPara = signal<{ idPedido: number; estado: EstadoPedido } | null>(null);
  protected motivo = '';
  protected readonly marcando = signal<number | null>(null); // idDetallePedido que se está guardando
  private idsConocidos = new Set<number>();
  protected readonly recienLlegadas = signal<Set<number>>(new Set());

  protected readonly soles = formatoSoles;
  protected readonly hace = haceCuanto;
  protected readonly fecha = formatoFecha;
  protected readonly partes = separarPresentacion;
  protected readonly accion = ACCION_ESTADO;
  protected readonly hoy = new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });

  protected readonly puedeActuar = computed(() => this.auth.puede('pedidos_estado'));

  protected readonly grupos = computed<GrupoEstante[]>(() => {
    const mapa = new Map<string, LineaPreparar[]>();
    for (const l of this.lineas()) {
      const clave = l.ubicacionAnaquel || 'Sin ubicación';
      mapa.set(clave, [...(mapa.get(clave) ?? []), l]);
    }
    return [...mapa.entries()].map(([estante, lineas]) => ({ estante, lineas }));
  });

  protected readonly porRecoger = computed(() => this.lineas().filter((l) => !l.preparado).length);

  // Productos sin separar de cada pedido: mientras haya alguno, no se puede marcar como listo.
  protected readonly faltan = computed(() => {
    const mapa = new Map<number, number>();
    for (const l of this.lineas()) if (!l.preparado) mapa.set(l.idPedido, (mapa.get(l.idPedido) ?? 0) + 1);
    return mapa;
  });

  protected faltanDe(p: PedidoResumen): number {
    return this.faltan().get(p.idPedido) ?? 0;
  }

  constructor() {
    // Recarga cuando llega una reserva nueva o después de cada acción.
    effect(() => {
      this.gestion.cambios();
      untracked(() => this.cargar());
    });
  }

  protected cargar(): void {
    forkJoin([this.gestion.pedidos({ estado: 'Pendiente' }), this.gestion.pedidos({ estado: 'activos' }), this.gestion.preparar()]).subscribe({
      next: ([nuevas, activos, lineas]) => {
        const llegadas = new Set(nuevas.filter((p) => this.idsConocidos.size && !this.idsConocidos.has(p.idPedido)).map((p) => p.idPedido));
        nuevas.forEach((p) => this.idsConocidos.add(p.idPedido));
        this.recienLlegadas.set(llegadas);
        this.nuevas.set([...nuevas].sort((a, b) => a.fechaHoraToma.localeCompare(b.fechaHoraToma)));
        this.enCurso.set(activos.filter((p) => p.estadoPedido !== 'Pendiente'));
        this.lineas.set(lineas);
        this.cargando.set(false);
        this.error.set('');
      },
      error: (e) => {
        this.cargando.set(false);
        this.error.set(mensajeError(e));
      },
    });
  }

  protected siguiente(p: PedidoResumen): EstadoPedido | null {
    return SIGUIENTE[p.estadoPedido] ?? null;
  }

  protected avanzar(p: PedidoResumen, estado: EstadoPedido, motivo = ''): void {
    this.ocupado.set(p.idPedido);
    this.gestion.cambiarEstado(p.idPedido, estado, motivo).subscribe({
      next: () => {
        this.ocupado.set(null);
        this.motivoPara.set(null);
        this.motivo = '';
        this.avisos.ok(`${p.codigoPedido}: ${estado.toLowerCase()}.`);
        this.gestion.refrescar();
      },
      error: (e) => {
        this.ocupado.set(null);
        this.avisos.error(mensajeError(e));
      },
    });
  }

  protected pedirMotivo(p: PedidoResumen, estado: EstadoPedido): void {
    this.motivo = '';
    this.motivoPara.set({ idPedido: p.idPedido, estado });
  }

  protected clave(l: LineaPreparar): string {
    return `${l.idPedido}-${l.idProducto}`;
  }

  // Se guarda en la BD (no solo en el navegador): así otro empleado ve el mismo avance.
  protected alternarRecogido(l: LineaPreparar): void {
    const preparado = !l.preparado;
    const cambiar = (valor: boolean) =>
      this.lineas.update((ls) => ls.map((x) => (x.idDetallePedido === l.idDetallePedido ? { ...x, preparado: valor } : x)));
    cambiar(preparado);
    this.marcando.set(l.idDetallePedido);
    this.gestion.marcarPreparado(l.idPedido, l.idDetallePedido, preparado).subscribe({
      next: (pedido) => {
        this.marcando.set(null);
        // Marcar el primer producto de un pedido aceptado lo pasa a "En preparación".
        if (pedido.estadoPedido !== l.estadoPedido) this.gestion.refrescar();
      },
      error: (e) => {
        cambiar(!preparado);
        this.marcando.set(null);
        this.avisos.error(mensajeError(e));
      },
    });
  }
}
