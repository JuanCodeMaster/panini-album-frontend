import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./auth/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./auth/register/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'terms',
    loadComponent: () => import('./auth/terms/terms.page').then((m) => m.TermsPage),
  },
  {
    path: 'onboarding',
    canActivate: [authGuard],
    loadComponent: () => import('./auth/onboarding/onboarding.page').then((m) => m.OnboardingPage),
  },
  {
    path: 'tabs',
    canActivate: [authGuard],
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
  },
  {
    path: 'friends',
    canActivate: [authGuard],
    loadComponent: () => import('./social/friends/friends.page').then((m) => m.FriendsPage),
  },
  {
    path: 'friends/:username/trade',
    canActivate: [authGuard],
    loadComponent: () => import('./social/trade/trade.page').then((m) => m.TradePage),
  },
  {
    path: 'friends/:username/album',
    canActivate: [authGuard],
    loadComponent: () => import('./social/friend-album/friend-album.page').then((m) => m.FriendAlbumPage),
  },
  {
    path: 'friends/:username/album/:code',
    canActivate: [authGuard],
    loadComponent: () => import('./social/friend-country/friend-country.page').then((m) => m.FriendCountryPage),
  },
  {
    path: 'trades',
    canActivate: [authGuard],
    loadComponent: () => import('./social/proposals/proposals.page').then((m) => m.ProposalsPage),
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'tabs/tab1',
  },
  {
    path: '**',
    redirectTo: 'tabs/tab1',
  },
];
