import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, remove, copyOutline, chevronForward, chevronBack, search, close, layers } from 'ionicons/icons';
import { AlbumService } from '../../core/services/album.service';
import { CatalogService } from '../../core/services/catalog.service';
import { UserSticker } from '../../core/models/album.model';
import { Country, Sticker, flagUrl } from '../../core/models/catalog.model';

interface DupItem {
  us: UserSticker;
  sticker: Sticker | null;
}

@Component({
  selector: 'app-duplicates',
  templateUrl: './duplicates.page.html',
  styleUrls: ['./duplicates.page.scss'],
  imports: [CommonModule, IonContent, IonIcon, IonSpinner],
})
export class DuplicatesPage implements OnInit {
  private readonly album = inject(AlbumService);
  private readonly catalog = inject(CatalogService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly items = signal<UserSticker[]>([]);
  readonly query = signal('');
  private readonly countriesMap = signal<Map<string, Country>>(new Map());
  private readonly stickerByCode = signal<Map<string, Sticker>>(new Map());

  readonly enriched = computed<DupItem[]>(() => {
    const cache = this.stickerByCode();
    return this.items().map((us) => ({
      us,
      sticker: cache.get(us.stickerCode) ?? null,
    }));
  });

  readonly filtered = computed<DupItem[]>(() => {
    const q = this.query().toLowerCase();
    if (!q) return this.enriched();
    return this.enriched().filter((it) => {
      const name = it.sticker?.displayName.toLowerCase() ?? '';
      const code = it.us.stickerCode.toLowerCase();
      const country = (it.us.countryCode ?? '').toLowerCase();
      return name.includes(q) || code.includes(q) || country.includes(q);
    });
  });

  readonly totalExtras = computed(() =>
    this.items().reduce((acc, it) => acc + Math.max(it.quantity - 1, 0), 0)
  );

  constructor() {
    addIcons({ add, remove, copyOutline, chevronForward, chevronBack, search, close, layers });
  }

  ngOnInit(): void {
    this.refresh();
    this.catalog.allStickers().subscribe((stickers) => {
      this.stickerByCode.set(new Map(stickers.map((s) => [s.code, s])));
    });
  }

  refresh(): void {
    this.loading.set(true);
    this.catalog.countries().subscribe((cs) => {
      this.countriesMap.set(new Map(cs.map((c) => [c.code, c])));
    });
    this.album.duplicates().subscribe({
      next: (list) => {
        this.items.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message ?? 'Error al cargar repetidas');
        this.loading.set(false);
      },
    });
  }

  flag(code: string | null): string {
    if (!code) return '';
    const c = this.countriesMap().get(code);
    return c ? flagUrl(c.iso2, 80) : '';
  }

  countryName(code: string | null): string {
    if (!code) return 'Especial';
    return this.countriesMap().get(code)?.name ?? code;
  }

  displayName(it: DupItem): string {
    return it.sticker?.displayName ?? it.us.stickerCode;
  }

  imageUrl(it: DupItem): string | null {
    return it.sticker?.imageUrl ?? null;
  }

  isFoil(it: DupItem): boolean {
    return it.sticker?.foil ?? false;
  }

  extras(it: DupItem): number {
    return Math.max(it.us.quantity - 1, 0);
  }

  increment(code: string): void {
    this.album.increment(code).subscribe(() => this.refreshLocal());
  }

  decrement(code: string): void {
    this.album.decrement(code).subscribe(() => this.refreshLocal());
  }

  private refreshLocal(): void {
    this.album.duplicates().subscribe((list) => this.items.set(list));
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
