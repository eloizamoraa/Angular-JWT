import { HttpClient } from '@angular/common/http';
import {
  PLATFORM_ID,
  computed,
  inject,
  Injectable,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Observable, map } from 'rxjs';

import { environment } from '../../environments/environment';
import { LoginRequest, LoginResponse, UserRole } from '../models/auth.model';

interface JwtPayload {
  role?: string;
  rol?: string;
  username?: string;
  name?: string;
  email?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly tokenSignal = signal<string | null>(null);
  private readonly roleSignal = signal<UserRole | null>(null);
  private readonly usernameSignal = signal<string | null>(null);

  readonly token = computed(() => this.tokenSignal());
  readonly role = computed(() => this.roleSignal());
  readonly username = computed(() => this.usernameSignal());
  readonly isAuthenticated = computed(() => !!this.tokenSignal());

  constructor() {
    this.loadSessionFromStorage();
  }

  login(credentials: LoginRequest): Observable<void> {
    return this.http
      .post<LoginResponse>(environment.authUrl, credentials)
      .pipe(
        map((response) => {
          const token = this.extractToken(response);
          if (!token) {
            throw new Error('El servidor no ha devuelto token JWT.');
          }

          const payload = this.decodeJwtPayload(token);
          const role = this.extractRole(response, payload);
          const username = this.extractUsername(response, payload, credentials);

          this.setSession(token, role, username);
        }),
      );
  }

  logout(redirectToLogin = true): void {
    this.tokenSignal.set(null);
    this.roleSignal.set(null);
    this.usernameSignal.set(null);

    if (this.isBrowser) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_role');
      localStorage.removeItem('auth_username');
    }

    if (redirectToLogin) {
      void this.router.navigate(['/login']);
    }
  }

  getToken(): string | null {
    return this.tokenSignal();
  }

  hasRole(requiredRole: UserRole): boolean {
    const currentRole = this.roleSignal();
    if (!currentRole) {
      return false;
    }

    if (requiredRole === 'user') {
      return currentRole === 'user' || currentRole === 'admin';
    }

    return currentRole === requiredRole;
  }

  private loadSessionFromStorage(): void {
    if (!this.isBrowser) {
      return;
    }

    const token = localStorage.getItem('auth_token');
    const role = this.normalizeRole(localStorage.getItem('auth_role'));
    const username = localStorage.getItem('auth_username');

    if (!token) {
      return;
    }

    const payload = this.decodeJwtPayload(token);

    this.tokenSignal.set(token);
    this.roleSignal.set(role ?? this.extractRole({}, payload));
    this.usernameSignal.set(username ?? this.extractUsername({}, payload, null));
  }

  private setSession(token: string, role: UserRole, username: string): void {
    this.tokenSignal.set(token);
    this.roleSignal.set(role);
    this.usernameSignal.set(username);

    if (!this.isBrowser) {
      return;
    }

    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_role', role);
    localStorage.setItem('auth_username', username);
  }

  private extractToken(response: LoginResponse): string | null {
    return response.token ?? response.accessToken ?? response.jwt ?? null;
  }

  private extractRole(response: LoginResponse, payload: JwtPayload): UserRole {
    const roleCandidate =
      response.role ??
      response.rol ??
      response.user?.role ??
      response.user?.rol ??
      payload.role ??
      payload.rol;

    return this.normalizeRole(roleCandidate) ?? 'user';
  }

  private extractUsername(
    response: LoginResponse,
    payload: JwtPayload,
    credentials: LoginRequest | null,
  ): string {
    return (
      response.username ??
      response.user?.username ??
      response.user?.name ??
      payload.username ??
      payload.name ??
      response.user?.email ??
      payload.email ??
      credentials?.email ??
      'Usuario'
    );
  }

  private normalizeRole(role: string | null | undefined): UserRole | null {
    if (!role) {
      return null;
    }

    const normalized = role.toLowerCase();
    if (normalized === 'admin') {
      return 'admin';
    }

    if (normalized === 'user') {
      return 'user';
    }

    return null;
  }

  private decodeJwtPayload(token: string): JwtPayload {
    const parts = token.split('.');
    if (parts.length < 2) {
      return {};
    }

    try {
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');

      if (!this.isBrowser || typeof atob !== 'function') {
        return {};
      }

      const json = atob(padded);
      return JSON.parse(json) as JwtPayload;
    } catch {
      return {};
    }
  }
}
