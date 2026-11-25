import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonButton, IonInput, IonText, IonIcon, ViewWillEnter } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { eyeOffOutline, eyeOutline, lockClosedOutline, personOutline, walletOutline } from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [IonContent, IonButton, IonInput, IonText, IonIcon, FormsModule],
  template: `
  <ion-content class="login-content" [fullscreen]="true">
    <div class="page">
      <div class="hero" aria-hidden="true">
        <div class="hero-glow"></div>
        <div class="hero-grid"></div>
      </div>

      <main class="shell">
        <section class="brand">
          <div class="brand-mark">
            <img src="assets/icon/icon-192.png" alt="" width="44" height="44">
          </div>
          <p class="eyebrow">Control de gastos</p>
          <h1>Bienvenido de nuevo</h1>
          <p class="lead">Administra tu presupuesto del hogar con claridad, quincena por quincena.</p>
        </section>

        <section class="card" aria-label="Formulario de inicio de sesión">
          <div class="card-head">
            <div>
              <p class="card-kicker">Acceso</p>
              <h2>Inicia sesión</h2>
            </div>
            <div class="card-badge">
              <ion-icon name="wallet-outline" aria-hidden="true"></ion-icon>
            </div>
          </div>

          <form (ngSubmit)="login()" novalidate>
            <div class="field">
              <ion-input
                class="inp"
                label="Usuario"
                labelPlacement="stacked"
                [(ngModel)]="user"
                name="user"
                autocomplete="username"
                fill="outline"
                inputmode="text"
                placeholder="Escribe tu usuario"
                [clearInput]="true"
                required>
                <ion-icon slot="start" name="person-outline" aria-hidden="true"></ion-icon>
              </ion-input>
            </div>

            <div class="field">
              <ion-input
                class="inp"
                label="Contraseña"
                labelPlacement="stacked"
                [(ngModel)]="password"
                name="password"
                [type]="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                fill="outline"
                placeholder="Escribe tu contraseña"
                required>
                <ion-icon slot="start" name="lock-closed-outline" aria-hidden="true"></ion-icon>
                <ion-button
                  slot="end"
                  fill="clear"
                  class="toggle-pass"
                  type="button"
                  (click)="showPassword = !showPassword"
                  [attr.aria-label]="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                  [attr.aria-pressed]="showPassword">
                  <ion-icon [name]="showPassword ? 'eye-off-outline' : 'eye-outline'" aria-hidden="true"></ion-icon>
                </ion-button>
              </ion-input>
            </div>

            @if (error) {
              <div class="error-box" role="alert" aria-live="polite">
                <ion-text color="danger">{{ error }}</ion-text>
              </div>
            }

            <ion-button
              expand="block"
              class="btn-add submit"
              type="submit"
              [disabled]="loading">
              {{ loading ? 'Entrando…' : 'Entrar' }}
            </ion-button>
          </form>

          <div class="divider" aria-hidden="true"><span>o</span></div>

          <ion-button expand="block" fill="outline" class="btn-secondary" type="button" (click)="registro()">
            Crear cuenta
          </ion-button>

          <p class="hint">Tus datos se guardan en este dispositivo y se respaldan en la nube.</p>
        </section>
      </main>
    </div>
  </ion-content>
  `,
  styles: [`
  .login-content{
    --background:var(--app-bg);
  }
  .page{
    min-height:100%;
    position:relative;
    overflow:hidden;
    padding:clamp(20px, 4vw, 40px) 16px 32px;
    background:
      radial-gradient(ellipse 80% 50% at 50% -10%, rgba(0,100,250,.16), transparent 70%),
      linear-gradient(180deg, #eef6ff 0%, var(--app-bg) 45%, var(--app-bg) 100%);
  }
  .hero{
    position:absolute; inset:0; pointer-events:none; overflow:hidden;
  }
  .hero-glow{
    position:absolute; top:-120px; left:50%; transform:translateX(-50%);
    width:min(720px, 140vw); height:360px; border-radius:50%;
    background:radial-gradient(circle, rgba(145,190,255,.45) 0%, rgba(0,100,250,.08) 45%, transparent 72%);
  }
  .hero-grid{
    position:absolute; inset:0;
    background-image:linear-gradient(rgba(0,100,250,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,100,250,.04) 1px, transparent 1px);
    background-size:32px 32px;
    mask-image:linear-gradient(180deg, rgba(0,0,0,.7), transparent 65%);
    -webkit-mask-image:linear-gradient(180deg, rgba(0,0,0,.7), transparent 65%);
  }
  .shell{
    position:relative; z-index:1;
    width:min(100%, 460px); margin:0 auto;
    display:flex; flex-direction:column; gap:28px;
    min-height:calc(100dvh - 52px); justify-content:center;
  }
  .brand{
    text-align:center; padding:8px 8px 0;
  }
  .brand-mark{
    width:72px; height:72px; margin:0 auto 20px;
    padding:10px; border-radius:22px;
    background:linear-gradient(160deg, #fff 0%, #e8f2ff 100%);
    border:1px solid rgba(255,255,255,.9);
    box-shadow:0 12px 32px rgba(0,100,250,.18), 0 2px 6px rgba(15,58,93,.06);
  }
  .brand-mark img{width:100%; height:100%; border-radius:14px; display:block;}
  .eyebrow{
    margin:0 0 8px;
    font-size:12px; font-weight:800; letter-spacing:.08em; text-transform:uppercase;
    color:var(--c-primary);
  }
  .brand h1{
    margin:0;
    font-family:'Comfortaa', cursive;
    font-size:clamp(28px, 5vw, 34px); line-height:1.15; font-weight:700;
    color:var(--text-strong); letter-spacing:-.02em;
  }
  .lead{
    margin:12px auto 0; max-width:34ch;
    font-size:15px; line-height:1.55; color:var(--text-muted);
  }
  .card{
    background:rgba(255,255,255,.92);
    backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px);
    border:1px solid rgba(255,255,255,.95);
    border-radius:28px;
    padding:28px 24px 24px;
    box-shadow:0 20px 50px rgba(15,58,93,.1), 0 2px 8px rgba(15,58,93,.04);
  }
  .card-head{
    display:flex; align-items:flex-start; justify-content:space-between; gap:16px;
    margin-bottom:24px;
  }
  .card-kicker{
    margin:0 0 4px;
    font-size:11px; font-weight:800; letter-spacing:.08em; text-transform:uppercase;
    color:var(--text-muted);
  }
  .card-head h2{
    margin:0;
    font-family:'Comfortaa', cursive;
    font-size:24px; font-weight:700; color:var(--text-strong);
  }
  .card-badge{
    width:44px; height:44px; flex-shrink:0;
    display:grid; place-items:center;
    border-radius:14px;
    background:var(--c-primary-bg); color:var(--c-primary);
    font-size:22px;
  }
  .field{ margin-bottom:16px; }
  .inp{
    --background:#f8fbff;
    --border-color:#7f9fc3;
    --border-radius:14px;
    --border-width:2px;
    --highlight-color-focused:var(--c-primary);
    --highlight-color-valid:var(--c-primary);
    --color:var(--text-strong);
    --placeholder-color:#5f7693;
    --placeholder-opacity:1;
    --padding-start:14px;
    --padding-end:12px;
    --padding-top:10px;
    --padding-bottom:10px;
    --highlight-height:0;
    min-height:64px;
    font-size:16px;
    font-weight:600;
  }
  .inp.input-fill-outline{
    --border-color:#7f9fc3;
    --border-width:2px;
  }
  .inp::part(label){
    color:#24456f;
    font-size:13px;
    font-weight:800;
    margin-bottom:6px;
  }
  .inp.ion-focused{
    --background:#ffffff;
    --border-color:var(--c-primary);
    box-shadow:0 0 0 4px rgba(0,100,250,.14);
  }
  .inp ion-icon[slot="start"]{
    color:#4f6f96; font-size:20px; margin-right:6px;
  }
  .inp.ion-focused ion-icon[slot="start"]{
    color:var(--c-primary);
  }
  .toggle-pass{
    --color:var(--text-muted);
    --padding-start:8px; --padding-end:8px;
    margin:0; height:44px; width:44px;
  }
  .toggle-pass::part(native){ border-radius:10px; }
  .error-box{
    background:var(--bad-bg);
    border:1px solid rgba(220,38,38,.12);
    color:var(--bad);
    padding:12px 14px; border-radius:12px;
    font-size:13px; font-weight:600; line-height:1.4;
    margin-bottom:16px;
  }
  .submit{
    margin-top:4px; height:50px; font-size:15px;
    --box-shadow:0 10px 24px rgba(0,100,250,.28);
  }
  .submit::part(native){ transition:transform .15s ease, box-shadow .2s ease; }
  .submit:not([disabled]):active::part(native){ transform:translateY(1px); }
  .divider{
    display:flex; align-items:center; gap:12px;
    margin:20px 0 16px; color:var(--text-faint); font-size:12px; font-weight:700;
  }
  .divider::before, .divider::after{
    content:''; flex:1; height:1px; background:var(--border);
  }
  .divider span{ text-transform:uppercase; letter-spacing:.06em; }
  .btn-secondary{
    --border-color:#cfe0f5;
    --border-width:1.5px;
    --border-radius:999px;
    --color:var(--c-primary-dark);
    --background:transparent;
    --background-hover:rgba(0,100,250,.04);
    --background-activated:rgba(0,100,250,.08);
    height:48px; margin:0; font-weight:700;
  }
  .hint{
    margin:20px 0 0;
    font-size:12px; line-height:1.5; text-align:center; color:var(--text-faint);
  }
  @media (min-width: 768px){
    .page{ padding-top:48px; padding-bottom:48px; }
    .card{ padding:32px; }
  }
  @media (prefers-reduced-motion: reduce){
    .submit::part(native), .inp{ transition:none; }
  }
  `]
})
export class LoginPage implements ViewWillEnter {
  private auth = inject(AuthService);
  private router = inject(Router);

  user = '';
  password = '';
  error = '';
  loading = false;
  showPassword = false;

  constructor() {
    addIcons({ eyeOffOutline, eyeOutline, lockClosedOutline, personOutline, walletOutline });
  }

  ionViewWillEnter(): void {
    this.user = '';
    this.password = '';
    this.error = '';
    this.loading = false;
    this.showPassword = false;
  }

  async login(): Promise<void> {
    this.error = '';
    if (!this.user.trim() || !this.password) {
      this.error = 'Ingresa tu usuario y contraseña.';
      return;
    }
    this.loading = true;
    try {
      await this.auth.login(this.user.trim(), this.password);
      await this.router.navigateByUrl(this.auth.tieneMembresia() ? '/tabs/dashboard' : '/sin-membresia');
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'No se pudo iniciar sesión.';
    } finally {
      this.loading = false;
    }
  }

  registro(): void {
    this.router.navigateByUrl('/registro');
  }
}
