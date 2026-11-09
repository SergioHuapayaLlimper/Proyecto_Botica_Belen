import { Injectable, signal } from '@angular/core';

export interface Aviso {
  id: number;
  tipo: 'ok' | 'error' | 'info';
  texto: string;
}

// Avisos breves (toasts) que se anuncian a lectores de pantalla.
@Injectable({ providedIn: 'root' })
export class AvisosService {
  readonly lista = signal<Aviso[]>([]);
  private siguiente = 1;

  mostrar(texto: string, tipo: Aviso['tipo'] = 'ok', duracion = 4200): void {
    const aviso = { id: this.siguiente++, tipo, texto };
    this.lista.update((l) => [...l.slice(-2), aviso]);
    setTimeout(() => this.cerrar(aviso.id), duracion);
  }

  ok(texto: string): void {
    this.mostrar(texto, 'ok');
  }

  error(texto: string): void {
    this.mostrar(texto, 'error', 6500);
  }

  cerrar(id: number): void {
    this.lista.update((l) => l.filter((a) => a.id !== id));
  }
}
