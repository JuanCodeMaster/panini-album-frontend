import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronBack, send } from 'ionicons/icons';
import { SocialService } from '../../core/services/social.service';
import { AuthService } from '../../core/services/auth.service';
import { TradeMessage } from '../../core/models/trade-proposal.model';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
  imports: [CommonModule, IonContent, IonIcon, IonSpinner],
})
export class ChatPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly social = inject(SocialService);
  private readonly auth = inject(AuthService);

  readonly proposalId = signal<number>(0);
  readonly withName = signal<string>('Chat');
  readonly messages = signal<TradeMessage[]>([]);
  readonly loading = signal(true);
  readonly draft = signal('');
  readonly sending = signal(false);

  private readonly myUsername = computed(() => this.auth.currentUser()?.username ?? '');
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    addIcons({ chevronBack, send });
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id') ?? 0);
    this.proposalId.set(id);
    this.withName.set(this.route.snapshot.queryParamMap.get('with') ?? 'Chat');
    this.load(true);
    // Sondeo cada 4s
    this.pollTimer = setInterval(() => this.load(false), 4000);
  }

  ngOnDestroy(): void {
    if (this.pollTimer) clearInterval(this.pollTimer);
  }

  private load(initial: boolean): void {
    this.social.proposalMessages(this.proposalId()).subscribe({
      next: (list) => {
        const before = this.messages().length;
        this.messages.set(list);
        if (initial) this.loading.set(false);
        if (list.length !== before) {
          setTimeout(() => this.scrollToBottom(), 50);
        }
      },
      error: () => {
        if (initial) this.loading.set(false);
      },
    });
  }

  isMine(m: TradeMessage): boolean {
    return m.senderUsername === this.myUsername();
  }

  onInput(e: Event): void {
    this.draft.set((e.target as HTMLTextAreaElement).value);
  }

  send(): void {
    const text = this.draft().trim();
    if (!text || this.sending()) return;
    this.sending.set(true);
    this.social.sendProposalMessage(this.proposalId(), text).subscribe({
      next: (msg) => {
        this.messages.set([...this.messages(), msg]);
        this.draft.set('');
        this.sending.set(false);
        setTimeout(() => this.scrollToBottom(), 50);
      },
      error: () => this.sending.set(false),
    });
  }

  private scrollToBottom(): void {
    const el = document.querySelector('.chat-scroll');
    if (el) el.scrollTop = el.scrollHeight;
  }

  back(): void {
    this.location.back();
  }

  time(iso: string): string {
    try {
      return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }
}
