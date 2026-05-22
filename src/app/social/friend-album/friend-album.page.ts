import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chevronDown,
  search,
  arrowForward,
  close,
  chevronBack,
  swapHorizontal,
  person,
  image,
  gift,
} from 'ionicons/icons';
import { CatalogService } from '../../core/services/catalog.service';
import { AlbumService } from '../../core/services/album.service';
import { Country, Sticker, flagUrl } from '../../core/models/catalog.model';
import { AlbumSummary, CountryProgress } from '../../core/models/album.model';
import { ProgressRingComponent } from '../../shared/progress-ring/progress-ring.component';

type FilterMode = 'all' | 'almost' | 'empty';

@Component({
  selector: 'app-friend-album',
  templateUrl: './friend-album.page.html',
  styleUrls: ['./friend-album.page.scss'],
  imports: [CommonModule, IonContent, IonIcon, IonSpinner, ProgressRingComponent],
})
export class FriendAlbumPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly catalog = inject(CatalogService);
  private readonly album = inject(AlbumService);

  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly username = signal<string>('');
  readonly summary = signal<AlbumSummary | null>(null);
  readonly countries = signal<Country[]>([]);
  readonly query = signal('');
  readonly filter = signal<FilterMode>('all');
  readonly expandedCodes = signal<Set<string>>(new Set());
  readonly allStickersByCountry = signal<Record<string, Sticker[]>>({});

  readonly progressByCountry = computed<Map<string, CountryProgress>>(() => {
    const map = new Map<string, CountryProgress>();
    for (const c of this.summary()?.countries ?? []) {
      map.set(c.countryCode, c);
    }
    return map;
  });

  readonly pct = computed(() => {
    const s = this.summary();
    if (!s) return 0;
    return s.obtained / Math.max(s.totalStickers, 1);
  });
  readonly pctLabel = computed(() => `${Math.round(this.pct() * 100)}%`);

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
    const pm = this.progressByCountry();
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
    if (f === 'almost') {
      arr = arr.filter((c) => {
        const got = pm.get(c.code)?.obtained ?? 0;
        return got >= 14 && got < 20;
      });
    }
    if (f === 'empty') arr = arr.filter((c) => (pm.get(c.code)?.obtained ?? 0) === 0);
    return arr;
  });

  constructor() {
    addIcons({ chevronDown, search, arrowForward, close, chevronBack, swapHorizontal, person, image, gift });
  }

  ngOnInit(): void {
    const u = this.route.snapshot.paramMap.get('username') ?? '';
    this.username.set(u);
    this.loading.set(true);

    forkJoin({
      countries: this.catalog.countries(),
      summary: this.album.friendSummary(u),
      stickers: this.catalog.allStickers(),
    }).subscribe({
      next: ({ countries, summary, stickers }) => {
        this.countries.set(countries);
        this.summary.set(summary);
        const byCountry: Record<string, Sticker[]> = {};
        for (const s of stickers) {
          if (!s.countryCode) continue;
          if (!byCountry[s.countryCode]) byCountry[s.countryCode] = [];
          byCountry[s.countryCode].push(s);
        }
        for (const code of Object.keys(byCountry)) {
          byCountry[code].sort((a, b) => (a.numberInCountry ?? 0) - (b.numberInCountry ?? 0));
        }
        this.allStickersByCountry.set(byCountry);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message ?? 'No se pudo cargar el álbum del amigo');
        this.loading.set(false);
      },
    });
  }

  initials(name: string): string {
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? parts[0]?.[1] ?? '')).toUpperCase();
  }

  flag(iso2: string): string {
    return flagUrl(iso2, 80);
  }

  onSearch(e: Event): void {
    const v = (e.target as HTMLInputElement).value.trim();
    this.query.set(v);
    if (v.length >= 2) {
      const matches = this.matchedByPlayer();
      if (matches.size > 0) {
        this.expandedCodes.set(new Set(matches));
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
    return this.progressByCountry().get(code)?.obtained ?? 0;
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
    if (cur.has(code)) cur.delete(code);
    else cur.add(code);
    this.expandedCodes.set(cur);
  }

  stickersFor(code: string): Sticker[] {
    return this.allStickersByCountry()[code] ?? [];
  }

  matchesQuery(s: Sticker): boolean {
    const q = this.query().toLowerCase();
    if (q.length < 2) return false;
    if (s.stickerType !== 'PLAYER') return false;
    return s.displayName.toLowerCase().includes(q);
  }

  qtyOf(stickerCode: string): number {
    return this.summary()?.stickerQuantities[stickerCode] ?? 0;
  }

  isOwned(stickerCode: string): boolean {
    return this.qtyOf(stickerCode) > 0;
  }

  openCountry(code: string): void {
    this.router.navigate(['/friends', this.username(), 'album', code]);
  }

  openTrade(): void {
    this.router.navigate(['/friends', this.username(), 'trade']);
  }

  back(): void {
    this.router.navigateByUrl('/tabs/friends');
  }
}
