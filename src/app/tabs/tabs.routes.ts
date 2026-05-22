import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'tab1',
        loadComponent: () =>
          import('../tab1/tab1.page').then((m) => m.Tab1Page),
      },
      {
        path: 'tab2',
        loadComponent: () =>
          import('../tab2/tab2.page').then((m) => m.Tab2Page),
      },
      {
        path: 'tab2/specials',
        loadComponent: () =>
          import('../album/specials/specials.page').then((m) => m.SpecialsPage),
      },
      {
        path: 'tab2/:code',
        loadComponent: () =>
          import('../album/country-detail/country-detail.page').then((m) => m.CountryDetailPage),
      },
      {
        path: 'tab3',
        loadComponent: () =>
          import('../tab3/tab3.page').then((m) => m.Tab3Page),
      },
      {
        path: 'tab3/missing',
        loadComponent: () =>
          import('../album/missing/missing.page').then((m) => m.MissingPage),
      },
      {
        path: 'tab3/duplicates',
        loadComponent: () =>
          import('../album/duplicates/duplicates.page').then((m) => m.DuplicatesPage),
      },
      {
        path: 'friends',
        loadComponent: () =>
          import('../social/friends/friends.page').then((m) => m.FriendsPage),
      },
      {
        path: '',
        redirectTo: 'tab1',
        pathMatch: 'full',
      },
    ],
  },
];
