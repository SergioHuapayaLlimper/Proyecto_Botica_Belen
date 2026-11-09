import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { Icono } from '../ui/icono';
import { GestionService } from './gestion.service';

interface Entrada {
  ruta: string;
  texto: string;
  icono: string;
  soloAdmin?: boolean;
  aviso?: boolean;
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
    { ruta: '/gestion/resumen', texto: 'Resumen', icono: 'grafico', soloAdmin: true },
    { ruta: '/gestion/mostrador', texto: 'Mostrador', icono: 'mostrador', aviso: true },
    { ruta: '/gestion/pedidos', texto: 'Pedidos', icono: 'lista' },
    { ruta: '/gestion/productos', texto: 'Productos y stock', icono: 'caja' },
    { ruta: '/gestion/reporte', texto: 'Reporte de ventas', icono: 'documento', soloAdmin: true },
    { ruta: '/gestion/personal', texto: 'Personal', icono: 'personas', soloAdmin: true },
  ];

  protected readonly menu = computed(() => this.entradas.filter((e) => !e.soloAdmin || this.auth.esAdmin()));

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
