// Exportaciones del sistema: PDF y Excel ARMADOS (no capturas de pantalla).
// - PDF con jsPDF + jspdf-autotable: encabezado con logo, tabla paginada, totales y pie con "Página x de y".
// - Excel con ExcelJS: hoja con formato (moneda, fechas, filtros, filas fijas) y hoja de resumen.
// Las librerías se cargan solo al exportar (import dinámico), así no pesan en la carga de la web.
import type { Workbook, Worksheet } from 'exceljs';
import type { jsPDF } from 'jspdf';
import { aFecha, separarPresentacion } from './formato';
import { Pedido, Reporte } from './modelos';
import { DatosNegocio } from './negocio.service';

// ---- Colores de la marca ----
const TINTA: [number, number, number] = [14, 41, 84];
const ROJO: [number, number, number] = [217, 37, 52];
const GRIS: [number, number, number] = [76, 86, 107];
const VELO: [number, number, number] = [243, 246, 250];
const RAYA: [number, number, number] = [211, 219, 231];

const ANULADOS = ['Cancelado', 'Rechazado'];
const dinero = (n: number) => 'S/ ' + Number(n ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fechaHora = (v: string) =>
  aFecha(v).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const fechaLarga = (v: string) => aFecha(`${v} 00:00:00`).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
const ahora = () => new Date().toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export interface FiltrosReporte {
  estado: string; // '' = todos
  producto: string; // nombre del producto o '' = todos
}

// ---------------------------------------------------------------------------------------------
// Utilidades comunes
// ---------------------------------------------------------------------------------------------
let logoCache: Promise<string | null> | null = null;

/** Logo de la botica como data URL (para incrustarlo en el PDF y el Excel). */
function logo(): Promise<string | null> {
  logoCache ??= fetch('img/logo-botica-belen-192.png')
    .then((r) => (r.ok ? r.blob() : null))
    .then(
      (b) =>
        b &&
        new Promise<string>((ok, mal) => {
          const lector = new FileReader();
          lector.onload = () => ok(String(lector.result));
          lector.onerror = mal;
          lector.readAsDataURL(b);
        }),
    )
    .catch(() => null);
  return logoCache;
}

function descargar(blob: Blob, nombre: string): void {
  const enlace = document.createElement('a');
  enlace.href = URL.createObjectURL(blob);
  enlace.download = nombre;
  enlace.click();
  setTimeout(() => URL.revokeObjectURL(enlace.href), 1000);
}

async function cargarPdf() {
  const [{ jsPDF }, { autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  return { jsPDF, autoTable };
}

/** Encabezado común de los PDF: logo, datos del negocio a la izquierda y título a la derecha. Devuelve la Y libre. */
async function encabezadoPdf(doc: jsPDF, negocio: DatosNegocio, titulo: string, subtitulo: string): Promise<number> {
  const ancho = doc.internal.pageSize.getWidth();
  const m = 14;
  const img = await logo();
  if (img) doc.addImage(img, 'PNG', m, 10, 18, 18);
  const x = img ? m + 22 : m;

  doc.setTextColor(...TINTA).setFont('helvetica', 'bold').setFontSize(15);
  doc.text(negocio.nombre_negocio || 'Botica Belén', x, 16);
  doc.setFont('helvetica', 'normal').setFontSize(8.5).setTextColor(...GRIS);
  const lineas = [negocio.direccion, [negocio.telefono_contacto, negocio.correo_contacto].filter(Boolean).join('   ')].filter(Boolean);
  lineas.forEach((l, i) => doc.text(l, x, 21 + i * 4));

  doc.setTextColor(...TINTA).setFont('helvetica', 'bold').setFontSize(14);
  doc.text(titulo, ancho - m, 16, { align: 'right' });
  doc.setFont('helvetica', 'normal').setFontSize(8.5).setTextColor(...GRIS);
  doc.text(subtitulo, ancho - m, 21, { align: 'right' });
  doc.text(`Generado el ${ahora()}`, ancho - m, 25, { align: 'right' });

  doc.setDrawColor(...ROJO).setLineWidth(0.8);
  doc.line(m, 31, ancho - m, 31);
  return 37;
}

/** Pie en todas las páginas: texto a la izquierda y "Página x de y" a la derecha. */
function pieDePagina(doc: jsPDF, texto: string): void {
  const total = doc.getNumberOfPages();
  const ancho = doc.internal.pageSize.getWidth();
  const alto = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setDrawColor(...RAYA).setLineWidth(0.2);
    doc.line(14, alto - 12, ancho - 14, alto - 12);
    doc.setFont('helvetica', 'normal').setFontSize(7.5).setTextColor(...GRIS);
    doc.text(texto, 14, alto - 7);
    doc.text(`Página ${i} de ${total}`, ancho - 14, alto - 7, { align: 'right' });
  }
}

// ---------------------------------------------------------------------------------------------
// Reporte de ventas — PDF (A4 horizontal)
// ---------------------------------------------------------------------------------------------
export async function reportePdf(rep: Reporte, negocio: DatosNegocio, filtros: FiltrosReporte): Promise<void> {
  const { jsPDF, autoTable } = await cargarPdf();
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const ancho = doc.internal.pageSize.getWidth();
  let y = await encabezadoPdf(doc, negocio, 'Reporte de ventas', `Del ${fechaLarga(rep.desde)} al ${fechaLarga(rep.hasta)}`);

  // Filtros aplicados
  doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(...GRIS);
  doc.text(`Estado: ${filtros.estado || 'Todos'}      Producto: ${filtros.producto || 'Todos'}`, 14, y);
  y += 5;

  // Cifras del periodo: una fila de casillas
  const t = rep.totales;
  const cifras: [string, string][] = [
    ['Pedidos', String(t.cantidad)],
    ['Vendido (válidos)', dinero(t.monto)],
    ['IGV incluido', dinero(t.igv)],
    ['Entregados', String(t.entregados)],
    ['Cancelados o rechazados', String(t.cancelados)],
  ];
  const anchoCasilla = (ancho - 28) / cifras.length;
  cifras.forEach(([rotulo, valor], i) => {
    const x = 14 + i * anchoCasilla;
    doc.setFillColor(...VELO).setDrawColor(...RAYA).rect(x, y, anchoCasilla - 3, 16, 'FD');
    doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(...GRIS).text(rotulo, x + 3, y + 5.5);
    doc.setFont('helvetica', 'bold').setFontSize(13).setTextColor(...TINTA).text(valor, x + 3, y + 12.5);
  });
  y += 22;

  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14, bottom: 16 },
    head: [['N.°', 'Fecha', 'Código', 'Cliente', 'Pago', 'Estado', 'Op. gravada', 'IGV', 'Total']],
    body: rep.pedidos.map((p, i) => [
      i + 1,
      fechaHora(p.fechaHoraToma),
      p.codigoPedido,
      p.nombreCliente ?? '',
      p.metodoPago ?? '',
      p.estadoPedido,
      dinero(p.subtotalGeneral),
      dinero(p.igv),
      dinero(p.total),
    ]),
    foot: [['', '', '', '', '', 'Total válido', dinero(t.monto - t.igv), dinero(t.igv), dinero(t.monto)]],
    showFoot: 'lastPage',
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 8.5, cellPadding: 2.2, lineColor: RAYA, lineWidth: 0.1, textColor: [20, 33, 61] },
    headStyles: { fillColor: TINTA, textColor: 255, fontStyle: 'bold' },
    footStyles: { fillColor: VELO, textColor: TINTA, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [250, 251, 253] },
    columnStyles: {
      0: { halign: 'center', cellWidth: 11 },
      1: { cellWidth: 32 },
      2: { cellWidth: 40 },
      6: { halign: 'right' },
      7: { halign: 'right' },
      8: { halign: 'right', fontStyle: 'bold' },
    },
    // Pedidos anulados en gris y cursiva: no suman en el total.
    didParseCell: (c) => {
      if (c.section === 'body' && ANULADOS.includes(String((c.row.raw as unknown[])[5]))) {
        c.cell.styles.textColor = [138, 147, 165];
        c.cell.styles.fontStyle = 'italic';
      }
      if (c.section === 'foot' && c.column.index >= 5) c.cell.styles.halign = 'right';
    },
  });

  if (!rep.pedidos.length) {
    doc.setFont('helvetica', 'italic').setFontSize(10).setTextColor(...GRIS).text('No hay pedidos en este periodo.', 14, y + 18);
  }
  pieDePagina(doc, `${negocio.nombre_negocio || 'Botica Belén'}: reporte de ventas. Montos en soles con IGV incluido; los pedidos anulados no suman.`);
  doc.save(`reporte-ventas-${rep.desde}-al-${rep.hasta}.pdf`);
}

