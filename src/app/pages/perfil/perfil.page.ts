import { Component, inject } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonIcon, IonButton, IonButtons, IonText, ModalController, AlertController } from '@ionic/angular';
import { CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { BudgetService } from '../../core/services/budget.service';
import { AuthService } from '../../core/services/auth.service';
import { BackupEstado, BackupService } from '../../core/services/backup.service';
import { addIcons } from 'ionicons';
import { chevronBackOutline, checkmarkCircleOutline, refreshOutline, calendarOutline, cardOutline, logOutOutline } from 'ionicons/icons';
import { ResetWizardComponent } from './reset-wizard.component';
import { RANGOS, TIPOS_PAGO, MEMBRESIAS, ConfigApp } from '../../core/models/budget.model';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonIcon, IonButton, IonButtons, IonText, CurrencyPipe],
  template: `
  <ion-header class="hdr">
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button fill="clear" (click)="back()" aria-label="Volver al dashboard">
          <ion-icon name="chevron-back-outline"></ion-icon>
        </ion-button>
      </ion-buttons>
      <ion-title>Perfil</ion-title>
    </ion-toolbar>
  </ion-header>

  <ion-content class="bg">
    <div class="container">

      <!-- 1. Quien es el usuario. Una sola tarjeta: lo demas es detalle. -->
      <div class="card perfil">
        <div class="avatar" aria-hidden="true">{{ inicial }}</div>
        <div class="perfil-info">
          <b class="nombre">{{ nombre }}</b>
          <span class="mail">{{ email }}</span>
        </div>
      </div>

      <div class="section-title">Suscripción</div>
      <div class="card sub">
        <div class="sub-head">
          <div class="sub-plan">
            <span class="lbl">Plan actual</span>
            <b class="plan">{{ etiquetaPlanReal }}</b>
          </div>
          <span class="badge"><ion-icon name="checkmark-circle-outline"></ion-icon> {{ estadoMembresia }}</span>
        </div>
        <hr class="sep" />
        <div class="row"><span>Vigencia</span><b>{{ vigenciaMembresia }}</b></div>
        <div class="row"><span>Usuario</span><b>{{ usuario }}</b></div>
      </div>

      <!-- 3. Resumen del mes: los mismos numeros que ve el dashboard, pero
             respondiendo una sola pregunta: "cuanto llevo del mes".
             Arriba el monto gastado contra lo previsto; abajo el desglose. -->
      <div class="section-title">Resumen de gastos · {{ mesActual }}</div>
      <div class="card resumen">
        <div class="resumen-head">
          <span class="lbl">Gastado del mes</span>
          <b class="money gastado" [class.vacio]="gastadoMes === 0">{{ gastadoMes | currency:'MXN':'symbol':'1.0-0' }}</b>
        </div>
        <div class="progress"><div [style.width.%]="pctMes"></div></div>
        <div class="resumen-pie">
          <span class="lbl">{{ pctMes }}% de lo previsto ({{ previstoMes | currency:'MXN':'symbol':'1.0-0' }})</span>
        </div>
        <hr class="sep" />
        <div class="grid2">
          <div class="cell">
            <span class="lbl">Ingresos del mes</span>
            <b class="money">{{ ingresosMes | currency:'MXN':'symbol':'1.0-0' }}</b>
          </div>
          <div class="cell">
            <span class="lbl">Te sobra el mes</span>
            <b class="money" [class.neg]="sobranteMes < 0" [class.cero]="sobranteMes === 0">{{ sobranteMes | currency:'MXN':'symbol':'1.0-0' }}</b>
          </div>
        </div>
        <div class="section-sub">Mayores categorías</div>
        <div class="top">
          @for (r of topCategorias; track r.id) {
          <div class="top-row">
            <span class="cat"><i [style.background]="r.color"></i>{{ r.nombre }}</span>
            <span class="bar"><span [style.width.%]="r.pct"></span></span>
            <b class="money">{{ r.total | currency:'MXN':'symbol':'1.0-0' }}</b>
          </div>
          }
          @if (topCategorias.length === 0) {
            <div class="empty">Sin gastos registrados este mes</div>
          }
        </div>
      </div>

      <!-- 4. Zona destructiva. Va al final y sola: si estuviera arriba
             competiria con el resumen y se toca por error. -->
      <div class="section-title">Datos</div>

      <!-- Como estan hoy los datos: rango de ingreso, tipo de pago y membresia.
             Es lo que se eligio la ultima vez que se restablecio. -->
      <div class="card config">
        <div class="config-head">
          <span class="lbl">Tu configuración</span>
          <span class="badge"><ion-icon name="checkmark-circle-outline"></ion-icon> {{ etiquetaMembresia }}</span>
        </div>
        <div class="row"><span>Rango de ingreso</span><b>{{ etiquetaRango }}</b></div>
        <div class="row"><span>Tipo de pago</span><b>{{ etiquetaPago }}</b></div>
        <div class="row"><span>Plan de ejemplo</span><b>{{ etiquetaMembresia }}</b></div>
        <p class="config-hint">Para cambiarlo, restablecé los datos: te va a preguntar de nuevo.</p>
      </div>

      <div class="card sync">
        <div class="config-head">
          <span class="lbl">Respaldo en la nube</span>
          <span class="lbl">{{ ultimoSync }}</span>
        </div>
        <p class="config-hint">Sube una copia de tus datos. No descarga ni comparte información con otras personas.</p>
        @if (estadoSync.error) { <ion-text color="danger" class="err">{{ estadoSync.error }}</ion-text> }
        <ion-button expand="block" fill="outline" [disabled]="estadoSync.sincronizando" (click)="sincronizar()">
          {{ estadoSync.sincronizando ? 'Sincronizando…' : 'Sincronizar ahora' }}
        </ion-button>
      </div>

      <div class="card danger">
        <span class="lbl">Restablecer datos</span>
        <p class="danger-txt">Te pregunta el rango de ingreso y cómo te pagan, y carga los datos de ejemplo de esa combinación. Borra lo que cargaste a mano. No se puede deshacer.</p>
        <ion-button expand="block" color="danger" fill="outline" (click)="abrirWizard()">
          <ion-icon slot="start" name="refresh-outline"></ion-icon> Restablecer datos
        </ion-button>
      </div>

      <ion-button expand="block" fill="outline" color="danger" (click)="logout()">
        <ion-icon slot="start" name="log-out-outline"></ion-icon> Cerrar sesión
      </ion-button>
    </div>
  </ion-content>
  `,
  styles: [`
  .bg{--background:var(--app-bg)}
  .container{padding:var(--sp-3);max-width:900px;margin:0 auto;display:flex;flex-direction:column;gap:var(--sp-3)}

  .card{background:var(--surface);border-radius:var(--radius-lg);box-shadow:var(--shadow);border:1px solid var(--border);padding:var(--sp-4)}
  .section-title{font-family:'Nunito',sans-serif;font-size:11px;font-weight:800;letter-spacing:.08em;
    color:var(--c-primary);text-transform:uppercase;padding:0 4px;margin-top:var(--sp-2)}
  .section-sub{display:block;font-size:12px;font-weight:700;color:var(--text-muted);margin:var(--sp-4) 0 var(--sp-2)}

  .perfil{display:flex;align-items:center;gap:var(--sp-4)}
  .avatar{
    width:56px;height:56px;flex:none;border-radius:var(--radius-pill);
    background:var(--c-primary);color:#fff;
    display:flex;align-items:center;justify-content:center;
    font-family:'Comfortaa',cursive;font-size:22px;font-weight:700;
    box-shadow:0 6px 16px rgba(0,100,250,.28);
  }
  .perfil-info{display:flex;flex-direction:column;gap:2px;min-width:0}
  .nombre{font-family:'Comfortaa',cursive;font-size:18px;color:var(--text-strong)}
  .mail{font-size:13px;color:var(--text-body);overflow-wrap:anywhere}

  .sub-head{display:flex;justify-content:space-between;align-items:flex-start;gap:var(--sp-3);flex-wrap:wrap}
  .sub-plan{display:flex;flex-direction:column;gap:2px}
  .plan{font-family:'Comfortaa',cursive;font-size:18px;color:var(--text-strong)}
  .badge{
    display:inline-flex;align-items:center;gap:5px;flex:none;
    background:var(--ok-bg);color:var(--ok);font-size:12px;font-weight:800;
    padding:5px 10px;border-radius:var(--radius-pill);
  }
  .badge ion-icon{font-size:15px}
  .sub-precio{display:flex;align-items:baseline;gap:6px;margin-top:var(--sp-3)}
  .sub-precio b{font-size:26px;letter-spacing:-.02em;font-family:var(--font-display);color:var(--c-primary-dark)}

  /* Configuracion actual: rango, tipo de pago y membresia. Es lo que se
     eligio al restablecer, y explica por que los datos de ejemplo son estos. */
  .config-head{display:flex;justify-content:space-between;align-items:flex-start;
    gap:var(--sp-3);flex-wrap:wrap;margin-bottom:var(--sp-2)}
  .config .row{padding:9px 0}
  .config-hint{margin:var(--sp-3) 0 0;font-size:12px;color:var(--text-muted);
    line-height:1.4}
  .err{display:block;margin:var(--sp-2) 0;font-size:12px}

  .resumen-head{display:flex;justify-content:space-between;align-items:baseline;gap:var(--sp-3);flex-wrap:wrap}
  .gastado{font-size:26px;letter-spacing:-.02em}
  .gastado.vacio{color:var(--text-faint)}
  .resumen-pie{margin-top:6px}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-3)}
  @media(max-width:500px){.grid2{grid-template-columns:1fr}}
  .cell{display:flex;flex-direction:column;gap:2px;background:var(--surface-sunken);
    border-radius:var(--radius);padding:var(--sp-3)}
  .cell b{font-size:17px}
  .cell .neg{color:var(--bad)}
  .cell .cero{color:var(--warn)}

  .top-row{display:grid;grid-template-columns:1fr 90px 96px;align-items:center;gap:var(--sp-3);padding:5px 0;font-size:13px}
  .cat{display:flex;align-items:center;gap:var(--sp-2);min-width:0;color:var(--text-body)}
  .cat i{width:8px;height:8px;border-radius:50%;display:inline-block;flex:none}
  .bar{height:8px;background:var(--surface-sunken);border-radius:var(--radius-pill);overflow:hidden}
  .bar > span{display:block;height:100%;background:var(--positive);border-radius:var(--radius-pill)}
  .top-row b{text-align:right}

  .danger{border-color:#f3b0b0;background:var(--bad-bg)}
  .danger-txt{margin:2px 0 var(--sp-4);font-size:13px;color:var(--text-body)}
  `]
})
export class PerfilPage {
  private budget = inject(BudgetService);
  private auth = inject(AuthService);
  private backup = inject(BackupService);
  private router = inject(Router);
  private modalCtrl = inject(ModalController);
  private alertCtrl = inject(AlertController);

