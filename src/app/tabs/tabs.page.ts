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
import { home, albums, statsChart, people } from 'ionicons/icons';
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

  constructor() {
    addIcons({ home, albums, statsChart, people });
  }

  ngOnInit(): void {
    this.social.incoming().subscribe({ error: () => {} });
  }
}
