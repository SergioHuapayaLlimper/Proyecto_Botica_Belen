import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

// Íconos dibujados a mano (trazo único de 1.75, puntas redondeadas) para no depender de emojis.
const ICONOS: Record<string, string[]> = {
  buscar: ['M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z', 'M20 20l-3.6-3.6'],
  reserva: ['M6 7.5h12l-1 12.5H7L6 7.5z', 'M9 7.5a3 3 0 0 1 6 0', 'M9.5 12.5l1.8 1.8 3.4-3.6'],
  usuario: ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M4.5 20c1.4-3.4 4.2-5 7.5-5s6.1 1.6 7.5 5'],
  salir: ['M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4', 'M10 16l-4-4 4-4', 'M6 12h10'],
  mas: ['M12 5v14', 'M5 12h14'],
  menos: ['M5 12h14'],
  papelera: ['M4 7h16', 'M10 11v6', 'M14 11v6', 'M6 7l1 13h10l1-13', 'M9 7V4h6v3'],
  check: ['M5 12.5l4.5 4.5L19 7.5'],
  tienda: ['M4 10v10h16V10', 'M3 10l2-6h14l2 6', 'M9 20v-5.5h6V20'],
  reloj: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 7v5l3 2'],
  ubicacion: ['M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z', 'M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z'],
  telefono: ['M5.5 4h3.5l1.8 4.6-2.4 1.6a11 11 0 0 0 5.4 5.4l1.6-2.4L20 15v3.5a2 2 0 0 1-2.2 2A16 16 0 0 1 3.5 6.2 2 2 0 0 1 5.5 4z'],
  imprimir: ['M7 9V3.5h10V9', 'M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2', 'M7 14h10v6.5H7z'],
  izquierda: ['M15 18l-6-6 6-6'],
  derecha: ['M9 18l6-6-6-6'],
  abajo: ['M6 9l6 6 6-6'],
  cerrar: ['M6 6l12 12', 'M18 6L6 18'],
  filtro: ['M4 6.5h16', 'M7 12h10', 'M10 17.5h4'],
  campana: ['M18 16v-5a6 6 0 1 0-12 0v5l-2 2h16l-2-2z', 'M10 21h4'],
  caja: ['M3.5 7.5L12 3.5l8.5 4v9L12 20.5l-8.5-4v-9z', 'M3.5 7.5L12 11.5l8.5-4', 'M12 11.5v9'],
  etiqueta: ['M3.5 4.5h8l9 9-7 7-9-9z', 'M8 9h.01'],
  lista: ['M9 6h11', 'M9 12h11', 'M9 18h11', 'M4.5 6h.01', 'M4.5 12h.01', 'M4.5 18h.01'],
  grafico: ['M5 20V11', 'M10.5 20V5', 'M16 20v-6.5', 'M3 20h18'],
  documento: ['M7 3h7l5 5v13H7z', 'M14 3v5h5', 'M10 13h6', 'M10 17h6'],
  personas: ['M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z', 'M2.5 20c1-3.5 3.5-5 6.5-5s5.5 1.5 6.5 5', 'M16 4.6a3.5 3.5 0 0 1 0 6.4', 'M18 15.2c1.9.6 3.1 2.2 3.5 4.8'],
  mostrador: ['M3 10.5h18', 'M5 10.5V20', 'M19 10.5V20', 'M3 20h18', 'M7 5h10l2 5.5H5L7 5z', 'M10 15h4'],
  alerta: ['M12 3.5l9 16.5H3L12 3.5z', 'M12 10v4.5', 'M12 17.5h.01'],
  info: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 11v5.5', 'M12 7.8h.01'],
  receta: ['M6.5 3h11v18h-11z', 'M9.5 7.5h5', 'M9.5 11h5', 'M12 14v5', 'M9.5 16.5h5'],
  editar: ['M4 20h4L19 9l-4-4L4 16v4z', 'M13.5 6.5l4 4'],
  refrescar: ['M20 11.5a8 8 0 1 1-2.4-5.7', 'M20 4.5v5h-5'],
  menu: ['M4 6.5h16', 'M4 12h16', 'M4 17.5h16'],
  efectivo: ['M3 7h18v10H3z', 'M12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z', 'M6 10v4', 'M18 10v4'],
  tarjeta: ['M3 6h18v12H3z', 'M3 10h18', 'M7 14.5h4'],
  celular: ['M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z', 'M11 17.5h2'],
  candado: ['M6 11h12v9H6z', 'M8.5 11V8a3.5 3.5 0 0 1 7 0v3', 'M12 14.5v2'],
  descargar: ['M12 4v11', 'M7.5 10.5L12 15l4.5-4.5', 'M4 20h16'],
  calendario: ['M4 6h16v14H4z', 'M4 10h16', 'M8 3.5v4', 'M16 3.5v4'],

  // Pictogramas de categoría
  'cat-1': ['M10.5 20.5l10-10a4.95 4.95 0 0 0-7-7l-10 10a4.95 4.95 0 0 0 7 7z', 'M8.5 8.5l7 7'],
  'cat-2': ['M9 21h6a1 1 0 0 0 1-1v-9a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v9a1 1 0 0 0 1 1z', 'M11 9V6h2v3', 'M11 6V4h4', 'M10 14h4'],
  'cat-3': ['M5 19c0-8 5-14 15-15-1 10-7 15-15 15z', 'M5 19l7.5-7.5'],
  'cat-4': ['M3 8h18v12H3z', 'M9 8V5h6v3', 'M12 11v6', 'M9 14h6'],
  'cat-5': ['M9 9h6v11a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V9z', 'M10 9V6.5l2-3.5 2 3.5V9', 'M9 13h3', 'M9 16.5h3'],
  'cat-6': ['M7 3.5c-2.2 0-3.4 2-2.9 4.4.4 2 1.3 3 1.6 5 .4 2.6.7 7.6 2.4 8.1 1.6.5 1.9-4.6 3.9-4.6s2.3 5.1 3.9 4.6c1.7-.5 2-5.5 2.4-8.1.3-2 1.2-3 1.6-5 .5-2.4-.7-4.4-2.9-4.4-1.7 0-3 .9-5 .9s-3.3-.9-5-.9z'],
  'cat-7': ['M12 3.5s6 6.4 6 10.8a6 6 0 0 1-12 0c0-4.4 6-10.8 6-10.8z', 'M9.5 15a2.5 2.5 0 0 0 2.5 2.5'],
  'cat-8': ['M6.5 7v10', 'M3.5 9.5v5', 'M17.5 7v10', 'M20.5 9.5v5', 'M6.5 12h11'],
  'cat-9': ['M12 20s-8-4.7-8-10.5A4.5 4.5 0 0 1 12 6.6a4.5 4.5 0 0 1 8 2.9C20 15.3 12 20 12 20z', 'M7.5 12h2.2l1.4-2.3 2 4.6 1.4-2.3h2'],
  'cat-10': ['M6 3.5v5a4 4 0 0 0 8 0v-5', 'M10 12.5v2a4.5 4.5 0 0 0 9 0v-1.5', 'M19 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4z'],
  'cat-0': ['M9.5 3.5h5v6h6v5h-6v6h-5v-6h-6v-5h6z'],
};

@Component({
  selector: 'app-icono',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg [attr.width]="tam()" [attr.height]="tam()" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      [attr.stroke-width]="trazo()" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
      @for (d of trazos(); track $index) {
        <path [attr.d]="d" />
      }
    </svg>
  `,
  styles: ':host { display: inline-flex; flex-shrink: 0; }',
})
export class Icono {
  readonly nombre = input.required<string>();
  readonly tam = input(20);
  readonly trazo = input(1.75);
  protected readonly trazos = computed(() => ICONOS[this.nombre()] ?? ICONOS['cat-0']);
}
