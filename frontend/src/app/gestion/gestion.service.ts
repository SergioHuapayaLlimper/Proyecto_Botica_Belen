import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API, Categoria, Dashboard, Empleado, EstadoPedido, LineaPreparar, Pedido, PedidoResumen, PermisoInfo, Producto, Reporte, RolPersonal } from '../core/modelos';
import { AvisosService } from '../core/avisos.service';

const parametros = (filtros: Record<string, string | number | null | undefined>) => {
  let p = new HttpParams();
  for (const [clave, valor] of Object.entries(filtros)) if (valor !== null && valor !== undefined && valor !== '') p = p.set(clave, String(valor));
  return p;
};

@Injectable({ providedIn: 'root' })
export class GestionService {
  private readonly http = inject(HttpClient);
  private readonly avisos = inject(AvisosService);

  // Reservas pendientes y aviso de llegada (consulta periódica desde el panel).
  readonly pendientes = signal(0);
  readonly cambios = signal(0);
  private ultimoId: number | null = null;
  private temporizador: ReturnType<typeof setInterval> | undefined;

  vigilar(): void {
    this.detener();
    this.consultar();
    this.temporizador = setInterval(() => this.consultar(), 15000);
  }

  detener(): void {
    clearInterval(this.temporizador);
    this.ultimoId = null;
  }

  // Avisar a las páginas que deben recargar (después de una acción del usuario).
  refrescar(): void {
    this.cambios.update((n) => n + 1);
    this.consultar();
  }

  private consultar(): void {
    this.http.get<{ pendientes: number; ultimoId: number | null }>(`${API}/gestion/pedidos/resumen`).subscribe({
      next: ({ pendientes, ultimoId }) => {
        if (this.ultimoId !== null && ultimoId !== null && ultimoId > this.ultimoId) {
          this.avisos.mostrar('Llegó una reserva nueva. Revisa el mostrador.', 'info', 7000);
          this.cambios.update((n) => n + 1);
        }
        if (ultimoId !== null) this.ultimoId = Math.max(this.ultimoId ?? 0, ultimoId);
        this.pendientes.set(pendientes);
      },
      error: () => undefined,
    });
  }

  // ---- Pedidos ----
  pedidos(filtros: { estado?: string; q?: string }): Observable<PedidoResumen[]> {
    return this.http.get<PedidoResumen[]>(`${API}/gestion/pedidos`, { params: parametros(filtros) });
  }

  pedido(id: number | string): Observable<Pedido> {
    return this.http.get<Pedido>(`${API}/pedidos/${id}`);
  }

  cambiarEstado(id: number, estado: EstadoPedido, motivo = ''): Observable<Pedido> {
    return this.http.patch<Pedido>(`${API}/gestion/pedidos/${id}/estado`, { estado, motivo });
  }

  preparar(): Observable<LineaPreparar[]> {
    return this.http.get<LineaPreparar[]>(`${API}/gestion/preparar`);
  }

  // ---- Productos ----
  categorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${API}/gestion/categorias`);
  }

  guardarCategoria(datos: { nombreCategoria: string; prefijo: string; estadoCategoria: string }, id?: number): Observable<Categoria> {
    return id ? this.http.put<Categoria>(`${API}/gestion/categorias/${id}`, datos) : this.http.post<Categoria>(`${API}/gestion/categorias`, datos);
  }

  eliminarCategoria(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/gestion/categorias/${id}`);
  }

  // Código que recibirá el próximo producto de la categoría (CUI-0004).
  siguienteCodigo(idCategoria: number): Observable<{ codigo: string }> {
    return this.http.get<{ codigo: string }>(`${API}/gestion/categorias/${idCategoria}/siguiente-codigo`);
  }

  productos(filtros: Record<string, string | number | null>): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${API}/gestion/productos`, { params: parametros(filtros) });
  }

  producto(id: number | string): Observable<Producto> {
    return this.http.get<Producto>(`${API}/gestion/productos/${id}`);
  }

  guardarProducto(datos: Partial<Producto>, id?: number): Observable<Producto> {
    return id ? this.http.put<Producto>(`${API}/gestion/productos/${id}`, datos) : this.http.post<Producto>(`${API}/gestion/productos`, datos);
  }

  fijarStock(id: number, stock: number): Observable<Producto> {
    return this.http.patch<Producto>(`${API}/gestion/productos/${id}/stock`, { stock });
  }

  // ---- Personal ----
  empleados(): Observable<Empleado[]> {
    return this.http.get<Empleado[]>(`${API}/gestion/empleados`);
  }

  guardarEmpleado(datos: Partial<Empleado> & { password?: string }, id?: number): Observable<Empleado> {
    return id ? this.http.put<Empleado>(`${API}/gestion/empleados/${id}`, datos) : this.http.post<Empleado>(`${API}/gestion/empleados`, datos);
  }

  eliminarEmpleado(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/gestion/empleados/${id}`);
  }

  // ---- Roles ----
  roles(): Observable<RolPersonal[]> {
    return this.http.get<RolPersonal[]>(`${API}/gestion/roles`);
  }

  catalogoPermisos(): Observable<PermisoInfo[]> {
    return this.http.get<PermisoInfo[]>(`${API}/gestion/roles/permisos`);
  }

  guardarRol(datos: { nombre: string; descripcion: string; permisos: string[] }, id?: number): Observable<RolPersonal> {
    return id ? this.http.put<RolPersonal>(`${API}/gestion/roles/${id}`, datos) : this.http.post<RolPersonal>(`${API}/gestion/roles`, datos);
  }

  eliminarRol(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/gestion/roles/${id}`);
  }

  // ---- Resumen y reporte ----
  dashboard(desde: string, hasta: string): Observable<Dashboard> {
    return this.http.get<Dashboard>(`${API}/gestion/dashboard`, { params: parametros({ desde, hasta }) });
  }

  reporte(filtros: { desde: string; hasta: string; estado?: string; producto?: string | number }): Observable<Reporte> {
    return this.http.get<Reporte>(`${API}/gestion/reporte`, { params: parametros(filtros) });
  }
}
