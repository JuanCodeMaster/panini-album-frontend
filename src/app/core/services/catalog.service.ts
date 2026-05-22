import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Country, Section, Sticker } from '../models/catalog.model';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/catalog`;

  private countries$?: Observable<Country[]>;

  countries(): Observable<Country[]> {
    if (!this.countries$) {
      this.countries$ = this.http
        .get<Country[]>(`${this.baseUrl}/countries`)
        .pipe(shareReplay({ bufferSize: 1, refCount: false }));
    }
    return this.countries$;
  }

  sections(): Observable<Section[]> {
    return this.http.get<Section[]>(`${this.baseUrl}/sections`);
  }

  stickersByCountry(code: string): Observable<Sticker[]> {
    return this.http.get<Sticker[]>(`${this.baseUrl}/countries/${code}/stickers`);
  }

  allStickers(): Observable<Sticker[]> {
    return this.http.get<Sticker[]>(`${this.baseUrl}/stickers`);
  }

  stickersBySection(code: string): Observable<Sticker[]> {
    return this.http.get<Sticker[]>(`${this.baseUrl}/sections/${code}/stickers`);
  }

  /** Invalida el cache de países (por consistencia entre sesiones) */
  clear(): void {
    this.countries$ = undefined;
  }
}