// ---------------------------------------------------------------------------------------------
// Constancia de reserva — PDF (A4 vertical)
// ---------------------------------------------------------------------------------------------
export async function reservaPdf(p: Pedido, negocio: DatosNegocio): Promise<void> {
  const { jsPDF, autoTable } = await cargarPdf();
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const ancho = doc.internal.pageSize.getWidth();
  let y = await encabezadoPdf(doc, negocio, 'Constancia de reserva', `Reserva ${p.codigoPedido}`);

  // Datos de la reserva y del cliente, en dos columnas
  const filas: [string, string][] = [
    ['Fecha', fechaHora(p.fechaHoraToma)],
    ['Estado', p.estadoPedido],
    ['Pago al recoger', p.metodoPago ?? 'Por definir'],
  ];
  const cliente: [string, string][] = [
    ['Cliente', p.nombreCliente],
    ['Celular', p.telefonoCliente ?? '-'],
    ['Correo', p.emailCliente],
  ];
  const columna = (datos: [string, string][], x: number) =>
    datos.forEach(([r, v], i) => {
      doc.setFont('helvetica', 'normal').setFontSize(8.5).setTextColor(...GRIS).text(r, x, y + i * 6);
      doc.setFont('helvetica', 'bold').setFontSize(10).setTextColor(...TINTA).text(String(v), x + 30, y + i * 6);
    });
  columna(filas, 14);
  columna(cliente, ancho / 2 + 2);
  y += 22;

  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14, bottom: 16 },
    head: [['Cant.', 'Producto', 'Código', 'P. unit.', 'Subtotal']],
    body: p.detalles.map((d) => {
      const partes = separarPresentacion(d.nombreProducto ?? '');
      return [d.cantidad, partes.presentacion ? `${partes.nombre}\n${partes.presentacion}` : partes.nombre, d.codigoProducto, dinero(d.precioUnitario), dinero(d.subtotal)];
    }),
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 2.5, lineColor: RAYA, lineWidth: 0.1, textColor: [20, 33, 61] },
    headStyles: { fillColor: TINTA, textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 14 },
      2: { cellWidth: 26 },
      3: { halign: 'right', cellWidth: 26 },
      4: { halign: 'right', cellWidth: 28, fontStyle: 'bold' },
    },
  });
  y = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 6;

  // Totales alineados a la derecha
  const totales: [string, string, boolean][] = [
    ['Op. gravada', dinero(p.subtotalGeneral), false],
    ['IGV (18 %)', dinero(p.igv), false],
    ['Total a pagar', dinero(p.total), true],
  ];
  totales.forEach(([r, v, fuerte], i) => {
    const yy = y + i * 6.5;
    doc.setFont('helvetica', fuerte ? 'bold' : 'normal').setFontSize(fuerte ? 12 : 9.5).setTextColor(...(fuerte ? TINTA : GRIS));
    doc.text(r, ancho - 70, yy);
    doc.text(v, ancho - 14, yy, { align: 'right' });
  });
  doc.setDrawColor(...TINTA).setLineWidth(0.4).line(ancho - 70, y + 9, ancho - 14, y + 9);
  y += 26;

  // Dónde recoger
  doc.setFillColor(...VELO).setDrawColor(...RAYA).rect(14, y, ancho - 28, 24, 'FD');
  doc.setFont('helvetica', 'bold').setFontSize(10).setTextColor(...TINTA).text('Recojo en tienda', 18, y + 6);
  doc.setFont('helvetica', 'normal').setFontSize(8.5).setTextColor(...GRIS);
  doc.text(doc.splitTextToSize([negocio.direccion, negocio.referencia].filter(Boolean).join('. '), ancho - 36), 18, y + 11);
  doc.text(doc.splitTextToSize(negocio.horario_atencion || '', ancho - 36), 18, y + 17);
  y += 30;

  if (p.observaciones) {
    doc.setFont('helvetica', 'bold').setFontSize(9).setTextColor(...TINTA).text('Observaciones', 14, y);
    doc.setFont('helvetica', 'normal').setFontSize(8.5).setTextColor(...GRIS).text(doc.splitTextToSize(p.observaciones, ancho - 28), 14, y + 5);
  }

  pieDePagina(doc, `Presenta el código ${p.codigoPedido} en el mostrador. Este documento no es un comprobante de pago.`);
  doc.save(`reserva-${p.codigoPedido}.pdf`);
}

