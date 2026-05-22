import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  checkmarkCircle,
  closeCircle,
  copyOutline,
  arrowForward,
  searchOutline,
  layers,
} from 'ionicons/icons';
import { AlbumService } from '../core/services/album.service';
import { CatalogService } from '../core/services/catalog.service';
import { Country, flagUrl } from '../core/models/catalog.model';
import { ProgressRingComponent } from '../shared/progress-ring/progress-ring.component';

interface CountryRow {
  code: string;
  name: string;
  iso2: string;
  obtained: number;
  total: number;
  progressPct: number;
}

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  imports: [CommonModule, IonContent, IonIcon, IonSpinner, ProgressRingComponent],
})
export class Tab3Page implements OnInit {
  private readonly catalog = inject(CatalogService);
  private readonly router = inject(Router);
  readonly album = inject(AlbumService);

  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  private readonly countriesMeta = signal<Country[]>([]);

  readonly summary = this.album.summary;

  readonly rows = computed<CountryRow[]>(() => {
    const sum = this.summary();
    const metas = this.countriesMeta();
    if (!sum || !metas.length) return [];
    const metaByCode = new Map(metas.map((c) => [c.code, c]));
    return sum.countries
      .map((c) => {
        const m = metaByCode.get(c.countryCode);
        return {
          code: c.countryCode,
          name: m?.name ?? c.countryCode,
          iso2: m?.iso2 ?? '',
          obtained: c.obtained,
          total: c.total,
          progressPct: c.progressPct,
        };
      })
      .sort((a, b) => b.progressPct - a.progressPct || a.name.localeCompare(b.name));
  });

  readonly topCountries = computed(() => this.rows().slice(0, 5));
  readonly bottomCountries = computed(() => {
    const arr = this.rows();
    return arr.slice(-5).reverse();
  });

  readonly progressValue = computed(() => {
    const s = this.summary();
    return s ? s.obtained / Math.max(s.totalStickers, 1) : 0;
  });

  readonly pctLabel = computed(() => {
    const s = this.summary();
    return s ? `${Math.round(s.progressPct)}%` : '0%';
  });

  constructor() {
    addIcons({ checkmarkCircle, closeCircle, copyOutline, arrowForward, searchOutline, layers });
  }

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    forkJoin({
      countries: this.catalog.countries(),
      summary: this.album.loadSummary(),
    }).subscribe({
      next: ({ countries }) => {
        this.countriesMeta.set(countries);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message ?? 'Error al cargar estadísticas');
        this.loading.set(false);
      },
    });
  }

  flag(iso2: string): string {
    return iso2 ? flagUrl(iso2, 80) : '';
  }

  openCountry(code: string): void {
    this.router.navigate(['/tabs/tab2', code]);
  }

  goMissing(): void {
    this.router.navigateByUrl('/tabs/tab3/missing');
  }

  goDuplicates(): void {
    this.router.navigateByUrl('/tabs/tab3/duplicates');
  }
}
