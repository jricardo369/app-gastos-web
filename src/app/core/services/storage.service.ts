import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private prefix = 'gastos_';
  private memory = new Map<string, string>();

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && !!window.localStorage;
  }

  get<T>(key: string, fallback: T): T {
    const k = this.prefix + key;
    try {
      if (this.isBrowser()) {
        const raw = localStorage.getItem(k);
        return raw ? (JSON.parse(raw) as T) : fallback;
      } else {
        const raw = this.memory.get(k);
        return raw ? (JSON.parse(raw) as T) : fallback;
      }
    } catch {
      return fallback;
    }
  }

  set<T>(key: string, value: T): void {
    const k = this.prefix + key;
    const raw = JSON.stringify(value);
    if (this.isBrowser()) localStorage.setItem(k, raw);
    else this.memory.set(k, raw);
  }

  remove(key: string): void {
    const k = this.prefix + key;
    if (this.isBrowser()) localStorage.removeItem(k);
    else this.memory.delete(k);
  }
}
