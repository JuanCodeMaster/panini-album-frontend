import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personAdd,
  checkmark,
  close,
  trash,
  search,
  swapHorizontal,
  hourglass,
  personCircleOutline,
  chevronForward,
} from 'ionicons/icons';
import { SocialService } from '../../core/services/social.service';
import { Friend, Friendship } from '../../core/models/social.model';

@Component({
  selector: 'app-friends',
  templateUrl: './friends.page.html',
  styleUrls: ['./friends.page.scss'],
  imports: [CommonModule, IonContent, IonIcon, IonSpinner],
})
export class FriendsPage implements OnInit {
  private readonly social = inject(SocialService);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  readonly friends = signal<Friend[]>([]);
  readonly incoming = signal<Friendship[]>([]);
  readonly outgoing = signal<Friendship[]>([]);
  readonly searchResults = signal<Friend[]>([]);
  readonly searching = signal(false);

  private readonly searchSubject = new Subject<string>();

  constructor() {
    addIcons({
      personAdd,
      checkmark,
      close,
      trash,
      search,
      swapHorizontal,
      hourglass,
      personCircleOutline,
      chevronForward,
    });

    this.searchSubject
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        switchMap((q) => {
          this.searching.set(true);
          return this.social.search(q);
        })
      )
      .subscribe({
        next: (results) => {
          this.searchResults.set(results);
          this.searching.set(false);
        },
        error: () => this.searching.set(false),
      });
  }

  ngOnInit(): void {
    this.refresh();
    this.social.proposalsPendingCount().subscribe({ error: () => {} });
  }

  refresh(refresher?: CustomEvent): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    let done = 0;
    const finish = () => {
      done++;
      if (done === 3) {
        this.loading.set(false);
        (refresher?.target as HTMLIonRefresherElement | undefined)?.complete?.();
      }
    };

    this.social.friends().subscribe({
      next: (list) => { this.friends.set(list); finish(); },
      error: () => finish(),
    });
    this.social.incoming().subscribe({
      next: (list) => { this.incoming.set(list); finish(); },
      error: () => finish(),
    });
    this.social.outgoing().subscribe({
      next: (list) => { this.outgoing.set(list); finish(); },
      error: () => finish(),
    });
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value ?? '';
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      this.searchResults.set([]);
      return;
    }
    this.searchSubject.next(trimmed);
  }

  initials(friend: { username: string; displayName: string | null }): string {
    const name = (friend.displayName || friend.username).trim();
    const parts = name.split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? parts[0]?.[1] ?? '')).toUpperCase();
  }

  sendRequest(username: string): void {
    this.social.sendRequest(username).subscribe({
      next: () => {
        this.searchResults.set(this.searchResults().filter((u) => u.username !== username));
        this.refresh();
      },
      error: (err) => this.errorMessage.set(err?.error?.message ?? 'Error al enviar solicitud'),
    });
  }

  accept(id: number): void {
    this.social.accept(id).subscribe(() => this.refresh());
  }

  reject(id: number): void {
    this.social.reject(id).subscribe(() => this.refresh());
  }

  cancelOutgoing(id: number): void {
    this.social.reject(id).subscribe(() => this.refresh());
  }

  unfriend(username: string): void {
    this.social.unfriend(username).subscribe(() => this.refresh());
  }

  openTrade(username: string): void {
    this.router.navigate(['/friends', username, 'trade']);
  }

  openAlbum(username: string): void {
    this.router.navigate(['/friends', username, 'album']);
  }

  goTrades(): void {
    this.router.navigateByUrl('/trades');
  }

  readonly pendingProposals = this.social.pendingProposalsCount;

  isPendingTo(username: string): boolean {
    return this.outgoing().some((f) => f.addressee.username === username);
  }
}
