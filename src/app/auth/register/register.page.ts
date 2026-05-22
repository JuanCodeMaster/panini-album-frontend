import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowForward,
  chevronBack,
  albumsOutline,
  swapHorizontalOutline,
  trendingUpOutline,
  personOutline,
  mailOutline,
  lockClosedOutline,
  sparklesOutline,
  checkmark,
  alertCircle,
} from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  imports: [CommonModule, ReactiveFormsModule, RouterLink, IonContent, IonIcon, IonSpinner],
})
export class RegisterPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    email: ['', [Validators.required, Validators.email]],
    displayName: [''],
    password: ['', [Validators.required, Validators.minLength(6)]],
    acceptTerms: [false, [Validators.requiredTrue]],
  });

  constructor() {
    addIcons({
      arrowForward,
      chevronBack,
      albumsOutline,
      swapHorizontalOutline,
      trendingUpOutline,
      personOutline,
      mailOutline,
      lockClosedOutline,
      sparklesOutline,
      checkmark,
      alertCircle,
    });
  }

  toggleTerms(): void {
    const c = this.form.get('acceptTerms');
    if (!c) return;
    c.setValue(!c.value);
    c.markAsTouched();
  }

  submit(): void {
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);
    this.errorMessage.set(null);

    const value = this.form.getRawValue();
    const payload = {
      username: value.username,
      email: value.email,
      password: value.password,
      displayName: value.displayName?.trim() || undefined,
    };

    this.auth.register(payload).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigateByUrl('/onboarding');
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message ?? 'Error al registrarse');
      },
    });
  }

  back(): void {
    this.router.navigateByUrl('/login');
  }

  hasError(field: string, error: string): boolean {
    const c = this.form.get(field);
    return !!c && c.touched && c.hasError(error);
  }
}