  topCategorias: { id: string; nombre: string; color: string; total: number; pct: number }[] = [];
  config: ConfigApp = this.budget.getConfig();
  estadoSync: BackupEstado = { sincronizando: false, ultimo: null, error: null };

  gastadoMes = 0;
  previstoMes = 0;
  ingresosMes = 0;
  sobranteMes = 0;
  pctMes = 0;

  constructor() {
    addIcons({ chevronBackOutline, checkmarkCircleOutline, refreshOutline, calendarOutline, cardOutline, logOutOutline });
    this.backup.estado$.subscribe(estado => this.estadoSync = estado);
    this.budget.gastos$.subscribe(() => this.refresh());
    this.budget.imprevistos$.subscribe(() => this.refresh());
    this.budget.presupuesto$.subscribe(() => this.refresh());
    this.budget.config$.subscribe(() => this.refresh());
    this.refresh();
  }
  ionViewWillEnter() { this.refresh(); }

  get nombre(): string { return this.auth.currentUser()?.nombre || 'Usuario'; }
  get email(): string { return this.auth.currentUser()?.email || 'sin correo'; }
  get inicial(): string { return this.nombre.trim().charAt(0).toUpperCase() || '?'; }
  get mesActual(): string {
    return new Date().toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
  }
  get usuario(): string { return this.auth.currentUser()?.nombre || 'Sin usuario'; }
  get etiquetaPlanReal(): string {
    const tipo = this.auth.membresiaActual()?.tipo;
    return tipo === 'YEAR' ? 'Anual' : tipo === 'MONTH' ? 'Mensual' : 'Sin plan';
  }
  get estadoMembresia(): string {
    return this.auth.membresiaActual()?.estado || 'Sin membresía';
  }
  get vigenciaMembresia(): string {
    const membresia = this.auth.membresiaActual();
    if (!membresia?.fechaInicio || !membresia.fechaFin) return 'Sin vigencia';
    return `${this.fecha(membresia.fechaInicio)} – ${this.fecha(membresia.fechaFin)}`;
  }
  get ultimoSync(): string {
    if (!this.estadoSync.ultimo) return 'Sin respaldos';
    return this.fecha(this.estadoSync.ultimo);
  }

