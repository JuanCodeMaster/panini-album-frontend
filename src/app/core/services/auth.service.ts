import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
} from '../models/user.model';
import { AlbumService } from './album.service';
import { CatalogService } from './catalog.service';
import { SocialService } from './social.service';

const TOKEN_KEY = 'panini.token';
const USER_KEY = 'panini.user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly album = inject(AlbumService);
  private readonly catalog = inject(CatalogService);
  private readonly social = inject(SocialService);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  private readonly _token = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  private readonly _currentUser = signal<User | null>(this.loadUser());

  readonly currentUser = this._currentUser.asReadonly();
  readonly token = this._token.asReadonly();
  readonly isAuthenticated = computed(() => this._token() !== null);

  login(req: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/login`, req)
      .pipe(tap((res) => this.persist(res)));
  }

  register(req: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/register`, req)
      .pipe(tap((res) => this.persist(res)));
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._token.set(null);
    this._currentUser.set(null);
    this.clearSessionState();
  }

  fetchMe(): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/me`).pipe(
      tap((u) => {
        this._currentUser.set(u);
        localStorage.setItem(USER_KEY, JSON.stringify(u));
      })
    );
  }

  private persist(res: AuthResponse): void {
    const previousUserId = this._currentUser()?.id;
    // Si llega un usuario distinto (o no había sesión activa), limpia el estado del anterior
    if (previousUserId !== res.user.id) {
      this.clearSessionState();
    }
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    this._token.set(res.token);
    this._currentUser.set(res.user);
  }

  /** Limpia caches y signals dependientes del usuario actual */
  private clearSessionState(): void {
    this.album.clear();
    this.catalog.clear();
    this.social.clear();
  }

  private loadUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }
}
