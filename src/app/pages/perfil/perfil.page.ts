import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonIcon, IonButton, IonButtons, AlertController } from '@ionic/angular';
import { CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { BudgetService } from '../../core/services/budget.service';
import { AuthService } from '../../core/services/auth.service';
import { addIcons } from 'ionicons';
import { chevronBackOutline, checkmarkCircleOutline, refreshOutline, calendarOutline, cardOutline } from 'ionicons/icons';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonIcon, IonButton, IonButtons, CurrencyPipe],
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
          <span class="lbl">Miembro desde {{ miembroDesde }}</span>
        </div>
      </div>

      <!-- 2. Suscripcion: ficticia, mensual y vigente.
            El estado va con color semantico (verde = al dia) porque informa,
            no decora. El resto de la tarjeta es neutro. -->
      <div class="section-title">Suscripción</div>
      <div class="card sub">
        <div class="sub-head">
          <div class="sub-plan">
            <span class="lbl">Plan actual</span>
            <b class="plan">Premium</b>
          </div>
          <span class="badge"><ion-icon name="checkmark-circle-outline"></ion-icon> {{ suscripcion.estado }}</span>
        </div>
        <div class="sub-precio">
          <b class="money">{{ suscripcion.precio | currency:'MXN':'symbol':'1.0-0' }}</b>
          <span class="lbl">/ {{ suscripcion.periodo }} · se renueva automáticamente</span>
        </div>
        <hr class="sep" />
        <div class="row"><span>Próximo cobro</span><b>{{ proximoCobro }}</b></div>
        <div class="row"><span>Método de pago</span><b>{{ suscripcion.metodo }}</b></div>
        <div class="row"><span>Ciclos pagados</span><b>{{ suscripcion.ciclosPagados }} de {{ suscripcion.ciclosPagados }}</b></div>
        <div class="row"><span>Suscripción desde</span><b>{{ suscripcion.desde }}</b></div>
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
      <div class="card danger">
        <span class="lbl">Restablecer datos</span>
        <p class="danger-txt">Borra todo lo que cargaste a mano y vuelve la data de ejemplo: gastos por quincena, presupuesto, deudas y movimientos. No se puede deshacer.</p>
        <ion-button expand="block" color="danger" fill="outline" (click)="confirmReset()">
          <ion-icon slot="start" name="refresh-outline"></ion-icon> Restablecer datos
        </ion-button>
      </div>
    </div>
  </ion-content>
  `,
  styles: [`
  .hdr ion-toolbar{--background:#fff}
  .bg{--background:#eef2f7}
  .container{padding:var(--sp-3);max-width:900px;margin:0 auto;display:flex;flex-direction:column;gap:var(--sp-3)}

  .card{background:var(--surface);border-radius:var(--radius-lg);box-shadow:var(--shadow);border:1px solid var(--border);padding:var(--sp-4)}
  .section-title{font-family:'Comfortaa',cursive;font-size:13px;color:var(--text-muted);padding:0 2px;margin-top:var(--sp-2)}
  .section-sub{display:block;font-size:12px;font-weight:700;color:var(--text-muted);margin:var(--sp-4) 0 var(--sp-2)}

  .perfil{display:flex;align-items:center;gap:var(--sp-4)}
  .avatar{
    width:56px;height:56px;flex:none;border-radius:var(--radius-pill);
    background:var(--info-bg);color:var(--info);
    display:flex;align-items:center;justify-content:center;
    font-family:'Comfortaa',cursive;font-size:22px;font-weight:700;
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
  .sub-precio b{font-size:26px;letter-spacing:-.02em}

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
  /** Datos de suscripcion ficticios: mensual y vigente. */
  suscripcion = {
    plan: 'Premium',
    precio: 99,
    periodo: 'mes',
    estado: 'Vigente',
    metodo: 'Visa •••• 4242',
    desde: '12 sep 2025',
    ciclosPagados: 13,
  };
  miembroDesde = 'sep 2025';
  topCategorias: { id: string; nombre: string; color: string; total: number; pct: number }[] = [];

  gastadoMes = 0;
  previstoMes = 0;
  ingresosMes = 0;
  sobranteMes = 0;
  pctMes = 0;

  constructor(private budget: BudgetService, private auth: AuthService, private router: Router, private alertCtrl: AlertController) {
    addIcons({ chevronBackOutline, checkmarkCircleOutline, refreshOutline, calendarOutline, cardOutline });
    this.budget.gastos$.subscribe(() => this.refresh());
    this.budget.imprevistos$.subscribe(() => this.refresh());
    this.budget.presupuesto$.subscribe(() => this.refresh());
    this.refresh();
  }
  ionViewWillEnter() { this.refresh(); }

  get nombre(): string { return this.auth.currentUser()?.nombre || 'Usuario'; }
  get email(): string { return this.auth.currentUser()?.email || 'sin correo'; }
  /** Primera letra del nombre, para el avatar. */
  get inicial(): string { return this.nombre.trim().charAt(0).toUpperCase() || '?'; }
  get mesActual(): string {
    return new Date().toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
  }
  /** Primer dia del mes siguiente: cuando toca el proximo cargo. */
  get proximoCobro(): string {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + 1);
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  private refresh() {
    const qs = ['Q1', 'Q2'] as const;
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

  /**
   * Mismo restablecer que tenia el dashboard, ahora dentro del perfil.
   * Es destructivo: por eso pide confirmacion y explica que se pierde.
   */
  async confirmReset() {
    const alert = await this.alertCtrl.create({
      header: '¿Restablecer los datos?',
      message: 'Se borra todo lo que cargaste a mano y vuelve la data de ejemplo (gastos por quincena, presupuesto, deudas, movimientos). No se puede deshacer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Restablecer',
          role: 'destructive',
          handler: () => {
            this.budget.resetTodo();
          },
        },
      ],
    });
    await alert.present();
  }
}
