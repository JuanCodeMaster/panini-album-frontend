import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chevronBack,
  chevronForward,
  sparkles,
  shieldOutline,
  imageOutline,
  personOutline,
  search,
  close,
} from 'ionicons/icons';
import { AlbumService } from '../../core/services/album.service';
import { CatalogService } from '../../core/services/catalog.service';
import { Country, Sticker, flagUrl } from '../../core/models/catalog.model';

interface GroupedMissing {
  countryCode: string | null;
  countryName: string;
  iso2: string | null;
  stickers: Sticker[];
}

@Component({
  selector: 'app-missing',
  templateUrl: './missing.page.html',
  styleUrls: ['./missing.page.scss'],
  imports: [CommonModule, IonContent, IonIcon, IonSpinner],
})
export class MissingPage implements OnInit {
  private readonly album = inject(AlbumService);
  private readonly catalog = inject(CatalogService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly stickers = signal<Sticker[]>([]);
  readonly query = signal('');
  private readonly countriesMap = signal<Map<string, Country>>(new Map());

  readonly filtered = computed<Sticker[]>(() => {
    const q = this.query().toLowerCase();
    if (!q) return this.stickers();
    return this.stickers().filter(
      (s) =>
        s.displayName.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        (s.countryCode ?? '').toLowerCase().includes(q)
    );
  });

  readonly grouped = computed<GroupedMissing[]>(() => {
    const map = new Map<string, GroupedMissing>();
    const countries = this.countriesMap();
    for (const s of this.filtered()) {
      const key = s.countryCode ?? '__SPECIAL__';
      if (!map.has(key)) {
        const country = s.countryCode ? countries.get(s.countryCode) : null;
        map.set(key, {
          countryCode: s.countryCode,
          countryName: country?.name ?? (s.countryCode ?? 'Especiales'),
          iso2: country?.iso2 ?? null,
          stickers: [],
        });
      }
      map.get(key)!.stickers.push(s);
    }
    return Array.from(map.values());
  });

  constructor() {
    addIcons({
      chevronBack,
      chevronForward,
      sparkles,
      shieldOutline,
      imageOutline,
      personOutline,
      search,
      close,
    });
  }

  ngOnInit(): void {
    this.loading.set(true);
    this.catalog.countries().subscribe((cs) => {
      this.countriesMap.set(new Map(cs.map((c) => [c.code, c])));
    });
    this.album.missing().subscribe({
      next: (list) => {
        this.stickers.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message ?? 'Error al cargar faltantes');
        this.loading.set(false);
      },
    });
  }

  flag(iso2: string | null): string {
    return iso2 ? flagUrl(iso2, 80) : '';
  }

  iconFor(type: string): string {
    if (type === 'BADGE') return 'shield-outline';
    if (type === 'TEAM_PHOTO') return 'image-outline';
    if (type === 'PLAYER') return 'person-outline';
    return 'sparkles';
  }

  onSearch(e: Event): void {
    this.query.set((e.target as HTMLInputElement).value.trim());
  }

  clearSearch(): void {
    this.query.set('');
  }

  back(): void {
    this.location.back();
  }

  openCountry(code: string | null): void {
    if (code) this.router.navigate(['/tabs/tab2', code]);
  }
}
