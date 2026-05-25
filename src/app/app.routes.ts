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
    redirectTo: 'tabs/friends',
    pathMatch: 'full',
  },
  {
    path: 'friends/:username/trade',
    redirectTo: 'tabs/friends/:username/trade',
  },
  {
    path: 'friends/:username/album',
    redirectTo: 'tabs/friends/:username/album',
  },
  {
    path: 'friends/:username/album/:code',
    redirectTo: 'tabs/friends/:username/album/:code',
  },
  {
    path: 'trades',
    redirectTo: 'tabs/trades',
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
