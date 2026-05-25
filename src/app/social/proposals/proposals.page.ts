import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowDown,
  arrowUp,
  gift,
  swapHorizontal,
  checkmark,
  close,
  time,
  chevronBack,
  trash,
  locationOutline,
  navigateOutline,
  chatbubbleEllipsesOutline,
} from 'ionicons/icons';
import { SocialService } from '../../core/services/social.service';
import { CatalogService } from '../../core/services/catalog.service';
import { LocationService } from '../../core/services/location.service';
import { TradeProposal, NearbySuggestion } from '../../core/models/trade-proposal.model';
import { Country, Sticker, flagUrl } from '../../core/models/catalog.model';

type Tab = 'incoming' | 'outgoing' | 'history';

@Component({
  selector: 'app-proposals',
  templateUrl: './proposals.page.html',
  styleUrls: ['./proposals.page.scss'],
  imports: [CommonModule, IonContent, IonIcon, IonSpinner],
})
export class ProposalsPage implements OnInit {
  private readonly social = inject(SocialService);
  private readonly catalog = inject(CatalogService);
  private readonly router = inject(Router);
  readonly location = inject(LocationService);

  readonly nearby = signal<NearbySuggestion[]>([]);

  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly tab = signal<Tab>('incoming');
  readonly incoming = signal<TradeProposal[]>([]);
  readonly outgoing = signal<TradeProposal[]>([]);
  readonly history = signal<TradeProposal[]>([]);
  readonly stickerByCode = signal<Map<string, Sticker>>(new Map());
  private readonly countriesMap = signal<Map<string, Country>>(new Map());
  readonly expandedIds = signal<Set<number>>(new Set());

  readonly list = computed<TradeProposal[]>(() => {
    if (this.tab() === 'incoming') return this.incoming();
    if (this.tab() === 'outgoing') return this.outgoing();
    return this.history();
  });

  constructor() {
    addIcons({
      arrowDown,
      arrowUp,
      gift,
      swapHorizontal,
      checkmark,
      close,
      time,
      chevronBack,
      trash,
      locationOutline,
      navigateOutline,
      chatbubbleEllipsesOutline,
    });
  }

  ngOnInit(): void {
    this.refresh();
    this.location.loadStatus().then(() => this.loadNearby());
  }

  loadNearby(): void {
    if (!this.location.sharing()) {
      this.nearby.set([]);
      return;
    }
    this.social.nearbySuggestions().subscribe({
      next: (list) => this.nearby.set(list),
      error: () => this.nearby.set([]),
    });
  }

  async toggleLocation(): Promise<void> {
    if (this.location.sharing()) {
      await this.location.disable();
      this.nearby.set([]);
    } else {
      const ok = await this.location.enable();
      if (ok) this.loadNearby();
    }
  }

  openTradeWith(username: string): void {
    this.router.navigate(['/tabs/friends', username, 'trade']);
  }

  openChat(p: TradeProposal): void {
    const other = this.otherUser(p);
    this.router.navigate(['/tabs/trades', p.id, 'chat'], {
      queryParams: { with: other.displayName || other.username },
    });
  }

  refresh(): void {
    this.loading.set(true);
    forkJoin({
      stickers: this.catalog.allStickers(),
      countries: this.catalog.countries(),
      incoming: this.social.incomingProposals(),
      outgoing: this.social.outgoingProposals(),
      history: this.social.proposalHistory(),
    }).subscribe({
      next: ({ stickers, countries, incoming, outgoing, history }) => {
        this.stickerByCode.set(new Map(stickers.map((s) => [s.code, s])));
        this.countriesMap.set(new Map(countries.map((c) => [c.code, c])));
        this.incoming.set(incoming);
        this.outgoing.set(outgoing);
        this.history.set(history);
        // Las recibidas pendientes arrancan expandidas (hay que actuar);
        // el resto colapsadas para no saturar.
        this.expandedIds.set(
          new Set(incoming.filter((p) => p.status === 'PENDING').map((p) => p.id))
        );
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message ?? 'Error al cargar propuestas');
        this.loading.set(false);
      },
    });
  }

  setTab(t: Tab): void {
    this.tab.set(t);
  }

  isExpanded(id: number): boolean {
    return this.expandedIds().has(id);
  }

  toggle(id: number): void {
    const s = new Set(this.expandedIds());
    if (s.has(id)) s.delete(id);
    else s.add(id);
    this.expandedIds.set(s);
  }

  initials(name: string | null, fallback: string): string {
    const n = (name || fallback).trim();
    const parts = n.split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? parts[0]?.[1] ?? '')).toUpperCase();
  }

  stickerName(code: string): string {
    return this.stickerByCode().get(code)?.displayName ?? code;
  }

  stickerImage(code: string): string | null {
    return this.stickerByCode().get(code)?.imageUrl ?? null;
  }

  isFoil(code: string): boolean {
    return this.stickerByCode().get(code)?.foil ?? false;
  }

  /** Nombre del país del cromo (o "Especial" para intro/museo/coca-cola sin país) */
  stickerCountry(code: string): string {
    const cc = this.stickerByCode().get(code)?.countryCode;
    if (!cc) return 'Especial';
    return this.countriesMap().get(cc)?.name ?? cc;
  }

  /** Bandera del país del cromo (vacío si no tiene país) */
  stickerFlag(code: string): string {
    const cc = this.stickerByCode().get(code)?.countryCode;
    if (!cc) return '';
    const c = this.countriesMap().get(cc);
    return c ? flagUrl(c.iso2, 40) : '';
  }

  /** Código formateado: "ARG10" → "ARG 10", "FWC1" → "FWC 1" */
  prettyCode(code: string): string {
    return code.replace(/^([A-Za-z]+)(\d+)$/, '$1 $2');
  }

  // Para incoming/history, el otro lado es el requester
  // Para outgoing, el otro lado es el addressee
  otherUser(p: TradeProposal) {
    return this.tab() === 'outgoing' ? p.addressee : p.requester;
  }

  accept(id: number): void {
    this.social.acceptProposal(id).subscribe({
      next: () => this.refresh(),
      error: (err) => this.errorMessage.set(err?.error?.message ?? 'Error al aceptar'),
    });
  }

  reject(id: number): void {
    this.social.rejectProposal(id).subscribe(() => this.refresh());
  }

  cancel(id: number): void {
    this.social.cancelProposal(id).subscribe(() => this.refresh());
  }

  back(): void {
    this.router.navigateByUrl('/tabs/friends');
  }

  statusLabel(p: TradeProposal): string {
    if (p.status === 'ACCEPTED') return 'Aceptado';
    if (p.status === 'REJECTED') return 'Rechazado';
    if (p.status === 'CANCELLED') return 'Cancelado';
    return 'Pendiente';
  }
}
