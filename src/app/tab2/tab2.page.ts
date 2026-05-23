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

type FilterMode = 'all' | 'group' | 'almost' | 'empty';
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
  readonly filter = signal<FilterMode>('all');
  readonly sort = signal<SortMode>('album');
  readonly selectedGroup = signal<string | null>(null);
  readonly expandedCodes = signal<Set<string>>(new Set());
  readonly allStickersByCountry = signal<Record<string, Sticker[]>>({});

  readonly availableGroups = computed<string[]>(() => {
    const set = new Set<string>();
    for (const c of this.countries()) {
      if (c.wcGroup) set.add(c.wcGroup);
    }
    return Array.from(set).sort();
  });

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
    const f = this.filter();
    const grp = this.selectedGroup();
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
    if (grp) arr = arr.filter((c) => c.wcGroup === grp);
    if (f === 'almost') {
      arr = arr.filter((c) => (pm.get(c.code) ?? 0) >= 14 && (pm.get(c.code) ?? 0) < 20);
    }
    if (f === 'empty') arr = arr.filter((c) => (pm.get(c.code) ?? 0) === 0);

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

  toggleGroup(g: string): void {
    this.selectedGroup.set(this.selectedGroup() === g ? null : g);
  }

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
          if (!s.countryCode) continue;
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

  setFilter(f: FilterMode): void {
    this.filter.set(f);
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

  toggleSticker(stickerCode: string): void {
    // Tap siempre incrementa (añade primera vez o suma una repetida más).
    // Para restar el usuario va al detalle de país.
    this.album.increment(stickerCode).subscribe();
  }

  openCountry(code: string): void {
    this.router.navigate(['/tabs/tab2', code]);
  }

  openSpecials(): void {
    this.router.navigateByUrl('/tabs/tab2/specials');
  }
}
