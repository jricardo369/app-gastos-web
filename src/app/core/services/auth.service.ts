import { inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StorageService } from './storage.service';

export interface AuthUsuario {
  id: string;
  email: string;
  nombre: string;
}

export interface AuthMembresia {
  id: number | null;
  tipo: string;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
}

export type TipoMembresiaApi = 'MONTH' | 'YEAR';

interface AuthData {
  token: string;
  usuario?: { idUser?: number; email?: string; name?: string };
  membresia?: AuthMembresia | null;
  membresiaActiva?: boolean;
}

interface ApiEnvelope<T> {
  data?: T;
  message?: string;
  fieldErrors?: { field: string; message: string }[];
}

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';
const MEMB_KEY = 'auth_membresia';
const ACTIVA_KEY = 'auth_membresia_activa';

export function authToken(): string | null {
  const raw = typeof localStorage === 'undefined' ? null : localStorage.getItem('gastos_' + TOKEN_KEY);
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as unknown;
    return typeof value === 'string' ? value : raw;
  } catch {
    return raw;
  }
}

export function authHeaders(): Record<string, string> {
  const token = authToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function authFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const headers = { ...authHeaders(), ...(init.headers as Record<string, string> | undefined) };
  return fetch(url, { ...init, headers });
}

async function leerError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as ApiEnvelope<unknown>;
    if (body.fieldErrors?.length) return body.fieldErrors.map(e => `${e.field}: ${e.message}`).join('; ');
    if (body.message) return body.message;
  } catch {
    return `Error ${res.status}`;
  }
  return `Error ${res.status}`;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private storage = inject(StorageService);
  private readonly usuarioSubject = new BehaviorSubject<AuthUsuario | null>(null);
  private readonly membresiaSubject = new BehaviorSubject<AuthMembresia | null>(null);
  private readonly membresiaActivaSubject = new BehaviorSubject(false);
  private preparado = false;

  readonly usuario$ = this.usuarioSubject.asObservable();
  readonly membresia$ = this.membresiaSubject.asObservable();
  readonly membresiaActiva$ = this.membresiaActivaSubject.asObservable();

  constructor() {
    const usuario = this.storage.get<AuthUsuario | null>(USER_KEY, null);
    const membresia = this.storage.get<AuthMembresia | null>(MEMB_KEY, null);
    const activa = this.storage.get<boolean | null>(ACTIVA_KEY, null);
    if (usuario && authToken() && activa !== null) {
      this.usuarioSubject.next(usuario);
      this.membresiaSubject.next(membresia);
      this.membresiaActivaSubject.next(activa);
    } else {
      this.limpiar();
    }
  }

  async login(user: string, password: string): Promise<void> {
    const res = await fetch(`${environment.apiUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user, password })
    });
    if (!res.ok) {
      throw new Error(res.status === 401 ? 'Usuario o contraseña incorrectos' : await leerError(res));
    }
    await this.aplicarRespuesta(res);
  }

  async register(datos: { user: string; password: string; name: string; email: string; membresiaType: TipoMembresiaApi }): Promise<void> {
    const res = await fetch(`${environment.apiUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    if (!res.ok) throw new Error(await leerError(res));
    await this.aplicarRespuesta(res);
  }

  async refreshSession(): Promise<void> {
    if (this.preparado) return;
    this.preparado = true;
    if (!authToken()) return;
    try {
      const res = await authFetch(`${environment.apiUrl}/auth/me`);
      if (res.status === 401) {
        this.logout();
        return;
      }
      if (!res.ok) return;
      await this.aplicarRespuesta(res, false);
    } catch {
      return;
    }
  }

  async revalidar(): Promise<void> {
    this.preparado = false;
    await this.refreshSession();
  }

  logout(): void {
    this.limpiar();
    this.preparado = true;
  }

  sesionExpirada(): void {
    this.logout();
  }

  sinMembresia(): void {
    this.membresiaActivaSubject.next(false);
    this.storage.set(ACTIVA_KEY, false);
    const actual = this.membresiaSubject.value;
    if (actual) {
      const inactiva = { ...actual, estado: 'INACTIVA' };
      this.membresiaSubject.next(inactiva);
      this.storage.set(MEMB_KEY, inactiva);
    }
  }

  isAuthenticated(): boolean {
    return !!this.usuarioSubject.value && !!authToken();
  }

  tieneMembresia(): boolean {
    return this.isAuthenticated() && this.membresiaActivaSubject.value;
  }

  currentUser(): AuthUsuario | null {
    return this.usuarioSubject.value;
  }

  membresiaActual(): AuthMembresia | null {
    return this.membresiaSubject.value;
  }

  getToken(): string | null {
    return authToken();
  }

  private async aplicarRespuesta(res: Response, requiereToken = true): Promise<void> {
    const body = (await res.json()) as ApiEnvelope<AuthData>;
    const data = body.data;
    if (!data || (requiereToken && !data.token)) throw new Error('Respuesta inválida del servidor');
    const usuario: AuthUsuario = {
      id: String(data.usuario?.idUser ?? ''),
      email: data.usuario?.email ?? '',
      nombre: data.usuario?.name ?? ''
    };
    if (data.token) this.storage.set(TOKEN_KEY, data.token);
    this.storage.set(USER_KEY, usuario);
    this.storage.set(MEMB_KEY, data.membresia ?? null);
    this.storage.set(ACTIVA_KEY, !!data.membresiaActiva);
    this.usuarioSubject.next(usuario);
    this.membresiaSubject.next(data.membresia ?? null);
    this.membresiaActivaSubject.next(!!data.membresiaActiva);
    this.preparado = true;
  }

  private limpiar(): void {
    this.storage.remove(TOKEN_KEY);
    this.storage.remove(USER_KEY);
    this.storage.remove(MEMB_KEY);
    this.storage.remove(ACTIVA_KEY);
    this.usuarioSubject.next(null);
    this.membresiaSubject.next(null);
    this.membresiaActivaSubject.next(false);
  }
}
