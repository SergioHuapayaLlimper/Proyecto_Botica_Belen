import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Dashboard, EstadoPedido } from '../../core/modelos';
import { formatoSoles, separarPresentacion } from '../../core/formato';
import { mensajeError } from '../../core/interceptores';
import { Barra, BarrasH, BarrasV } from '../../ui/barras';
import { Icono } from '../../ui/icono';
import { Sello } from '../../ui/sello';
import { GestionService } from '../gestion.service';

const hoy = () => new Date().toLocaleDateString('en-CA');
const COLOR_ESTADO: Record<EstadoPedido, string> = {
  Pendiente: 'var(--st-pendiente)',
  Aceptado: 'var(--st-aceptado)',
  'En preparación': 'var(--st-preparacion)',
  'Listo para entregar': 'var(--st-listo)',
  Entregado: 'var(--st-entregado)',
  Cancelado: 'var(--st-cancelado)',
  Rechazado: '#8a2a33',
};
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'set', 'oct', 'nov', 'dic'];

type Rango = 'mes' | '30' | 'anio' | 'libre';

@Component({
  selector: 'app-resumen',
  imports: [FormsModule, RouterLink, BarrasH, BarrasV, Icono, Sello],
  templateUrl: './resumen.html',
  styleUrl: './resumen.scss',
})
export class Resumen {
  private readonly gestion = inject(GestionService);

  protected readonly rango = signal<Rango>('anio');
  protected desde = `${new Date().getFullYear()}-01-01`;
  protected hasta = hoy();
  protected readonly datos = signal<Dashboard | null>(null);
  protected readonly cargando = signal(true);
  protected readonly error = signal('');
  protected readonly soles = formatoSoles;
  protected readonly partes = separarPresentacion;

  protected readonly opciones: { valor: Rango; texto: string }[] = [
    { valor: 'mes', texto: 'Este mes' },
    { valor: '30', texto: 'Últimos 30 días' },
    { valor: 'anio', texto: 'Este año' },
    { valor: 'libre', texto: 'Personalizado' },
  ];

  // Siempre los 12 últimos meses (con cero si no hubo ventas), terminando en el mes actual.
  protected readonly meses = computed<Barra[]>(() => {
    const ventas = new Map((this.datos()?.ventasMensuales ?? []).map((m) => [m.mes, m.monto]));
    const ahora = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - 11 + i, 1);
      const clave = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      const monto = ventas.get(clave) ?? 0;
      return {
        etiqueta: MESES[fecha.getMonth()],
        valor: monto,
        texto: formatoSoles(monto).replace(/\.00$/, ''),
        destacada: i === 11,
      };
    });
  });

  protected readonly estados = computed<Barra[]>(() =>
    (this.datos()?.porEstado ?? []).map((e) => ({ etiqueta: e.estado, valor: e.total, color: COLOR_ESTADO[e.estado] })),
  );

  protected readonly pagos = computed<Barra[]>(() => {
    const lista = this.datos()?.metodosPago ?? [];
    const total = lista.reduce((s, m) => s + m.total, 0) || 1;
    return lista.map((m) => ({ etiqueta: m.metodo, valor: m.total, texto: `${m.total} · ${Math.round((m.total / total) * 100)} %`, color: 'var(--azul)' }));
  });

  protected readonly anulados = computed(() =>
    (this.datos()?.porEstado ?? []).filter((e) => e.estado === 'Cancelado' || e.estado === 'Rechazado').reduce((s, e) => s + e.total, 0),
  );

  protected readonly maxTop = computed(() => Math.max(1, ...(this.datos()?.topProductos ?? []).map((p) => p.unidades)));

  constructor() {
    this.cargar();
  }

  protected elegir(r: Rango): void {
    this.rango.set(r);
    const ahora = new Date();
    if (r === 'mes') this.desde = `${hoy().slice(0, 7)}-01`;
    if (r === '30') this.desde = new Date(ahora.getTime() - 29 * 86400000).toLocaleDateString('en-CA');
    if (r === 'anio') this.desde = `${ahora.getFullYear()}-01-01`;
    if (r !== 'libre') {
      this.hasta = hoy();
      this.cargar();
    }
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.gestion.dashboard(this.desde, this.hasta).subscribe({
      next: (d) => {
        this.datos.set(d);
        this.cargando.set(false);
        this.error.set('');
      },
      error: (e) => {
        this.cargando.set(false);
        this.error.set(mensajeError(e));
      },
    });
  }
}
