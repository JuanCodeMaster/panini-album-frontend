import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { forkJoin } from 'rxjs';
import { IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chevronBack,
  sparkles,
  shieldOutline,
  imageOutline,
  trophy,
  flag as flagIcon,
  people,
  star,
  checkmark,
} from 'ionicons/icons';
import { CatalogService } from '../../core/services/catalog.service';
import { AlbumService } from '../../core/services/album.service';
import { Sticker, Country, flagUrl } from '../../core/models/catalog.model';

interface SpecialGroup {
  key: string;
  title: string;
  sub: string;
  icon: string;
  stickers: Sticker[];
}

@Component({
  selector: 'app-specials',
  templateUrl: './specials.page.html',
  styleUrls: ['./specials.page.scss'],
  imports: [CommonModule, IonContent, IonIcon, IonSpinner],
})
export class SpecialsPage implements OnInit {
  private readonly catalog = inject(CatalogService);
  private readonly album = inject(AlbumService);
  private readonly location = inject(Location);

  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  private readonly countriesMap = signal<Map<string, Country>>(new Map());
  private readonly allStickers = signal<Sticker[]>([]);

  readonly groups = computed<SpecialGroup[]>(() => {
    const all = this.allStickers();
    if (!all.length) return [];
    const intro = all
      .filter((s) => s.sectionCode === 'INTRO')
      .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
    const museum = all
      .filter((s) => s.sectionCode === 'MUSEUM')
      .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
    const cocaCola = all
      .filter((s) => s.sectionCode === 'COCACOLA')
      .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
    const teamPhotos = all
      .filter((s) => s.stickerType === 'TEAM_PHOTO')
      .sort((a, b) => (a.countryCode ?? '').localeCompare(b.countryCode ?? ''));
    return [
      { key: 'INTRO', title: 'Introducción', sub: 'Logo, trofeo y sedes', icon: 'sparkles', stickers: intro },
      { key: 'COCACOLA', title: 'Coca-Cola Exclusivos', sub: 'No vienen en sobres estándar', icon: 'star', stickers: cocaCola },
      { key: 'MUSEUM', title: 'FIFA Museum', sub: 'Mundiales históricos', icon: 'trophy', stickers: museum },
      { key: 'TEAM_PHOTOS', title: 'Fotos de equipo', sub: 'Una por selección', icon: 'people', stickers: teamPhotos },
    ];
  });

  constructor() {
    addIcons({
      chevronBack,
      sparkles,
      shieldOutline,
      imageOutline,
      trophy,
      flag: flagIcon,
      people,
      star,
      checkmark,
    });
  }

  ngOnInit(): void {
    this.loading.set(true);
    forkJoin({
      countries: this.catalog.countries(),
      stickers: this.catalog.allStickers(),
      summary: this.album.loadSummary(),
    }).subscribe({
      next: ({ countries, stickers }) => {
        this.countriesMap.set(new Map(countries.map((c) => [c.code, c])));
        this.allStickers.set(stickers);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message ?? 'Error al cargar especiales');
        this.loading.set(false);
      },
    });
  }

  countryFlag(code: string | null): string {
    if (!code) return '';
    const c = this.countriesMap().get(code);
    return c ? flagUrl(c.iso2, 80) : '';
  }

  countryName(code: string | null): string {
    if (!code) return '';
    return this.countriesMap().get(code)?.name ?? code;
  }

  qty(stickerCode: string): number {
    return this.album.quantityOf(stickerCode);
  }

  isObtained(stickerCode: string): boolean {
    return this.qty(stickerCode) > 0;
  }

  toggle(stickerCode: string): void {
    this.album.increment(stickerCode).subscribe();
  }

  back(): void {
    this.location.back();
  }

  iconFor(s: Sticker): string {
    if (s.stickerType === 'LOGO_PANINI') return 'star';
    if (s.stickerType === 'HOST') return 'flag';
    if (s.stickerType === 'MUSEUM') return 'trophy';
    if (s.stickerType === 'TEAM_PHOTO') return 'people';
    if (s.stickerType === 'BADGE') return 'shield-outline';
    return 'sparkles';
  }
}
