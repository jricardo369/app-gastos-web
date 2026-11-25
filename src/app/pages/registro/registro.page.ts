import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonInput, IonText } from '@ionic/angular';
import { AuthService, TipoMembresiaApi } from '../../core/services/auth.service';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonInput, IonText, FormsModule],
  template: `
  <ion-header>
    <ion-toolbar>
      <ion-title>Control de Gastos</ion-title>
    </ion-toolbar>
  </ion-header>
  <ion-content class="bg">
    <div class="container">
      <div class="card head-card">
        <span class="lbl">Empieza aquí</span>
        <b class="money big">Crear cuenta</b>
        <span class="count">Tus datos se guardan en este dispositivo y se respaldan en la nube</span>
      </div>

      <div class="card pad-card">
        <ion-input class="inp" label="Usuario" labelPlacement="stacked" [(ngModel)]="user" autocomplete="username" fill="outline"></ion-input>
        <ion-input class="inp" label="Nombre" labelPlacement="stacked" [(ngModel)]="name" autocomplete="name" fill="outline"></ion-input>
        <ion-input class="inp" label="Correo electrónico" labelPlacement="stacked" [(ngModel)]="email" type="email" autocomplete="email" fill="outline"></ion-input>
        <ion-input class="inp" label="Contraseña" labelPlacement="stacked" [(ngModel)]="password" type="password" autocomplete="new-password" fill="outline"></ion-input>
        <span class="lbl plan-label">Plan</span>
        <div class="planes">
          <button type="button" class="plan" [class.on]="plan === 'MONTH'" (click)="plan = 'MONTH'">Mensual</button>
          <button type="button" class="plan" [class.on]="plan === 'YEAR'" (click)="plan = 'YEAR'">Anual</button>
        </div>
        @if(error){ <ion-text color="danger" class="err">{{error}}</ion-text> }
        <ion-button expand="block" class="btn-add" [disabled]="loading" (click)="registrar()">{{ loading ? 'Creando…' : 'Crear cuenta' }}</ion-button>
        <ion-button expand="block" fill="clear" (click)="login()">Ya tengo cuenta</ion-button>
      </div>
    </div>
  </ion-content>
  `,
  styles: [`
  .bg{--background:var(--app-bg)}
  .container{padding:var(--sp-3);max-width:560px;margin:0 auto;display:flex;flex-direction:column;gap:var(--sp-3)}
  .card{background:var(--surface);border-radius:var(--radius-lg);box-shadow:var(--shadow);border:1px solid var(--border);overflow:hidden}
  .pad-card{padding:24px}
  .head-card{padding:20px 24px;display:flex;flex-direction:column;gap:4px}
  .head-card .count{color:#3f6ea8;font-size:13px;font-weight:700}
  .inp{--background:#fff;--border-color:#dbe7f5;--border-radius:12px;--border-width:1px;--highlight-color-focused:var(--c-primary);--color:var(--c-text);--placeholder-color:#7b8ea8;margin-bottom:14px;min-height:56px}
  .plan-label{display:block;font-size:12px;color:var(--text-muted);margin-bottom:8px}
  .planes{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px}
  .plan{border:1px solid var(--border);border-radius:12px;background:var(--surface);padding:12px;font-weight:700;color:var(--text-body);cursor:pointer}
  .plan.on{border-color:var(--c-primary);background:var(--c-primary);color:#fff}
  .btn-add{height:46px;margin-top:6px}
  .err{display:block;margin:8px 0;font-size:13px}
  `]
})
export class RegistroPage {
  private auth = inject(AuthService);
  private router = inject(Router);

  user = '';
  name = '';
  email = '';
  password = '';
  plan: TipoMembresiaApi = 'MONTH';
  error = '';
  loading = false;

  async registrar(): Promise<void> {
    this.error = '';
    if (!this.user.trim() || !this.name.trim() || !this.email.trim() || this.password.length < 6) {
      this.error = 'Completa todos los campos. La contraseña debe tener al menos 6 caracteres.';
      return;
    }
    this.loading = true;
    try {
      await this.auth.register({
        user: this.user.trim(),
        name: this.name.trim(),
        email: this.email.trim(),
        password: this.password,
        membresiaType: this.plan
      });
      await this.router.navigateByUrl(this.auth.tieneMembresia() ? '/tabs/dashboard' : '/sin-membresia');
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'No se pudo crear la cuenta.';
    } finally {
      this.loading = false;
    }
  }

  login(): void {
    this.router.navigateByUrl('/login');
  }
}
