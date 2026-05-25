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
  sectionCode: string | null;
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
  readonly expandedGroups = signal<Set<string>>(new Set());
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
      const isCocaCola = s.sectionCode === 'COCACOLA';
      const key = isCocaCola ? 'COCACOLA' : (s.countryCode ?? s.sectionCode ?? '__SPECIAL__');
      if (!map.has(key)) {
        const country = s.countryCode ? countries.get(s.countryCode) : null;
        map.set(key, {
          countryCode: isCocaCola ? null : s.countryCode,
          countryName: isCocaCola ? 'Coca-Cola Exclusivos' : (country?.name ?? (s.countryCode ?? 'Especiales')),
          iso2: isCocaCola ? null : (country?.iso2 ?? null),
          sectionCode: s.sectionCode,
          stickers: [],
        });
      }
      map.get(key)!.stickers.push(s);
    }
    return Array.from(map.values())
      .map((group) => ({
        ...group,
        stickers: [...group.stickers].sort((a, b) => this.compareStickers(a, b)),
      }))
      .sort((a, b) => this.compareGroups(a, b, countries));
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

  groupIcon(group: GroupedMissing): string {
    return group.sectionCode === 'COCACOLA' ? 'sparkles' : 'chevron-forward';
  }

  private compareGroups(a: GroupedMissing, b: GroupedMissing, countries: Map<string, Country>): number {
    const aIsTeam = !!a.countryCode;
    const bIsTeam = !!b.countryCode;
    if (aIsTeam && bIsTeam) {
      const ao = countries.get(a.countryCode!)?.displayOrder ?? 999;
      const bo = countries.get(b.countryCode!)?.displayOrder ?? 999;
      if (ao !== bo) return ao - bo;
      return a.countryName.localeCompare(b.countryName, 'es');
    }
    if (aIsTeam !== bIsTeam) return aIsTeam ? -1 : 1;
    return a.countryName.localeCompare(b.countryName, 'es');
  }

  private compareStickers(a: Sticker, b: Sticker): number {
    const an = a.numberInCountry ?? Number.MAX_SAFE_INTEGER;
    const bn = b.numberInCountry ?? Number.MAX_SAFE_INTEGER;
    if (an !== bn) return an - bn;
    return a.code.localeCompare(b.code, undefined, { numeric: true });
  }

  onSearch(e: Event): void {
    this.query.set((e.target as HTMLInputElement).value.trim());
  }

  clearSearch(): void {
    this.query.set('');
  }

  groupKey(group: GroupedMissing): string {
    return group.sectionCode + '-' + (group.countryCode || group.countryName);
  }

  isCollapsed(group: GroupedMissing): boolean {
    return !this.expandedGroups().has(this.groupKey(group));
  }

  toggleGroup(group: GroupedMissing): void {
    const key = this.groupKey(group);
    const next = new Set(this.expandedGroups());
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    this.expandedGroups.set(next);
  }

  back(): void {
    this.location.back();
  }

  openCountry(code: string | null): void {
    if (code) this.router.navigate(['/tabs/tab2', code]);
  }
}
