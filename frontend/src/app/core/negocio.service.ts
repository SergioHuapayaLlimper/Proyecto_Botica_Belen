import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { API } from './modelos';

export interface DatosNegocio {
  nombre_negocio: string;
  direccion: string;
  referencia: string;
  mapa_lat: string;
  mapa_lng: string;
  horario_atencion: string;
  metodos_pago: string;
  telefono_contacto: string;
  correo_contacto: string;
  whatsapp_numero: string;
  whatsapp_mensaje: string;
  yape_numero: string;
  horas_vencimiento: string; // horas para recoger una reserva antes de que venza (0 = no vence)
}

// Valores mientras llega la respuesta de la API (o si no hay conexión).
const INICIAL: DatosNegocio = {
  nombre_negocio: 'Botica Belén',
  direccion: '',
  referencia: '',
  mapa_lat: '',
  mapa_lng: '',
  horario_atencion: '',
  metodos_pago: 'Efectivo o Yape',
  telefono_contacto: '',
  correo_contacto: '',
  whatsapp_numero: '',
  whatsapp_mensaje: '',
  yape_numero: '',
  horas_vencimiento: '24',
};

/** Información del negocio que edita el admin (tabla configuracion_negocio). La usa todo el portal. */
@Injectable({ providedIn: 'root' })
export class NegocioService {
  private readonly http = inject(HttpClient);

  readonly datos = signal<DatosNegocio>(INICIAL);
  readonly cargado = signal(false);

  /** Coordenadas válidas, o null si el admin aún no las configuró. */
  readonly coordenadas = computed(() => {
    const lat = Number(this.datos().mapa_lat);
    const lng = Number(this.datos().mapa_lng);
    const ok = this.datos().mapa_lat !== '' && this.datos().mapa_lng !== '' && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
    return ok ? { lat, lng } : null;
  });

  /** "51987654321" → "987 654 321" para mostrar. */
  readonly whatsappVisible = computed(() => {
    const n = this.datos().whatsapp_numero.replace(/^51/, '');
    return n.length === 9 ? `${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}` : n;
  });

  readonly whatsappUrl = computed(() => {
    const { whatsapp_numero, whatsapp_mensaje } = this.datos();
    if (!whatsapp_numero) return null;
    return `https://wa.me/${whatsapp_numero}${whatsapp_mensaje ? '?text=' + encodeURIComponent(whatsapp_mensaje) : ''}`;
  });

  /** Horas para recoger una reserva (0 = no vence). */
  readonly horasVencimiento = computed(() => {
    const n = Number(this.datos().horas_vencimiento);
    return Number.isFinite(n) && n > 0 ? n : 0;
  });

  constructor() {
    this.cargar().subscribe({ error: () => undefined });
  }

  cargar(): Observable<DatosNegocio> {
    return this.http.get<DatosNegocio>(`${API}/config`).pipe(
      tap((d) => {
        this.datos.set({ ...INICIAL, ...d });
        this.cargado.set(true);
      }),
    );
  }

  guardar(datos: Partial<DatosNegocio>): Observable<DatosNegocio> {
    return this.http.put<DatosNegocio>(`${API}/gestion/config`, datos).pipe(tap((d) => this.datos.set({ ...INICIAL, ...d })));
  }
}

/** URL del mapa embebido de Google Maps (sin clave de API), como en Pastelería Web. */
export const urlMapa = (lat: number, lng: number) => `https://www.google.com/maps?q=${lat},${lng}&z=17&output=embed`;
export const urlAbrirMapa = (lat: number, lng: number) => `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
