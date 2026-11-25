import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService, authFetch } from './auth.service';
import { BudgetService } from './budget.service';
import { StorageService } from './storage.service';

export interface BackupEstado {
  sincronizando: boolean;
  ultimo: string | null;
  error: string | null;
}

@Injectable({ providedIn: 'root' })
export class BackupService {
  private budget = inject(BudgetService);
  private auth = inject(AuthService);
  private storage = inject(StorageService);
  private router = inject(Router);

  private readonly estadoSubject = new BehaviorSubject<BackupEstado>({
    sincronizando: false,
    ultimo: null,
    error: null
  });
  readonly estado$ = this.estadoSubject.asObservable();

  constructor() {
    this.estadoSubject.next({
      sincronizando: false,
      ultimo: this.storage.get<string | null>('ultimo_respaldo', null),
      error: null
    });
  }

  async sincronizar(): Promise<void> {
    if (!this.auth.tieneMembresia()) {
      this.auth.sinMembresia();
      this.router.navigateByUrl('/sin-membresia');
      throw new Error('Tu membresía no está activa.');
    }
    this.estadoSubject.next({ ...this.estadoSubject.value, sincronizando: true, error: null });
    try {
      const res = await authFetch(`${environment.apiUrl}/respaldos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schemaVersion: 1,
          payload: JSON.stringify(this.budget.snapshot())
        })
      });
      if (res.status === 401) {
        this.auth.sesionExpirada();
        this.router.navigateByUrl('/login');
        throw new Error('Sesión expirada. Inicia sesión de nuevo.');
      }
      if (res.status === 403) {
        this.auth.sinMembresia();
        this.router.navigateByUrl('/sin-membresia');
        throw new Error('Tu membresía no está activa.');
      }
      if (!res.ok) throw new Error(await this.leerError(res));
      const body = (await res.json()) as { data?: { updatedAt?: string } };
      const ultimo = body.data?.updatedAt ?? new Date().toISOString();
      this.storage.set('ultimo_respaldo', ultimo);
      this.estadoSubject.next({ sincronizando: false, ultimo, error: null });
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'No se pudo sincronizar el respaldo.';
      this.estadoSubject.next({ ...this.estadoSubject.value, sincronizando: false, error: mensaje });
      throw error;
    }
  }

  private async leerError(res: Response): Promise<string> {
    try {
      const body = (await res.json()) as { message?: string };
      if (body.message) return body.message;
    } catch {
      return `Error ${res.status}`;
    }
    return `Error ${res.status}`;
  }
}
