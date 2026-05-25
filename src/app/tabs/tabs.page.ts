import { Component, EnvironmentInjector, OnInit, inject } from '@angular/core';
import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
  IonBadge,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { home, albums, statsChart, people, swapHorizontal } from 'ionicons/icons';
import { SocialService } from '../core/services/social.service';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonBadge],
})
export class TabsPage implements OnInit {
  public environmentInjector = inject(EnvironmentInjector);
  private readonly social = inject(SocialService);

  readonly pending = this.social.incomingCount;
  readonly pendingProposals = this.social.pendingProposalsCount;

  constructor() {
    addIcons({ home, albums, statsChart, people, swapHorizontal });
  }

  ngOnInit(): void {
    this.social.incoming().subscribe({ error: () => {} });
    this.social.proposalsPendingCount().subscribe({ error: () => {} });
  }
}