  private fecha(valor: string): string {
    const fecha = new Date(valor);
    return isNaN(fecha.getTime()) ? valor : fecha.toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  async sincronizar(): Promise<void> {
    try { await this.backup.sincronizar(); } catch { return; }
  }

  private refresh() {
    // Los periodos reales: dos quincenas o el mes, segun la config.
    const qs = this.budget.periodos();
    this.config = this.budget.getConfig();
    this.gastadoMes = qs.reduce((s, q) => s + this.budget.resumenQuincena(q).reales, 0);
    this.previstoMes = qs.reduce((s, q) => s + this.budget.resumenQuincena(q).previstos, 0);
    this.ingresosMes = qs.reduce((s, q) => s + this.budget.getIngresoTotal(q), 0);
    this.sobranteMes = this.ingresosMes - this.previstoMes;
    this.pctMes = this.previstoMes ? Math.round((this.gastadoMes / this.previstoMes) * 100) : 0;

    const porCategoria = this.budget.categorias
      .map(c => ({ id: c.id, nombre: c.nombre, color: c.color, total: qs.reduce((s, q) => s + this.budget.getGastos(q).filter(g => g.categoriaId === c.id).reduce((t, g) => t + g.previsto, 0), 0) }))
      .filter(c => c.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 4);
    const max = porCategoria.length ? porCategoria[0].total : 0;
    this.topCategorias = porCategoria.map(c => ({ ...c, pct: max ? Math.round((c.total / max) * 100) : 0 }));
  }

  back() { this.router.navigateByUrl('/tabs/dashboard'); }

  async logout(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Cerrar sesión',
      message: '¿Realmente deseas cerrar sesión?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Cerrar sesión',
          role: 'destructive',
          handler: async () => {
            this.auth.logout();
            await this.router.navigateByUrl('/login', { replaceUrl: true });
          }
        }
      ]
    });
    await alert.present();
  }

  get etiquetaRango(): string { return RANGOS.find(r => r.id === this.config.rango)?.etiqueta ?? ''; }
  get etiquetaPago(): string { return TIPOS_PAGO.find(t => t.id === this.config.tipoPago)?.etiqueta ?? ''; }
  get etiquetaMembresia(): string { return MEMBRESIAS.find(m => m.id === this.config.membresia)?.etiqueta ?? ''; }

  /**
   * Abre el wizard de restablecer: ahi se elige rango de ingreso y tipo de
   * pago (dos quincenas o mensual). Si se confirma, se aplican los datos de
   * ejemplo de esa combinacion.
   */
  async abrirWizard() {
    const modal = await this.modalCtrl.create({ component: ResetWizardComponent, breakpoints: [0, 0.9], initialBreakpoint: 0.9, handle: true, cssClass: 'wz-90' });
    await modal.present();
    const { data, role } = await modal.onWillDismiss();
    if (role === 'confirm' && data) { this.budget.resetConConfig(data); this.refresh(); }
  }
}