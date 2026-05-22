import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  albumsOutline,
  swapHorizontalOutline,
  trendingUpOutline,
  peopleOutline,
  arrowForward,
  trophyOutline,
} from 'ionicons/icons';

interface Slide {
  badge: string;
  icon: string;
  title: string;
  highlight: string;
  body: string;
  hint: string;
}

@Component({
  selector: 'app-onboarding',
  templateUrl: './onboarding.page.html',
  styleUrls: ['./onboarding.page.scss'],
  imports: [CommonModule, IonContent, IonIcon],
})
export class OnboardingPage {
  readonly slides: Slide[] = [
    {
      badge: 'PASO 01',
      icon: 'albums-outline',
      title: 'Arma tu',
      highlight: 'ÁLBUM',
      body: 'Marca cada figurita que vas pegando. Toca una vez para sumar, vuelve a tocar y se suma como repetida.',
      hint: 'Tab Álbum · 980 stickers · 48 selecciones',
    },
    {
      badge: 'PASO 02',
      icon: 'trending-up-outline',
      title: 'Mira tu',
      highlight: 'PROGRESO',
      body: 'Estadísticas en vivo: porcentaje global, países completos, repetidas y faltantes. Sin perder de vista nada.',
      hint: 'Tab Stats · gráficos por grupo y país',
    },
    {
      badge: 'PASO 03',
      icon: 'people-outline',
      title: 'Conéctate con',
      highlight: 'AMIGOS',
      body: 'Agrega a tus parceros, revisa su álbum y descubre qué figuritas les faltan en segundos.',
      hint: 'Sección Amigos · álbum visible · matching automático',
    },
    {
      badge: 'PASO 04',
      icon: 'swap-horizontal-outline',
      title: 'Cierra el',
      highlight: 'INTERCAMBIO',
      body: 'Propón un cambio o regala las que te sobran. Solicitud, confirmación y listo: a pegar.',
      hint: 'Modo regalo disponible · notificaciones en la app',
    },
  ];

  readonly index = signal(0);
  readonly current = computed(() => this.slides[this.index()]);
  readonly isLast = computed(() => this.index() === this.slides.length - 1);

  constructor(private router: Router) {
    addIcons({
      albumsOutline,
      swapHorizontalOutline,
      trendingUpOutline,
      peopleOutline,
      arrowForward,
      trophyOutline,
    });
  }

  go(i: number): void {
    if (i < 0 || i >= this.slides.length) return;
    this.index.set(i);
  }

  next(): void {
    if (this.isLast()) {
      this.finish();
      return;
    }
    this.index.update((v) => v + 1);
  }

  prev(): void {
    if (this.index() === 0) return;
    this.index.update((v) => v - 1);
  }

  skip(): void {
    this.finish();
  }

  private finish(): void {
    try {
      localStorage.setItem('panini.onboarding.done', '1');
    } catch {}
    this.router.navigateByUrl('/tabs/tab1');
  }
}
