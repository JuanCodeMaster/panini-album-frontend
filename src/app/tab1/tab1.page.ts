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
  notifications,
  person,
  arrowForward,
  logOutOutline,
  swapHorizontal,
  flame,
  sparkles,
  gift,
  arrowUp,
  arrowDown,
} from 'ionicons/icons';
import { AuthService } from '../core/services/auth.service';
import { AlbumService } from '../core/services/album.service';
import { CatalogService } from '../core/services/catalog.service';
import { SocialService } from '../core/services/social.service';
import { ProgressRingComponent } from '../shared/progress-ring/progress-ring.component';
import { Country, Sticker, flagUrl } from '../core/models/catalog.model';
import { UserSticker } from '../core/models/album.model';
import { TradeSuggestion } from '../core/models/trade-proposal.model';

interface AlmostDone {
  country: Country;
  obtained: number;
  remaining: number;
}

interface RecentSticker {
  us: UserSticker;
  sticker: Sticker | null;
  country: Country | null;
}

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  imports: [CommonModule, IonContent, IonIcon, IonSpinner, ProgressRingComponent],
})
export class Tab1Page implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly album = inject(AlbumService);
  private readonly catalog = inject(CatalogService);
  private readonly social = inject(SocialService);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly countries = signal<Country[]>([]);
  readonly currentUser = this.auth.currentUser;
  readonly summary = this.album.summary;
  readonly pendingFriends = this.social.incomingCount;
  readonly pendingProposals = this.social.pendingProposalsCount;

  private readonly stickerByCode = signal<Map<string, Sticker>>(new Map());
  private readonly recentRaw = signal<UserSticker[]>([]);
  readonly suggestions = signal<TradeSuggestion[]>([]);

  readonly firstName = computed(() => {
    const u = this.currentUser();
    const name = u?.displayName || u?.username || '';
    return name.split(/\s+/)[0] || '';
  });

  readonly pct = computed(() => {
    const s = this.summary();
    if (!s) return 0;
    return s.obtained / Math.max(s.totalStickers, 1);
  });

  readonly pctLabel = computed(() => `${Math.round(this.pct() * 100)}%`);

  readonly daysToWorldCup = computed(() => {
    const wc = new Date('2026-06-11T18:00:00Z').getTime();
    const now = Date.now();
    return Math.max(0, Math.ceil((wc - now) / (1000 * 60 * 60 * 24)));
  });

  readonly almostDone = computed<AlmostDone[]>(() => {
    const s = this.summary();
    const cs = this.countries();
    if (!s || !cs.length) return [];
    const meta = new Map(cs.map((c) => [c.code, c]));
    return s.countries
      .filter((c) => c.obtained >= 14 && c.obtained < 20)
      .sort((a, b) => b.obtained - a.obtained)
      .slice(0, 5)
      .map((c) => ({
        country: meta.get(c.countryCode)!,
        obtained: c.obtained,
        remaining: c.total - c.obtained,
      }))
      .filter((x) => x.country);
  });

  readonly recent = computed<RecentSticker[]>(() => {
    const stickers = this.stickerByCode();
    const meta = new Map(this.countries().map((c) => [c.code, c]));
    return this.recentRaw().map((us) => {
      const s = stickers.get(us.stickerCode) ?? null;
      const country = us.countryCode ? meta.get(us.countryCode) ?? null : null;
      return { us, sticker: s, country };
    });
  });

  constructor() {
    addIcons({
      notifications,
      person,
      arrowForward,
      logOutOutline,
      swapHorizontal,
      flame,
      sparkles,
      gift,
      arrowUp,
      arrowDown,
    });
  }

  ngOnInit(): void {
    this.loading.set(true);
    forkJoin({
      countries: this.catalog.countries(),
      summary: this.album.loadSummary(),
      stickers: this.catalog.allStickers(),
      recent: this.album.recent(5),
      suggestions: this.social.tradeSuggestions(3),
    }).subscribe({
      next: ({ countries, stickers, recent, suggestions }) => {
        this.countries.set(countries);
        this.stickerByCode.set(new Map(stickers.map((s) => [s.code, s])));
        this.recentRaw.set(recent);
        this.suggestions.set(suggestions);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    this.social.incoming().subscribe({ error: () => {} });
    this.social.proposalsPendingCount().subscribe({ error: () => {} });
  }

  flag(iso2: string): string {
    return flagUrl(iso2, 160);
  }

  initials(name: string | null, fallback: string): string {
    const n = (name || fallback).trim();
    const parts = n.split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? parts[0]?.[1] ?? '')).toUpperCase();
  }

  go(path: string): void {
    this.router.navigateByUrl(path);
  }

  openCountry(code: string): void {
    this.router.navigate(['/tabs/tab2', code]);
  }

  openTradeWith(username: string): void {
    this.router.navigate(['/tabs/friends', username, 'trade']);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
