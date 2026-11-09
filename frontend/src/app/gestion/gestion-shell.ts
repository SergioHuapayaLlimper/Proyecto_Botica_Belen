import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { Permiso } from '../core/modelos';
import { Icono } from '../ui/icono';
import { GestionService } from './gestion.service';

interface Entrada {
  ruta: string;
  texto: string;
  icono: string;
  permisos: Permiso[]; // se muestra si el rol tiene alguno
  aviso?: boolean;
  grupo?: string;
}

@Component({
  selector: 'app-gestion-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icono],
  templateUrl: './gestion-shell.html',
  styleUrl: './gestion-shell.scss',
})
export class GestionShell implements OnDestroy {
  protected readonly auth = inject(AuthService);
  protected readonly gestion = inject(GestionService);
  protected readonly menuAbierto = signal(false);

  private readonly entradas: Entrada[] = [
    { ruta: '/gestion/resumen', texto: 'Resumen', icono: 'grafico', permisos: ['resumen'] },
    { ruta: '/gestion/mostrador', texto: 'Mostrador', icono: 'mostrador', permisos: ['mostrador'], aviso: true },
    { ruta: '/gestion/pedidos', texto: 'Pedidos', icono: 'lista', permisos: ['pedidos'] },
    { ruta: '/gestion/productos', texto: 'Productos y stock', icono: 'caja', permisos: ['productos', 'productos_editar'] },
    { ruta: '/gestion/categorias', texto: 'Categorías', icono: 'etiqueta', permisos: ['categorias'] },
    { ruta: '/gestion/reporte', texto: 'Reporte de ventas', icono: 'documento', permisos: ['reporte'] },
    { ruta: '/gestion/personal', texto: 'Personal', icono: 'personas', permisos: ['personal'], grupo: 'Organización' },
    { ruta: '/gestion/roles', texto: 'Roles', icono: 'candado', permisos: ['personal'] },
  ];

  // Solo las secciones que el rol puede usar.
  protected readonly menu = computed(() => this.entradas.filter((e) => this.auth.puede(...e.permisos)));

  constructor() {
    this.gestion.vigilar();
    inject(Router)
      .events.pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.menuAbierto.set(false));
  }

  ngOnDestroy(): void {
    this.gestion.detener();
  }
}
