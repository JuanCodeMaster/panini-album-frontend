import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  IonContent,
  IonIcon,
  IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chevronDown,
  search,
  arrowForward,
  close,
  person,
  image,
  sparkles,
  swapVertical,
  trophyOutline,
  textOutline,
  alertCircleOutline,
  appsOutline,
} from 'ionicons/icons';
import { CatalogService } from '../core/services/catalog.service';
import { AlbumService } from '../core/services/album.service';
import { Country, Sticker, flagUrl } from '../core/models/catalog.model';

type SortMode = 'album' | 'group' | 'abc' | 'missing';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  imports: [CommonModule, IonContent, IonIcon, IonSpinner],
})
export class Tab2Page implements OnInit {
  private readonly catalog = inject(CatalogService);
  private readonly album = inject(AlbumService);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly countries = signal<Country[]>([]);
  readonly query = signal('');
  readonly sort = signal<SortMode>('album');
  readonly expandedCodes = signal<Set<string>>(new Set());
  readonly allStickersByCountry = signal<Record<string, Sticker[]>>({});
  readonly pressedCode = signal<string | null>(null);

  private pressTimer: ReturnType<typeof setTimeout> | null = null;
  private didLongPress = false;
  private pressStartX = 0;
  private pressStartY = 0;
  private static readonly LONG_PRESS_MS = 520;
  private static readonly MOVE_TOLERANCE_PX = 14;

  readonly progressMap = computed<Map<string, number>>(() => {
    const m = new Map<string, number>();
    for (const c of this.album.summary()?.countries ?? []) {
      m.set(c.countryCode, c.obtained);
    }
    return m;
  });

  /** Países que coinciden con la query — por código, nombre o por nombre de jugador */
  readonly matchedByPlayer = computed<Set<string>>(() => {
    const q = this.query().toLowerCase();
    if (q.length < 2) return new Set();
    const matched = new Set<string>();
    const byCountry = this.allStickersByCountry();
    for (const code of Object.keys(byCountry)) {
      for (const s of byCountry[code]) {
        if (s.stickerType === 'PLAYER' && s.displayName.toLowerCase().includes(q)) {
          matched.add(code);
          break;
        }
      }
    }
    return matched;
  });

