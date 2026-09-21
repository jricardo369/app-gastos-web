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
        <div class="logo">🏠</div>
        <h1>Control de Gastos</h1>
        <p>Gestiona tu hogar por quincenas</p>
        <div class="inp"><ion-input [(ngModel)]="email" placeholder="Correo electrónico" type="email"></ion-input></div>
        <div class="inp"><ion-input [(ngModel)]="password" placeholder="Contraseña" type="password"></ion-input></div>
        @if(error){ <ion-text color="danger" class="err">{{error}}</ion-text> }
        <ion-button expand="block" class="btn-login" (click)="login()">Ingresar</ion-button>
        <span class="hint">Regístrate primero en /api/v1/auth/register</span>
      </div>
    </div>
  </ion-content>
  `,
  styles: [`
  .login-bg{--background:#eef2f7}
  .wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
  .card{background:#fff;border-radius:24px;padding:32px 24px;width:100%;max-width:380px;box-shadow:0 12px 40px rgba(0,0,0,.08);text-align:center}
  .logo{width:56px;height:56px;border-radius:16px;background:#0f3a5d;color:#fff;display:grid;place-items:center;margin:0 auto 12px;font-size:26px}
  h1{margin:0;font-size:22px;font-weight:800;color:#0f3a5d}
  p{margin:4px 0 20px;color:#6b7a90;font-size:13px}
  .inp{--background:#f4f6f9;border-radius:12px;margin-bottom:12px;--padding-start:12px}
  .btn-login{--background:#0f3a5d;--border-radius:12px;height:44px;font-weight:700;margin-top:8px}
  .err{display:block;margin:8px 0;font-size:13px}
  .hint{display:block;margin-top:12px;color:#9aa8c0;font-size:11px}
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
