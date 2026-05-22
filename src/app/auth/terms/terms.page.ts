import { Component, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronBack } from 'ionicons/icons';

@Component({
  selector: 'app-terms',
  templateUrl: './terms.page.html',
  styleUrls: ['./terms.page.scss'],
  imports: [CommonModule, IonContent, IonIcon],
})
export class TermsPage {
  private readonly location = inject(Location);

  constructor() {
    addIcons({ chevronBack });
  }

  back(): void {
    this.location.back();
  }
}
