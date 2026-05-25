import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  IonContent,
  IonIcon,
  IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chevronBack,
  swapHorizontal,
  arrowUp,
  arrowDown,
  gift,
  checkmark,
  sendOutline,
  sparkles,
  shieldOutline,
  imageOutline,
  personOutline,
  alertCircle,
  chevronDown,
  chevronUp,
  search,
  close,
} from 'ionicons/icons';
import { SocialService } from '../../core/services/social.service';
import { CatalogService } from '../../core/services/catalog.service';
import { TradeMatch } from '../../core/models/social.model';
import { Country, Sticker, flagUrl } from '../../core/models/catalog.model';

interface StickerGroup {
  countryCode: string | null;
  countryName: string;
  iso2: string | null;
  stickers: Sticker[];
}

@Component({
  selector: 'app-trade',
  templateUrl: './trade.page.html',
  styleUrls: ['./trade.page.scss'],
  imports: [CommonModule, IonContent, IonIcon, IonSpinner],
})
export class TradePage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly social = inject(SocialService);
  private readonly catalog = inject(CatalogService);

  readonly loading = signal(true);
  readonly sending = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly match = signal<TradeMatch | null>(null);
  readonly mode = signal<'trade' | 'gift'>('trade');
  readonly selectedGive = signal<Set<string>>(new Set());
  readonly selectedReceive = signal<Set<string>>(new Set());
  readonly message = signal('');
  private readonly countriesMap = signal<Map<string, Country>>(new Map());

  readonly canSend = computed(() => {
    if (this.mode() === 'gift') return this.selectedGive().size > 0;
    return this.selectedGive().size > 0 && this.selectedReceive().size > 0;
  });

  readonly searchQuery = signal('');
  readonly collapsedGroups = signal<Set<string>>(new Set());

  readonly groupedGive = computed<StickerGroup[]>(() =>
    this.applyFilter(this.group(this.match()?.youGive ?? []))
  );
  readonly groupedReceive = computed<StickerGroup[]>(() =>
    this.applyFilter(this.group(this.match()?.youReceive ?? []))
  );

  readonly totalGiveMatches = computed(() =>
    this.groupedGive().reduce((acc, g) => acc + g.stickers.length, 0)
  );
  readonly totalReceiveMatches = computed(() =>
    this.groupedReceive().reduce((acc, g) => acc + g.stickers.length, 0)
  );

  constructor() {
    addIcons({
      chevronBack,
      swapHorizontal,
      arrowUp,
      arrowDown,
      gift,
      checkmark,
      sendOutline,
      sparkles,
      shieldOutline,
      imageOutline,
      personOutline,
      alertCircle,
      chevronDown,
      chevronUp,
      search,
      close,
    });
  }

  private applyFilter(groups: StickerGroup[]): StickerGroup[] {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map((g) => ({
        ...g,
        stickers: g.stickers.filter((s) =>
          s.displayName.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q) ||
          g.countryName.toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.stickers.length > 0);
  }

  onSearch(e: Event): void {
    this.searchQuery.set((e.target as HTMLInputElement).value);
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  isCollapsed(side: 'give' | 'receive', countryCode: string | null): boolean {
    // Si hay búsqueda activa, fuerza a mostrar resultados — no escondas matches.
    if (this.searchQuery().trim()) return false;
    return this.collapsedGroups().has(`${side}:${countryCode ?? '__SPECIAL__'}`);
  }

  toggleCollapse(side: 'give' | 'receive', countryCode: string | null): void {
    const key = `${side}:${countryCode ?? '__SPECIAL__'}`;
    const s = new Set(this.collapsedGroups());
    if (s.has(key)) s.delete(key);
    else s.add(key);
    this.collapsedGroups.set(s);
  }

  collapseAll(side: 'give' | 'receive'): void {
    const groups = side === 'give' ? this.groupedGive() : this.groupedReceive();
    const s = new Set(this.collapsedGroups());
    for (const g of groups) s.add(`${side}:${g.countryCode ?? '__SPECIAL__'}`);
    this.collapsedGroups.set(s);
  }

  expandAll(side: 'give' | 'receive'): void {
    const s = new Set(this.collapsedGroups());
    for (const k of Array.from(s)) {
      if (k.startsWith(`${side}:`)) s.delete(k);
    }
    this.collapsedGroups.set(s);
  }

  allCollapsed(side: 'give' | 'receive'): boolean {
    const groups = side === 'give' ? this.groupedGive() : this.groupedReceive();
    if (groups.length === 0) return false;
    return groups.every((g) => this.isCollapsed(side, g.countryCode));
  }

  ngOnInit(): void {
    const username = this.route.snapshot.paramMap.get('username') ?? '';
    forkJoin({
      countries: this.catalog.countries(),
      match: this.social.tradeMatches(username),
    }).subscribe({
      next: ({ countries, match }) => {
        this.countriesMap.set(new Map(countries.map((c) => [c.code, c])));
        this.match.set(match);
        // Por defecto todos los grupos vienen colapsados — es mucha info
        // y el usuario los expande sólo los que le interesan.
        const initial = new Set<string>();
        for (const s of match.youGive ?? []) {
          initial.add(`give:${s.countryCode ?? '__SPECIAL__'}`);
        }
        for (const s of match.youReceive ?? []) {
          initial.add(`receive:${s.countryCode ?? '__SPECIAL__'}`);
        }
        this.collapsedGroups.set(initial);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message ?? 'Error al cargar intercambios');
        this.loading.set(false);
      },
    });
  }

  private group(stickers: Sticker[]): StickerGroup[] {
    const map = new Map<string, StickerGroup>();
    const countries = this.countriesMap();
    for (const s of stickers) {
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
  }

  flag(iso2: string | null): string {
    return iso2 ? flagUrl(iso2, 80) : '';
  }

  initials(name: string | null, fallback: string): string {
    const n = (name || fallback).trim();
    const parts = n.split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? parts[0]?.[1] ?? '')).toUpperCase();
  }

  iconFor(type: string): string {
    if (type === 'BADGE') return 'shield-outline';
    if (type === 'TEAM_PHOTO') return 'image-outline';
    if (type === 'PLAYER') return 'person-outline';
    return 'sparkles';
  }

  setMode(mode: 'trade' | 'gift'): void {
    this.mode.set(mode);
    if (mode === 'gift') this.selectedReceive.set(new Set());
  }

  isGiveSelected(code: string): boolean {
    return this.selectedGive().has(code);
  }
  isReceiveSelected(code: string): boolean {
    return this.selectedReceive().has(code);
  }

  toggleGive(code: string): void {
    const s = new Set(this.selectedGive());
    if (s.has(code)) s.delete(code);
    else s.add(code);
    this.selectedGive.set(s);
  }

  toggleReceive(code: string): void {
    if (this.mode() === 'gift') return;
    const s = new Set(this.selectedReceive());
    if (s.has(code)) s.delete(code);
    else s.add(code);
    this.selectedReceive.set(s);
  }

  selectAllGive(): void {
    const codes = (this.match()?.youGive ?? []).map((s) => s.code);
    this.selectedGive.set(new Set(codes));
  }

  selectAllReceive(): void {
    if (this.mode() === 'gift') return;
    const codes = (this.match()?.youReceive ?? []).map((s) => s.code);
    this.selectedReceive.set(new Set(codes));
  }

  clearSelections(): void {
    this.selectedGive.set(new Set());
    this.selectedReceive.set(new Set());
  }

  onMessageChange(e: Event): void {
    this.message.set((e.target as HTMLTextAreaElement).value);
  }

  send(): void {
    const m = this.match();
    if (!m || !this.canSend() || this.sending()) return;
    this.sending.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.social
      .createProposal({
        addresseeUsername: m.friend.username,
        stickersGiven: Array.from(this.selectedGive()),
        stickersReceived: this.mode() === 'gift' ? [] : Array.from(this.selectedReceive()),
        message: this.message().trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.sending.set(false);
          this.successMessage.set(
            this.mode() === 'gift' ? '¡Regalo enviado!' : '¡Propuesta enviada!'
          );
          this.clearSelections();
          this.message.set('');
          setTimeout(() => this.router.navigateByUrl('/tabs/trades'), 1200);
        },
        error: (err) => {
          this.sending.set(false);
          this.errorMessage.set(err?.error?.message ?? 'Error al enviar la propuesta');
        },
      });
  }

  back(): void {
    const m = this.match();
    if (m) {
      this.router.navigate(['/tabs/friends', m.friend.username, 'album']);
    } else {
      this.router.navigateByUrl('/tabs/friends');
    }
  }

  openAlbum(): void {
    const m = this.match();
    if (m) this.router.navigate(['/tabs/friends', m.friend.username, 'album']);
  }
}