// ---------------------------------------------------------------------------------------------
// Reporte de ventas — Excel (.xlsx con formato)
// ---------------------------------------------------------------------------------------------
const XL = {
  tinta: 'FF0E2954',
  rojo: 'FFD92534',
  velo: 'FFF3F6FA',
  raya: 'FFD3DBE7',
  gris: 'FF4C566B',
  blanco: 'FFFFFFFF',
};
const ESTADO_XL: Record<string, { fondo: string; texto: string }> = {
  Pendiente: { fondo: 'FFFFF4D6', texto: 'FF8A5200' },
  Aceptado: { fondo: 'FFE4EEF8', texto: 'FF1F6CB0' },
  'En preparación': { fondo: 'FFE8EBF7', texto: 'FF3A4FA3' },
  'Listo para entregar': { fondo: 'FFE3F4EA', texto: 'FF1B7446' },
  Entregado: { fondo: 'FFEDEFF3', texto: 'FF3D4A63' },
  Cancelado: { fondo: 'FFFDE4E1', texto: 'FFB51D2A' },
  Rechazado: { fondo: 'FFFDE4E1', texto: 'FFB51D2A' },
};
const MONEDA = '"S/" #,##0.00';
const borde = { style: 'thin' as const, color: { argb: XL.raya } };
const bordes = { top: borde, left: borde, bottom: borde, right: borde };

