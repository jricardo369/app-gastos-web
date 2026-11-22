import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonInput, IonText } from '@ionic/angular';

@Component({
  selector: 'app-login',
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
        <span class="lbl">Bienvenido</span>
        <b class="money big">Inicia sesión</b>
        <span class="count">Tu presupuesto del hogar, quincena por quincena</span>
      </div>

      <div class="card pad-card">
        <div class="logo-wrap"><img class="logo" src="assets/icon/icon-192.png" alt="" width="56" height="56"></div>
        <ion-input class="inp" label="Correo electrónico" labelPlacement="stacked" [(ngModel)]="email" type="email" autocomplete="username" fill="outline"></ion-input>
        <ion-input class="inp" label="Contraseña" labelPlacement="stacked" [(ngModel)]="password" type="password" autocomplete="current-password" fill="outline"></ion-input>
        @if(error){ <ion-text color="danger" class="err">{{error}}</ion-text> }
        <ion-button expand="block" class="btn-add" (click)="login()">Entrar</ion-button>
        <p class="hint">Los datos se guardan solo en este dispositivo.</p>
      </div>
    </div>
  </ion-content>
  `,
  styles: [`
  .bg{--background:var(--app-bg)}
  .container{padding:var(--sp-3);max-width:560px;margin:0 auto;display:flex;flex-direction:column;gap:var(--sp-3)}
  .card{background:var(--surface);border-radius:var(--radius-lg);box-shadow:var(--shadow);border:1px solid var(--border);overflow:hidden}
  .pad-card{padding:24px}
  .head-card .count{color:#3f6ea8;font-size:13px;font-weight:700}
  .logo-wrap{display:flex;justify-content:center;margin-bottom:18px}
  .logo{width:64px;height:64px;border-radius:16px;display:block;box-shadow:0 6px 16px rgba(0,100,250,.18)}
  .inp{--background:#fff;--border-color:#dbe7f5;--border-radius:12px;--border-width:1px;--highlight-color-focused:var(--c-primary);--color:var(--c-text);--placeholder-color:#7b8ea8;margin-bottom:14px;min-height:56px}
  .btn-add{height:46px;margin-top:6px}
  .err{display:block;margin:8px 0;font-size:13px}
  .hint{margin:16px 0 0;color:var(--text-faint);font-size:11px;text-align:center}
  `]
})
export class LoginPage {
  email = 'demo@hogar.com';
  password = '1234';
  error = '';
  // MODO LOCAL: sin servicio, entra directo
  constructor(private router: Router) {}
  login() {
    this.error = '';
    this.router.navigateByUrl('/tabs/dashboard');
  }
}