  readonly filtered = computed<Country[]>(() => {
    const q = this.query().toLowerCase();
    const pm = this.progressMap();
    const playerMatches = this.matchedByPlayer();
    let arr = this.countries();
    if (q) {
      arr = arr.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          playerMatches.has(c.code)
      );
    }

    // Sort según el modo elegido (copia para no mutar el array de countries)
    const sorted = [...arr];
    switch (this.sort()) {
      case 'group':
        sorted.sort((a, b) => {
          const ga = a.wcGroup ?? 'Z';
          const gb = b.wcGroup ?? 'Z';
          if (ga !== gb) return ga.localeCompare(gb);
          return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
        });
        break;
      case 'abc':
        sorted.sort((a, b) => a.name.localeCompare(b.name, 'es'));
        break;
      case 'missing':
        // Más faltantes arriba, completados al final
        sorted.sort((a, b) => {
          const ma = 20 - (pm.get(a.code) ?? 0);
          const mb = 20 - (pm.get(b.code) ?? 0);
          if (ma !== mb) return mb - ma;
          return a.name.localeCompare(b.name, 'es');
        });
        break;
      case 'album':
      default:
        sorted.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    }
    return sorted;
  });

  constructor() {
    addIcons({
      chevronDown,
      search,
      arrowForward,
      close,
      person,
      image,
      sparkles,
      swapVertical,
      trophyOutline,
      textOutline,
      alertCircleOutline,
      appsOutline,
    });
  }

  setSort(s: SortMode): void {
    this.sort.set(s);
  }

  ngOnInit(): void {
    this.loading.set(true);
    forkJoin({
      countries: this.catalog.countries(),
      summary: this.album.loadSummary(),
      stickers: this.catalog.allStickers(),
    }).subscribe({
      next: ({ countries, stickers }) => {
        this.countries.set(countries);
        // Indexar stickers por país
        const byCountry: Record<string, Sticker[]> = {};
        for (const s of stickers) {
          if (!this.isTeamSticker(s)) continue;
          if (!byCountry[s.countryCode]) byCountry[s.countryCode] = [];
          byCountry[s.countryCode].push(s);
        }
        // Ordenar por numberInCountry
        for (const code of Object.keys(byCountry)) {
          byCountry[code].sort((a, b) => (a.numberInCountry ?? 0) - (b.numberInCountry ?? 0));
        }
        this.allStickersByCountry.set(byCountry);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  flag(iso2: string): string {
    return flagUrl(iso2, 80);
  }

  onSearch(e: Event): void {
    const v = (e.target as HTMLInputElement).value.trim();
    this.query.set(v);
    // Auto-expand países que coinciden por nombre de jugador
    if (v.length >= 2) {
      const matches = this.matchedByPlayer();
      if (matches.size > 0) {
        this.expandedCodes.set(new Set(matches));
        return;
      }
    }
  }

  clearSearch(): void {
    this.query.set('');
  }

  obtained(code: string): number {
    return this.progressMap().get(code) ?? 0;
  }

  isComplete(code: string): boolean {
    return this.obtained(code) === 20;
  }

  isEmpty(code: string): boolean {
    return this.obtained(code) === 0;
  }

  isExpanded(code: string): boolean {
    return this.expandedCodes().has(code);
  }

  toggleExpand(code: string): void {
    const cur = new Set(this.expandedCodes());
    if (cur.has(code)) {
      cur.delete(code);
    } else {
      cur.add(code);
    }
    this.expandedCodes.set(cur);
  }

  stickersFor(code: string): Sticker[] {
    return this.allStickersByCountry()[code] ?? [];
  }

  /** ¿Este sticker coincide con la query? Para resaltar slot en búsqueda */
  matchesQuery(s: Sticker): boolean {
    const q = this.query().toLowerCase();
    if (q.length < 2) return false;
    if (s.stickerType !== 'PLAYER') return false;
    return s.displayName.toLowerCase().includes(q);
  }

  qty(stickerCode: string): number {
    return this.album.quantityOf(stickerCode);
  }

  isOwned(stickerCode: string): boolean {
    return this.qty(stickerCode) > 0;
  }

  private isTeamSticker(sticker: Sticker): sticker is Sticker & { countryCode: string } {
    const n = sticker.numberInCountry ?? 0;
    return sticker.sectionCode === 'TEAM' && !!sticker.countryCode && n >= 1 && n <= 20;
  }

  toggleSticker(stickerCode: string): void {
    // Tap siempre incrementa (añade primera vez o suma una repetida más).
    // Para restar el usuario va al detalle de país.
    this.album.increment(stickerCode).subscribe();
  }

  onStickerPressStart(stickerCode: string, event: PointerEvent): void {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    this.didLongPress = false;
    this.pressStartX = event.clientX;
    this.pressStartY = event.clientY;
    this.pressedCode.set(stickerCode);
    this.pressTimer = setTimeout(() => {
      this.didLongPress = true;
      this.pressedCode.set(null);
      if (this.qty(stickerCode) > 0) {
        this.album.decrement(stickerCode).subscribe();
        this.haptic();
      }
    }, Tab2Page.LONG_PRESS_MS);
  }

  onStickerPressMove(event: PointerEvent): void {
    if (this.pressTimer === null) return;
    const dx = event.clientX - this.pressStartX;
    const dy = event.clientY - this.pressStartY;
    if (Math.hypot(dx, dy) > Tab2Page.MOVE_TOLERANCE_PX) {
      this.cancelStickerPress();
    }
  }

  onStickerPressEnd(stickerCode: string, event: PointerEvent): void {
    event.preventDefault();
    this.clearPressTimer();
    this.pressedCode.set(null);
    if (this.didLongPress) {
      this.didLongPress = false;
      return;
    }
    this.album.increment(stickerCode).subscribe();
  }

  cancelStickerPress(): void {
    this.clearPressTimer();
    this.didLongPress = false;
    this.pressedCode.set(null);
  }

  private clearPressTimer(): void {
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

  openCountry(code: string): void {
    this.router.navigate(['/tabs/tab2', code]);
  }

  openSpecials(): void {
    this.router.navigateByUrl('/tabs/tab2/specials');
  }
}