function tituloHoja(hoja: Worksheet, columnas: number, titulo: string, lineas: string[]): void {
  const ultima = String.fromCharCode(64 + columnas);
  hoja.mergeCells(`A1:${ultima}1`);
  hoja.getCell('A1').value = titulo;
  hoja.getCell('A1').font = { name: 'Calibri', size: 16, bold: true, color: { argb: XL.tinta } };
  hoja.getRow(1).height = 26;
  lineas.forEach((l, i) => {
    const fila = i + 2;
    hoja.mergeCells(`A${fila}:${ultima}${fila}`);
    hoja.getCell(`A${fila}`).value = l;
    hoja.getCell(`A${fila}`).font = { size: 10, color: { argb: XL.gris } };
  });
}

function encabezadoTabla(hoja: Worksheet, fila: number, titulos: string[]): void {
  const r = hoja.getRow(fila);
  titulos.forEach((t, i) => {
    const c = r.getCell(i + 1);
    c.value = t;
    c.font = { bold: true, color: { argb: XL.blanco } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: XL.tinta } };
    c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    c.border = bordes;
  });
  r.height = 22;
}

export async function reporteExcel(rep: Reporte, negocio: DatosNegocio, filtros: FiltrosReporte): Promise<void> {
  // ExcelJS es CommonJS: según el empaquetador llega como default o como el propio módulo.
  const modulo = (await import('exceljs')) as unknown as { default?: typeof import('exceljs') } & typeof import('exceljs');
  const ExcelJS = modulo.default ?? modulo;
  const libro: Workbook = new ExcelJS.Workbook();
  libro.creator = negocio.nombre_negocio || 'Botica Belén';
  libro.created = new Date();

  const nombre = negocio.nombre_negocio || 'Botica Belén';
  const periodo = `Del ${fechaLarga(rep.desde)} al ${fechaLarga(rep.hasta)}`;
  const filtro = `Estado: ${filtros.estado || 'Todos'}    |    Producto: ${filtros.producto || 'Todos'}`;

  // ---- Hoja 1: Pedidos ----
  const hoja = libro.addWorksheet('Pedidos', { views: [{ state: 'frozen', ySplit: 5 }], pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 } });
  hoja.columns = [
    { key: 'n', width: 6 },
    { key: 'fecha', width: 18 },
    { key: 'codigo', width: 24 },
    { key: 'cliente', width: 30 },
    { key: 'pago', width: 12 },
    { key: 'estado', width: 20 },
    { key: 'gravada', width: 15 },
    { key: 'igv', width: 13 },
    { key: 'total', width: 15 },
  ];
  tituloHoja(hoja, 9, `${nombre}: reporte de ventas`, [`${periodo}    |    ${filtro}`, `Generado el ${ahora()}. Montos en soles con IGV incluido.`]);
  encabezadoTabla(hoja, 5, ['N.°', 'Fecha', 'Código', 'Cliente', 'Pago', 'Estado', 'Op. gravada', 'IGV', 'Total']);

  const primera = 6;
  rep.pedidos.forEach((p, i) => {
    const fila = hoja.getRow(primera + i);
    fila.values = [i + 1, aFecha(p.fechaHoraToma), p.codigoPedido, p.nombreCliente ?? '', p.metodoPago ?? '', p.estadoPedido, p.subtotalGeneral, p.igv, p.total];
    fila.getCell(2).numFmt = 'dd/mm/yyyy hh:mm';
    [7, 8, 9].forEach((c) => (fila.getCell(c).numFmt = MONEDA));
    fila.getCell(1).alignment = { horizontal: 'center' };
    const colores = ESTADO_XL[p.estadoPedido];
    if (colores) {
      fila.getCell(6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colores.fondo } };
      fila.getCell(6).font = { bold: true, color: { argb: colores.texto } };
    }
    if (ANULADOS.includes(p.estadoPedido)) {
      [1, 2, 3, 4, 5, 7, 8, 9].forEach((c) => (fila.getCell(c).font = { italic: true, color: { argb: 'FF8A93A5' } }));
    }
    for (let c = 1; c <= 9; c++) fila.getCell(c).border = bordes;
  });

  // Fila de totales con fórmulas: suman solo los pedidos no anulados (las celdas siguen vivas si se editan).
  const ultima = primera + rep.pedidos.length - 1;
  const ft = hoja.getRow(ultima + 2);
  ft.getCell(6).value = 'Total válido';
  const suma = (col: string, resultado: number) =>
    rep.pedidos.length
      ? { formula: `SUMIFS(${col}${primera}:${col}${ultima},F${primera}:F${ultima},"<>Cancelado",F${primera}:F${ultima},"<>Rechazado")`, result: resultado }
      : 0;
  ft.getCell(7).value = suma('G', rep.totales.monto - rep.totales.igv);
  ft.getCell(8).value = suma('H', rep.totales.igv);
  ft.getCell(9).value = suma('I', rep.totales.monto);
  for (let c = 6; c <= 9; c++) {
    const cel = ft.getCell(c);
    cel.font = { bold: true, color: { argb: XL.tinta } };
    cel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: XL.velo } };
    cel.border = { top: { style: 'medium', color: { argb: XL.tinta } }, bottom: borde, left: borde, right: borde };
    if (c > 6) cel.numFmt = MONEDA;
  }
  if (rep.pedidos.length) hoja.autoFilter = { from: { row: 5, column: 1 }, to: { row: ultima, column: 9 } };

  // ---- Hoja 2: Resumen ----
  const res = libro.addWorksheet('Resumen');
  res.columns = [{ width: 30 }, { width: 18 }, { width: 18 }];
  tituloHoja(res, 3, `${nombre}: resumen del periodo`, [periodo]);
  encabezadoTabla(res, 4, ['Indicador', 'Valor', '']);
  const validos = rep.pedidos.filter((p) => !ANULADOS.includes(p.estadoPedido));
  const indicadores: [string, number, string?][] = [
    ['Pedidos registrados', rep.totales.cantidad],
    ['Pedidos válidos', validos.length],
    ['Entregados', rep.totales.entregados],
    ['Cancelados o rechazados', rep.totales.cancelados],
    ['Vendido (con IGV)', rep.totales.monto, MONEDA],
    ['IGV incluido', rep.totales.igv, MONEDA],
    ['Ticket promedio', validos.length ? rep.totales.monto / validos.length : 0, MONEDA],
  ];
  indicadores.forEach(([r, v, fmt], i) => {
    const fila = res.getRow(5 + i);
    fila.getCell(1).value = r;
    fila.getCell(2).value = v;
    if (fmt) fila.getCell(2).numFmt = fmt;
    fila.getCell(2).font = { bold: true, color: { argb: XL.tinta } };
    [1, 2].forEach((c) => (fila.getCell(c).border = bordes));
  });

  // Por forma de pago (solo pedidos válidos)
  const inicioPago = 5 + indicadores.length + 2;
  encabezadoTabla(res, inicioPago, ['Forma de pago', 'Pedidos', 'Monto']);
  const porPago = new Map<string, { n: number; monto: number }>();
  validos.forEach((p) => {
    const k = p.metodoPago ?? 'Sin definir';
    const a = porPago.get(k) ?? { n: 0, monto: 0 };
    porPago.set(k, { n: a.n + 1, monto: a.monto + p.total });
  });
  [...porPago.entries()].forEach(([metodo, v], i) => {
    const fila = res.getRow(inicioPago + 1 + i);
    fila.values = [metodo, v.n, v.monto];
    fila.getCell(3).numFmt = MONEDA;
    [1, 2, 3].forEach((c) => (fila.getCell(c).border = bordes));
  });

  // Por estado
  const inicioEstado = inicioPago + porPago.size + 3;
  encabezadoTabla(res, inicioEstado, ['Estado', 'Pedidos', '']);
  const porEstado = new Map<string, number>();
  rep.pedidos.forEach((p) => porEstado.set(p.estadoPedido, (porEstado.get(p.estadoPedido) ?? 0) + 1));
  [...porEstado.entries()].forEach(([estado, n], i) => {
    const fila = res.getRow(inicioEstado + 1 + i);
    fila.values = [estado, n];
    const colores = ESTADO_XL[estado];
    if (colores) fila.getCell(1).font = { bold: true, color: { argb: colores.texto } };
    [1, 2].forEach((c) => (fila.getCell(c).border = bordes));
  });

  const buffer = await libro.xlsx.writeBuffer();
  descargar(
    new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `reporte-ventas-${rep.desde}-al-${rep.hasta}.xlsx`,
  );
}
