import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonIcon } from '@ionic/angular';
import { ModalController } from '@ionic/angular';
import { BudgetService } from '../../core/services/budget.service';
import { addIcons } from 'ionicons';
import { calendarOutline, walletOutline, alertCircleOutline, checkmarkCircleOutline, closeOutline, arrowBackOutline, arrowForwardOutline } from 'ionicons/icons';
import { RANGOS, TIPOS_PAGO, MEMBRESIAS } from '../../core/models/budget.model';
import { ConfigApp, RangoIngreso, TipoPago, TipoMembresia } from '../../core/models/budget.model';

/**
 * Pantalla para elegir con que datos se restablece la app: rango de ingreso
 * y tipo de pago (dos quincenas o mensual).
 *
 * Un paso por pantalla, con una sola pregunta cada uno: asi no hay que leer
 * todo junto y cada opcion se explica sola.
 */
@Component({
  selector: 'app-reset-wizard',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonIcon, FormsModule],
  template: `
  <ion-header class="hdr">
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button fill="clear" (click)="atras()" [attr.aria-label]="paso === 0 ? 'Cancelar' : 'Volver al paso anterior'">
          <ion-icon [name]="paso === 0 ? 'close-outline' : 'arrow-back-outline'" aria-hidden="true"></ion-icon>
        </ion-button>
      </ion-buttons>
      <ion-title>Restablecer datos</ion-title>
    </ion-toolbar>
  </ion-header>

  <ion-content class="bg">
    <div class="container">

      <!-- Progreso: puntos, el actual mas grande. Dice en donde estas sin
           contar porcentajes que nadie lee. -->
      <div class="pasos" aria-hidden="true">
        @for (p of [0,1,2]; track p) {
          <span class="paso-dot" [class.on]="p === paso" [class.hecho]="p < paso"></span>
        }
      </div>

      <!-- ============ PASO 1: rango de ingreso ============ -->
      @if (paso === 0) {
        <div class="cabeza">
          <h1 class="titulo">¿Cuánto entra al mes?</h1>
          <p class="sub">Con esto se arman los gastos de ejemplo. Después los podés cambiar igual.</p>
        </div>
        <div class="opciones" role="radiogroup" aria-label="Rango de ingreso">
          @for (r of rangos; track r.id) {
            <button type="button" class="opcion" [class.on]="rango === r.id" role="radio"
                    [attr.aria-checked]="rango === r.id" (click)="rango = r.id">
              <span class="op-ico"><ion-icon name="wallet-outline" aria-hidden="true"></ion-icon></span>
              <span class="op-txt">
                <b>{{ r.etiqueta }}</b>
                <small>{{ r.detalle }}</small>
              </span>
              <span class="op-check" aria-hidden="true"></span>
            </button>
          }
        </div>
      }

      <!-- ============ PASO 2: tipo de pago ============ -->
      @if (paso === 1) {
        <div class="cabeza">
          <h1 class="titulo">¿Cómo te pagan?</h1>
          <p class="sub">Define cómo se parte el mes en la app.</p>
        </div>
        <div class="opciones" role="radiogroup" aria-label="Tipo de pago">
          @for (t of tiposPago; track t.id) {
            <button type="button" class="opcion" [class.on]="tipoPago === t.id" role="radio"
                    [attr.aria-checked]="tipoPago === t.id" (click)="tipoPago = t.id">
              <span class="op-ico"><ion-icon name="calendar-outline" aria-hidden="true"></ion-icon></span>
              <span class="op-txt">
                <b>{{ t.etiqueta }}</b>
                <small>{{ t.detalle }}</small>
              </span>
              <span class="op-check" aria-hidden="true"></span>
            </button>
          }
        </div>
      }

      <!-- ============ PASO 3: resumen y confirmar ============ -->
      @if (paso === 2) {
        <div class="cabeza">
          <h1 class="titulo">Todo listo</h1>
          <p class="sub">Revisá antes de aplicar. Se borra lo que cargaste a mano y vuelven los datos de ejemplo.</p>
        </div>

        <div class="card resumen">
          <div class="row"><span>Rango de ingreso</span><b>{{ etiquetaRango }}</b></div>
          <div class="row"><span>Tipo de pago</span><b>{{ etiquetaPago }}</b></div>
          <div class="row"><span>Gastos de ejemplo</span><b>{{ gastosEjemplo }}</b></div>
        </div>

        <!-- Aviso destructivo: va al final, con el color semantico de "mal". -->
        <div class="card aviso">
          <span class="aviso-ico" aria-hidden="true"><ion-icon name="alert-circle-outline"></ion-icon></span>
          <div class="aviso-txt">
            <b>Esto borra tus datos actuales</b>
            <span>Gastos, presupuesto, deudas y movimientos vuelven a ser los de ejemplo. No se puede deshacer.</span>
          </div>
        </div>
      }

      <!-- Barra de accion: dentro del scroll pero pegada al borde inferior
           (sticky), para que el boton se vea siempre sin tapar el contenido. -->
      <div class="acciones">
        @if (paso < 2) {
          <button type="button" class="btn-primario" (click)="siguiente()">
            Continuar
            <ion-icon slot="end" name="arrow-forward-outline" aria-hidden="true"></ion-icon>
          </button>
        } @else {
          <button type="button" class="btn-peligro" (click)="aplicar()">
            <ion-icon slot="start" name="checkmark-circle-outline" aria-hidden="true"></ion-icon>
            Restablecer con estos datos
          </button>
        }
      </div>
    </div>
  </ion-content>
  `,
  styles: [`
  .hdr ion-toolbar{--background:#fff}
  .bg{--background:#eef2f7}
  .container{padding:var(--sp-4) var(--sp-3) 0;
    max-width:560px;margin:0 auto;display:flex;flex-direction:column;gap:var(--sp-4)}

  /* Progreso: puntos, no barras ni porcentajes */
  .pasos{display:flex;gap:6px;justify-content:center}
  .paso-dot{width:7px;height:7px;border-radius:999px;background:var(--border);
    transition:width .2s ease, background .2s ease}
  .paso-dot.hecho{background:var(--ok)}
  .paso-dot.on{width:22px;background:var(--accent)}

  .cabeza{display:flex;flex-direction:column;gap:4px}
  .titulo{margin:0;font-family:'Comfortaa',cursive;font-size:22px;color:var(--text-strong)}
  .sub{margin:0;font-size:13px;color:var(--text-muted)}

  /* Opciones: una tarjeta por opcion, con area de toque generosa (minimo 56px)
     y el estado marcado pintado con color semantico + tilde, no solo color. */
  .opciones{display:flex;flex-direction:column;gap:var(--sp-2)}
  .opcion{
    display:flex;align-items:center;gap:var(--sp-3);width:100%;min-height:60px;
    padding:var(--sp-3) var(--sp-4);cursor:pointer;text-align:left;
    background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);
    box-shadow:var(--shadow);font-family:inherit;
    transition:border-color .15s ease, background .15s ease;
  }
  .opcion:hover{background:var(--surface-sunken)}
  .opcion:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
  .opcion.on{border-color:var(--accent);background:var(--info-bg)}
  .op-ico{
    width:40px;height:40px;flex:none;border-radius:var(--radius-pill);
    display:flex;align-items:center;justify-content:center;
    background:var(--surface-sunken);color:var(--text-muted);
  }
  .opcion.on .op-ico{background:var(--accent);color:#fff}
  .op-ico ion-icon{font-size:20px}
  .op-txt{display:flex;flex-direction:column;gap:1px;min-width:0;flex:1}
  .op-txt b{font-size:15px;color:var(--text-strong);font-weight:800}
  .op-txt small{font-size:12px;color:var(--text-muted)}
  /* La tilde: ademas del color, para que el elegido no dependa del borde */
  .op-check{
    width:20px;height:20px;flex:none;border-radius:50%;
    border:2px solid var(--border);position:relative;
  }
  .opcion.on .op-check{border-color:var(--accent)}
  .opcion.on .op-check::after{
    content:'';position:absolute;inset:3px;border-radius:50%;background:var(--accent);
  }

  .card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);
    box-shadow:var(--shadow);padding:var(--sp-4)}
  .resumen{display:flex;flex-direction:column;gap:2px}
  .row{display:flex;justify-content:space-between;align-items:center;gap:var(--sp-3);
    padding:9px 0;font-size:14px;color:var(--text-body);border-bottom:1px solid var(--border-subtle)}
  .row:last-child{border-bottom:none}
  .row b{font-variant-numeric:tabular-nums}

  .aviso{display:flex;gap:var(--sp-3);background:var(--bad-bg);border-color:#f3b0b0}
  .aviso-ico{flex:none;font-size:22px;color:var(--bad);line-height:1}
  .aviso-txt{display:flex;flex-direction:column;gap:3px}
  .aviso-txt b{font-size:14px;color:var(--bad)}
  .aviso-txt span{font-size:12px;color:var(--text-body);line-height:1.4}

  /* Acciones: pegadas al borde inferior del scroll (sticky) y con fondo propio,
     asi el boton nunca queda debajo del contenido ni fuera de la pantalla. */
  .acciones{
    position:sticky;bottom:0;margin-top:auto;
    display:flex;flex-direction:column;gap:var(--sp-2);
    background:var(--ion-background-color,#eef2f7);
    padding:var(--sp-3) 0 calc(var(--sp-4) + env(safe-area-inset-bottom));
  }
  .btn-primario,.btn-peligro{
    display:flex;align-items:center;justify-content:center;gap:6px;width:100%;
    min-height:52px;border:none;border-radius:var(--radius-pill);cursor:pointer;
    font-family:'Nunito',sans-serif;font-size:15px;font-weight:800;
    transition:filter .15s ease;
  }
  .btn-primario{background:var(--accent);color:#fff}
  .btn-peligro{background:var(--bad);color:#fff}
  .btn-primario:hover,.btn-peligro:hover{filter:brightness(.95)}
  .btn-primario:focus-visible,.btn-peligro:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
  .btn-primario ion-icon,.btn-peligro ion-icon{font-size:18px}

  @media (prefers-reduced-motion: reduce){
    .opcion,.paso-dot,.btn-primario,.btn-peligro{transition:none}
  }
  `]
})
export class ResetWizardComponent {
  paso = 0;
  rango: RangoIngreso = this.budget.getConfig().rango;
  tipoPago: TipoPago = this.budget.getConfig().tipoPago;
  /** La membresia ya no se pregunta aca: se conserva la que esta guardada. */
  membresia: TipoMembresia = this.budget.getConfig().membresia;
  rangos = RANGOS;
  tiposPago = TIPOS_PAGO;

  constructor(private modalCtrl: ModalController, private budget: BudgetService) {
    addIcons({ calendarOutline, walletOutline, alertCircleOutline, checkmarkCircleOutline, closeOutline, arrowBackOutline, arrowForwardOutline });
  }

  get etiquetaRango(): string { return this.rangos.find(r => r.id === this.rango)?.etiqueta ?? ''; }
  get etiquetaPago(): string { return this.tiposPago.find(t => t.id === this.tipoPago)?.etiqueta ?? ''; }
  /** Cuantos gastos de ejemplo trae la combinacion elegida. */
  get gastosEjemplo(): string {
    return `${this.budget.resumenPorConfig(this.config()).gastos} gastos`;
  }
  private config(): ConfigApp { return { rango: this.rango, tipoPago: this.tipoPago, membresia: this.membresia }; }

  siguiente() { if (this.paso < 2) this.paso++; }
  atras() { if (this.paso === 0) this.modalCtrl.dismiss(null, 'cancel'); else this.paso--; }
  /** Se confirma: ademas de los datos va el rol, que es lo que mira el perfil. */
  aplicar() { this.modalCtrl.dismiss(this.config(), 'confirm'); }
}