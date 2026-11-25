import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonButton, IonContent, IonText } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-sin-membresia',
  standalone: true,
  imports: [IonContent, IonButton, IonText],
  template: `
  <ion-content class="bg">
    <div class="container">
      <div class="card">
        <span class="lbl">Acceso pausado</span>
        <b>Tu membresía no está activa</b>
        <p>Tus datos siguen guardados en este dispositivo. Puedes seguir cuando la membresía vuelva a estar vigente.</p>
        @if(error){ <ion-text color="danger" class="err">{{error}}</ion-text> }
        <ion-button expand="block" [disabled]="loading" (click)="reintentar()">{{ loading ? 'Comprobando…' : 'Ya renové, comprobar' }}</ion-button>
        <ion-button expand="block" fill="clear" (click)="salir()">Cerrar sesión</ion-button>
      </div>
    </div>
  </ion-content>
  `,
  styles: [`
  .bg{--background:var(--app-bg)}
  .container{padding:var(--sp-3);max-width:560px;margin:0 auto;min-height:100%;display:flex;align-items:center}
  .card{width:100%;background:var(--surface);border-radius:var(--radius-lg);box-shadow:var(--shadow);border:1px solid var(--border);padding:24px;display:flex;flex-direction:column;gap:12px}
  b{font-family:'Comfortaa',cursive;font-size:20px;color:var(--text-strong)}
  p{margin:0;font-size:13px;color:var(--text-body);line-height:1.5}
  .err{font-size:13px}
  `]
})
export class SinMembresiaPage {
  private auth = inject(AuthService);
  private router = inject(Router);

  error = '';
  loading = false;

  async reintentar(): Promise<void> {
    this.error = '';
    this.loading = true;
    try {
      await this.auth.revalidar();
      if (this.auth.tieneMembresia()) await this.router.navigateByUrl('/tabs/dashboard');
      else this.error = 'La membresía todavía no aparece como activa.';
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'No se pudo comprobar la membresía.';
    } finally {
      this.loading = false;
    }
  }

  salir(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
