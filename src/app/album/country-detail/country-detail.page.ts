import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  IonContent,
  IonSpinner,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  add,
  remove,
  image,
  person,
  chevronBack,
} from 'ionicons/icons';
import { CatalogService } from '../../core/services/catalog.service';
import { AlbumService } from '../../core/services/album.service';
import { Country, Sticker, flagUrl } from '../../core/models/catalog.model';

@Component({
  selector: 'app-country-detail',
  templateUrl: './country-detail.page.html',
  styleUrls: ['./country-detail.page.scss'],
  imports: [CommonModule, IonContent, IonSpinner, IonIcon],
})
export class CountryDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly catalog = inject(CatalogService);
  readonly album = inject(AlbumService);

  readonly code = signal<string>('');
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly stickers = signal<Sticker[]>([]);
  readonly country = signal<Country | null>(null);

  readonly obtainedCount = computed(() => {
    const q = this.album.quantities();
    return this.stickers().filter((s) => (q[s.code] ?? 0) > 0).length;
  });

  constructor() {
    addIcons({ add, remove, image, person, chevronBack });
  }

  ngOnInit(): void {
    const code = this.route.snapshot.paramMap.get('code')?.toUpperCase() ?? '';
    this.code.set(code);
    this.loadData(code);
  }

  private loadData(code: string): void {
    this.loading.set(true);
    forkJoin({
      countries: this.catalog.countries(),
      stickers: this.catalog.stickersByCountry(code),
    }).subscribe({
      next: ({ countries, stickers }) => {
        this.country.set(countries.find((c) => c.code === code) ?? null);
        this.stickers.set(stickers);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message ?? 'Error al cargar el país');
        this.loading.set(false);
      },
    });
  }

  flag(iso2: string | undefined): string {
    return iso2 ? flagUrl(iso2, 320) : '';
  }

  qty(stickerCode: string): number {
    return this.album.quantityOf(stickerCode);
  }

  isObtained(stickerCode: string): boolean {
    return this.qty(stickerCode) > 0;
  }

  back(): void {
    this.location.back();
  }

  // ── Tap vs long-press ──
  // Tap = sumar (1ª vez la pega, después suma repetida)
  // Long-press 500ms = restar una sin necesidad de entrar al detalle
  private pressTimer: ReturnType<typeof setTimeout> | null = null;
  private didLongPress = false;
  readonly pressedCode = signal<string | null>(null);
  private static readonly LONG_PRESS_MS = 500;

  onPressStart(stickerCode: string, event: Event): void {
    // Ignorar si el target es uno de los botones +/- (tienen su propio handler)
    const t = event.target as HTMLElement;
    if (t.closest('.dup-controls')) return;
    this.didLongPress = false;
    this.pressedCode.set(stickerCode);
    this.pressTimer = setTimeout(() => {
      this.didLongPress = true;
      this.pressedCode.set(null);
      this.album.decrement(stickerCode).subscribe();
      this.haptic();
    }, CountryDetailPage.LONG_PRESS_MS);
  }

  onPressEnd(stickerCode: string, event: Event): void {
    const t = event.target as HTMLElement;
    if (t.closest('.dup-controls')) return;
    this.clearTimer();
    if (this.didLongPress) {
      this.didLongPress = false;
      return; // ya restamos
    }
    this.pressedCode.set(null);
    this.album.increment(stickerCode).subscribe();
  }

  onPressCancel(): void {
    this.clearTimer();
    this.pressedCode.set(null);
  }

  private clearTimer(): void {
    if (this.pressTimer) {
      clearTimeout(this.pressTimer);
      this.pressTimer = null;
    }
  }

  private haptic(): void {
    if ('vibrate' in navigator) {
      try { navigator.vibrate(35); } catch {}
    }
  }

  increment(stickerCode: string, event: Event): void {
    event.stopPropagation();
    this.album.increment(stickerCode).subscribe();
  }

  decrement(stickerCode: string, event: Event): void {
    event.stopPropagation();
    this.album.decrement(stickerCode).subscribe();
  }
}
