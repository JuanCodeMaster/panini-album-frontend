import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronBack, image, person } from 'ionicons/icons';
import { CatalogService } from '../../core/services/catalog.service';
import { AlbumService } from '../../core/services/album.service';
import { Country, Sticker, flagUrl } from '../../core/models/catalog.model';

@Component({
  selector: 'app-friend-country',
  templateUrl: './friend-country.page.html',
  styleUrls: ['./friend-country.page.scss'],
  imports: [CommonModule, IonContent, IonIcon, IonSpinner],
})
export class FriendCountryPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly catalog = inject(CatalogService);
  private readonly album = inject(AlbumService);

  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly username = signal('');
  readonly code = signal('');
  readonly stickers = signal<Sticker[]>([]);
  readonly country = signal<Country | null>(null);
  private readonly quantities = signal<Record<string, number>>({});

  readonly obtainedCount = computed(() => {
    const q = this.quantities();
    return this.stickers().filter((s) => (q[s.code] ?? 0) > 0).length;
  });

  constructor() {
    addIcons({ chevronBack, image, person });
  }

  ngOnInit(): void {
    const u = this.route.snapshot.paramMap.get('username') ?? '';
    const code = this.route.snapshot.paramMap.get('code')?.toUpperCase() ?? '';
    this.username.set(u);
    this.code.set(code);

    forkJoin({
      countries: this.catalog.countries(),
      stickers: this.catalog.stickersByCountry(code),
      summary: this.album.friendSummary(u),
    }).subscribe({
      next: ({ countries, stickers, summary }) => {
        this.country.set(countries.find((c) => c.code === code) ?? null);
        this.stickers.set(stickers.filter((s) => this.isTeamSticker(s)));
        this.quantities.set(summary.stickerQuantities);
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

  qty(code: string): number {
    return this.quantities()[code] ?? 0;
  }

  isObtained(code: string): boolean {
    return this.qty(code) > 0;
  }

  private isTeamSticker(sticker: Sticker): boolean {
    const n = sticker.numberInCountry ?? 0;
    return sticker.sectionCode === 'TEAM' && n >= 1 && n <= 20;
  }

  back(): void {
    this.router.navigate(['/tabs/friends', this.username(), 'album']);
  }
}
