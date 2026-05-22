import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AlbumSummary,
  CountryProgress,
  UserSticker,
} from '../models/album.model';
import { Sticker } from '../models/catalog.model';

@Injectable({ providedIn: 'root' })
export class AlbumService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/album/me`;

  private readonly _summary = signal<AlbumSummary | null>(null);
  private readonly _loading = signal(false);
  readonly summary = this._summary.asReadonly();
  readonly loading = this._loading.asReadonly();

  readonly quantities = computed<Record<string, number>>(
    () => this._summary()?.stickerQuantities ?? {}
  );

  readonly countriesProgress = computed<Map<string, CountryProgress>>(() => {
    const map = new Map<string, CountryProgress>();
    for (const c of this._summary()?.countries ?? []) {
      map.set(c.countryCode, c);
    }
    return map;
  });

  loadSummary(): Observable<AlbumSummary> {
    this._loading.set(true);
    return this.http.get<AlbumSummary>(`${this.baseUrl}/summary`).pipe(
      tap({
        next: (s) => {
          this._summary.set(s);
          this._loading.set(false);
        },
        error: () => this._loading.set(false),
      })
    );
  }

  /** Limpia el estado en memoria. Se llama al cerrar sesión o cambiar de usuario. */
  clear(): void {
    this._summary.set(null);
    this._loading.set(false);
  }

  quantityOf(stickerCode: string): number {
    return this.quantities()[stickerCode] ?? 0;
  }

  setQuantity(stickerCode: string, quantity: number): Observable<UserSticker> {
    return this.http
      .put<UserSticker>(`${this.baseUrl}/stickers/${stickerCode}`, { quantity })
      .pipe(tap((us) => this.applyLocal(us)));
  }

  increment(stickerCode: string): Observable<UserSticker> {
    return this.http
      .post<UserSticker>(`${this.baseUrl}/stickers/${stickerCode}/increment`, {})
      .pipe(tap((us) => this.applyLocal(us)));
  }

  decrement(stickerCode: string): Observable<UserSticker> {
    return this.http
      .post<UserSticker>(`${this.baseUrl}/stickers/${stickerCode}/decrement`, {})
      .pipe(tap((us) => this.applyLocal(us)));
  }

  missing(): Observable<Sticker[]> {
    return this.http.get<Sticker[]>(`${this.baseUrl}/missing`);
  }

  duplicates(): Observable<UserSticker[]> {
    return this.http.get<UserSticker[]>(`${this.baseUrl}/duplicates`);
  }

  recent(limit = 5): Observable<UserSticker[]> {
    return this.http.get<UserSticker[]>(`${this.baseUrl}/recent?limit=${limit}`);
  }

  friendSummary(username: string): Observable<AlbumSummary> {
    return this.http.get<AlbumSummary>(`${environment.apiUrl}/album/users/${encodeURIComponent(username)}/summary`);
  }

  private applyLocal(us: UserSticker): void {
    const current = this._summary();
    if (!current) return;

    const previousQty = current.stickerQuantities[us.stickerCode] ?? 0;
    const newQuantities = { ...current.stickerQuantities };
    if (us.quantity === 0) {
      delete newQuantities[us.stickerCode];
    } else {
      newQuantities[us.stickerCode] = us.quantity;
    }

    const wasObtained = previousQty > 0 ? 1 : 0;
    const nowObtained = us.quantity > 0 ? 1 : 0;
    const obtainedDelta = nowObtained - wasObtained;
    const dupBefore = Math.max(previousQty - 1, 0);
    const dupAfter = Math.max(us.quantity - 1, 0);
    const duplicatesDelta = dupAfter - dupBefore;

    const obtained = current.obtained + obtainedDelta;
    const missing = current.totalStickers - obtained;
    const duplicates = current.duplicates + duplicatesDelta;
    const progressPct =
      current.totalStickers === 0
        ? 0
        : Math.round((obtained * 10000) / current.totalStickers) / 100;

    const countries = current.countries.map((c) => {
      if (c.countryCode !== us.countryCode) return c;
      const obt = c.obtained + obtainedDelta;
      return {
        ...c,
        obtained: obt,
        progressPct: Math.round((obt * 10000) / c.total) / 100,
      };
    });

    this._summary.set({
      ...current,
      stickerQuantities: newQuantities,
      obtained,
      missing,
      duplicates,
      progressPct,
      countries,
    });
  }
}
