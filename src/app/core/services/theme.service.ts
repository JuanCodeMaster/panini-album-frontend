import { Injectable, signal } from '@angular/core';

/**
 * Maneja el modo claro/oscuro de forma manual (no por sistema).
 * Añade/quita la clase `.ion-palette-dark` en <html> y persiste la
 * elección en localStorage. La primera vez sigue la preferencia del SO.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private static readonly KEY = 'fm:theme';
  readonly isDark = signal<boolean>(false);

  /** Llamar una vez al arrancar la app. */
  init(): void {
    const saved = localStorage.getItem(ThemeService.KEY);
    const prefersDark =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = saved ? saved === 'dark' : !!prefersDark;
    this.apply(dark);
  }

  toggle(): void {
    this.apply(!this.isDark());
  }

  set(dark: boolean): void {
    this.apply(dark);
  }

  private apply(dark: boolean): void {
    this.isDark.set(dark);
    document.documentElement.classList.toggle('ion-palette-dark', dark);
    localStorage.setItem(ThemeService.KEY, dark ? 'dark' : 'light');
  }
}
