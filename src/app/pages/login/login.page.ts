import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonButton, IonInput, IonText } from '@ionic/angular';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [IonContent, IonButton, IonInput, IonText, FormsModule],
  template: `
  <ion-content class="login-bg">
    <div class="wrap">
      <div class="card">
        <img class="logo" src="assets/icon/icon-192.png" alt="" width="56" height="56">
        <h1>Control de Gastos</h1>
        <p>Tu presupuesto del hogar, quincena por quincena</p>
        <div class="inp"><ion-input label="Correo electrónico" labelPlacement="stacked" [(ngModel)]="email" type="email" autocomplete="username"></ion-input></div>
        <div class="inp"><ion-input label="Contraseña" labelPlacement="stacked" [(ngModel)]="password" type="password" autocomplete="current-password"></ion-input></div>
        @if(error){ <ion-text color="danger" class="err">{{error}}</ion-text> }
        <ion-button expand="block" class="btn-login" (click)="login()">Entrar</ion-button>
        <p class="hint">Los datos se guardan solo en este dispositivo.</p>
      </div>
    </div>
  </ion-content>
  `,
  styles: [`
  .login-bg{--background:#eef2f7}
  .wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
  .card{background:var(--surface);border-radius:24px;padding:32px 24px;width:100%;
    max-width:380px;box-shadow:var(--shadow);text-align:center;border:1px solid var(--border)}
  .logo{width:56px;height:56px;border-radius:14px;display:block;margin:0 auto 14px}
  h1{margin:0;font-size:22px;font-weight:800;color:var(--text-strong)}
  p{margin:6px 0 24px;color:var(--text-muted);font-size:13px;line-height:1.4}
  .inp{--background:var(--surface-input);border-radius:12px;margin-bottom:12px;--padding-start:12px;--padding-end:12px}
  .btn-login{--background:var(--ion-color-primary);--border-radius:12px;height:46px;font-weight:700;margin-top:6px}
  .err{display:block;margin:8px 0;font-size:13px}
  /* Antes decia "Registrate en /api/v1/auth/register", que es una ruta de
     API que no existe: el login es local y no valida nada. */
  .hint{margin:16px 0 0;color:var(--text-faint);font-size:11px}
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
