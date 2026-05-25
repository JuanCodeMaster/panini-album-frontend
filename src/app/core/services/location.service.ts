import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Geolocation } from '@capacitor/geolocation';
import { environment } from '../../../environments/environment';

/**
 * Compartir ubicación (opt-in) para las sugerencias de intercambio por cercanía.
 * Pide permiso de GPS, obtiene la posición y la manda al backend.
 */
@Injectable({ providedIn: 'root' })
export class LocationService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/location`;

  readonly sharing = signal(false);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);

  /** Consulta al backend si el usuario ya tenía la ubicación activada. */
  async loadStatus(): Promise<void> {
    try {
      const res = await firstValueFrom(
        this.http.get<{ sharing: boolean }>(`${this.url}/me`)
      );
      this.sharing.set(!!res?.sharing);
    } catch {
      this.sharing.set(false);
    }
  }

  /** Activa: pide permiso, obtiene coords y las sube. Devuelve true si quedó activo. */
  async enable(): Promise<boolean> {
    this.busy.set(true);
    this.error.set(null);
    try {
      const perm = await Geolocation.requestPermissions();
      if (perm.location === 'denied') {
        this.error.set('Permiso de ubicación denegado');
        this.busy.set(false);
        return false;
      }
      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: false,
        timeout: 10000,
      });
      await firstValueFrom(
        this.http.put(`${this.url}`, {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        })
      );
      this.sharing.set(true);
      this.busy.set(false);
      return true;
    } catch (e: any) {
      this.error.set('No se pudo obtener tu ubicación');
      this.busy.set(false);
      return false;
    }
  }

  /** Desactiva el compartir ubicación. */
  async disable(): Promise<void> {
    this.busy.set(true);
    try {
      await firstValueFrom(this.http.delete(`${this.url}`));
    } catch {
      /* ignore */
    }
    this.sharing.set(false);
    this.busy.set(false);
  }
}
