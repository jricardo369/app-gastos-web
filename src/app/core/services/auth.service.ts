import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { StorageService } from './storage.service';

export interface User { id: string; email: string; nombre: string; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user$ = new BehaviorSubject<User | null>(null);
  user$ = this._user$.asObservable();
  private readonly KEY = 'auth_user';
  private readonly TOKEN = 'auth_token';

  // MODO LOCAL: no llamar backend
  useRest = false;
  restBaseUrl = 'http://localhost:8080/api/v1';

  constructor(private storage: StorageService) {
    const saved = this.storage.get<User | null>(this.KEY, null);
    if (saved) this._user$.next(saved);
  }

  isAuthenticated(): boolean { return !!this._user$.value; }
  currentUser(): User | null { return this._user$.value; }

  getToken(): string | null {
    return this.storage.get<string | null>(this.TOKEN, null);
  }

  getUserId(): string | null {
    const user = this._user$.value;
    return user?.id ?? null;
  }

  async login(email: string, password: string): Promise<User> {
    if (this.useRest && this.restBaseUrl) {
      const res = await fetch(`${this.restBaseUrl}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) throw new Error('Credenciales inválidas');
      const data = await res.json();
      const responseData = data.data;
      const token = responseData.token;
      const usuario: User = {
        id: responseData.usuario.id,
        email: responseData.usuario.email,
        nombre: responseData.usuario.nombre
      };
      this.storage.set(this.TOKEN, token);
      this.storage.set(this.KEY, usuario);
      this._user$.next(usuario);
      return usuario;
    }
    if (!email || !password) throw new Error('Completa email y contraseña');
    if (password.length < 4) throw new Error('Contraseña muy corta');
    const user: User = { id: '', email, nombre: email.split('@')[0] };
    this.storage.set(this.KEY, user);
    this.storage.set(this.TOKEN, 'local-' + btoa(email));
    this._user$.next(user);
    return user;
  }

  logout(): void {
    this.storage.remove(this.KEY);
    this.storage.remove(this.TOKEN);
    this._user$.next(null);
  }
}

export function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('gastos_auth_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = authHeaders();
  return fetch(url, { ...options, headers: { ...headers, ...options.headers } });
}
