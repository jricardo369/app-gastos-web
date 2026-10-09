import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonInput, IonItem, IonButtons, IonIcon, IonText, IonSelect, IonSelectOption, ModalController, AlertController, ToastController } from '@ionic/angular';
import { CurrencyPipe } from '@angular/common';
import { BudgetService } from '../../core/services/budget.service';
import { addIcons } from 'ionicons';
import { addOutline, cashOutline, eyeOutline, createOutline, chevronForwardOutline, cardOutline } from 'ionicons/icons';

@Component({
  selector: 'app-mov-modal',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonInput, IonSelect, IonSelectOption, IonButton, IonButtons, IonText, FormsModule],
  template: `
  <ion-header><ion-toolbar><ion-title>{{ isEdit ? 'Editar movimiento' : 'Nuevo movimiento' }}</ion-title><ion-buttons slot="end"><ion-button (click)="cancel()">Cerrar</ion-button></ion-buttons></ion-toolbar></ion-header>
  <ion-content class="ion-padding">
    <ion-item><ion-input label="Fecha" labelPlacement="stacked" type="date" [(ngModel)]="fecha"></ion-input></ion-item>
    <ion-item><ion-input label="Descripción" labelPlacement="stacked" [(ngModel)]="descripcion" placeholder="Ej.Compra en línea"></ion-input></ion-item>
    <ion-item><ion-select label="Tipo" labelPlacement="stacked" [(ngModel)]="tipo"><ion-select-option value="compras">Compras</ion-select-option><ion-select-option value="abono">Abono</ion-select-option></ion-select></ion-item>
    <ion-item><ion-input label="Monto ($)" labelPlacement="stacked" type="number" [(ngModel)]="monto"></ion-input></ion-item>
    <!-- Antes el guardar no hacia nada si faltaba algo: ahora se ve que falta. -->
    @if(error){ <ion-text color="danger" class="err">{{ error }}</ion-text> }
    <div style="display:flex;gap:8px;margin-top:20px">
      @if(isEdit){ <ion-button color="danger" fill="outline" (click)="remove()" style="flex:1">Eliminar</ion-button> }
      <ion-button (click)="save()" style="flex:1">{{isEdit?'Guardar':'Agregar'}}</ion-button>
    </div>
  </ion-content>
  `,
  styles: [`.err{display:block;margin:8px 0 0;font-size:13px}`],
})
export class MovModalComponent {
  @Input() fecha: string = new Date().toISOString().slice(0,10);
  @Input() descripcion: string = '';
  @Input() tipo: string = 'compras';
  @Input() monto: any = 0;
  @Input() isEdit: boolean = false;
  error = '';
  constructor(private modalCtrl: ModalController) {}
  cancel(){ this.modalCtrl.dismiss(null); }
  remove(){ this.modalCtrl.dismiss({ remove: true }); }
  save(){
    if (!this.descripcion?.trim()) { this.error = 'Escribe una descripción'; return; }
    if (this.monto === null || this.monto === '' || Number(this.monto) <= 0) { this.error = 'Escribe un monto válido'; return; }
    this.error = '';
    const compras = this.tipo==='compras' ? Number(this.monto)||0 : 0;
    const abonos = this.tipo==='abono' ? Number(this.monto)||0 : 0;
    this.modalCtrl.dismiss({ fecha:this.fecha, descripcion:this.descripcion.trim(), compras, abonos });
  }
}

@Component({
  selector: 'app-movimientos',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon, FormsModule, CurrencyPipe],
  template: `
  <ion-header><ion-toolbar><ion-title>Movimientos TC</ion-title></ion-toolbar></ion-header>
  <ion-content class="bg">
    <div class="container">

      <!-- Configuracion: 3 datos, con la misma cabecera que las otras tarjetas -->
      <div class="card">
        <header class="head">
          <div class="panel-title">
            <span class="lbl">Configuración de la tarjeta</span>
            <span class="count">Corte y pago</span>
          </div>
          <ion-button size="small" (click)="editConfig()">
            <ion-icon slot="start" name="create-outline" aria-hidden="true"></ion-icon>Editar
          </ion-button>
        </header>
        <div class="stats">
          <div class="stat"><span class="lbl">Corte</span><b class="money">día {{cfg.fechaCorte}}</b></div>
          <div class="stat"><span class="lbl">Pago</span><b class="money">día {{cfg.fechaPago}}</b></div>
          <div class="stat"><span class="lbl">PPNGI</span><b class="money">{{cfg.ppngi | currency:'MXN':'symbol':'1.0-0'}}</b></div>
        </div>
      </div>

      <div class="card">
        <header class="head">
          <div class="panel-title">
            <span class="lbl">Movimientos</span>
            <span class="count">{{ rows.length }} registros</span>
          </div>
          <ion-button size="small" (click)="openAdd()">
            <ion-icon slot="start" name="add-outline" aria-hidden="true"></ion-icon>Agregar
          </ion-button>
        </header>
        <div class="list">
          @for (r of rows; track r.id){
            <div class="li row-click" role="button" tabindex="0"
                 [attr.aria-label]="'Editar movimiento ' + r.descripcion" (click)="edit(r.orig)" (keydown.enter)="edit(r.orig)">
              <div class="li-body">
                <span class="li-title">{{ r.descripcion }}</span>
                <span class="li-sub">{{ fechaCorta(r.fecha) }}</span>
              </div>
              <div class="li-moves">
                @if (r.compras) { <span class="move out">−{{ r.compras | currency:'MXN':'symbol':'1.0-0' }}</span> }
                @if (r.abonos) { <span class="move in">+{{ r.abonos | currency:'MXN':'symbol':'1.0-0' }}</span> }
              </div>
              <span class="li-saldo">{{ r.saldo | currency:'MXN':'symbol':'1.0-0' }}</span>
              <ion-icon class="li-chev" name="chevron-forward-outline" aria-hidden="true"></ion-icon>
            </div>
          }
          @if(rows.length===0){
            <div class="empty">
              <ion-icon name="card-outline" aria-hidden="true"></ion-icon>
              <p>Sin movimientos</p>
              <ion-button size="small" fill="outline" (click)="openAdd()">Agregar movimiento</ion-button>
            </div>
          }
        </div>
        <div class="totals">
          <div class="tot"><span class="lbl">Compras</span><b class="money out">{{ totalCompras | currency:'MXN':'symbol':'1.0-0' }}</b></div>
          <div class="tot"><span class="lbl">Abonos</span><b class="money in">{{ totalAbonos | currency:'MXN':'symbol':'1.0-0' }}</b></div>
          <div class="tot"><span class="lbl">Saldo</span><b class="money">{{ saldoFinal | currency:'MXN':'symbol':'1.0-0' }}</b></div>
        </div>
      </div>
    </div>
  </ion-content>
  `,
  styles: [`
  .bg{--background:#eef2f7}
  .container{padding:var(--sp-3);max-width:900px;margin:0 auto;display:flex;flex-direction:column;gap:var(--sp-3)}
  .card{background:var(--surface);border-radius:var(--radius-lg);box-shadow:var(--shadow);border:1px solid var(--border);overflow:hidden}

  /* Misma cabecera que en gastos y deudas: etiqueta + cuantos a la
     izquierda y la accion a la derecha */
  .head{display:flex;justify-content:space-between;align-items:center;gap:var(--sp-2);
    padding:var(--sp-3) var(--sp-4);border-bottom:1px solid var(--border-subtle);flex-wrap:wrap}
  .panel-title{display:flex;flex-direction:column;gap:1px;min-width:0}
  .count{font-family:'Nunito', sans-serif;font-size:11px;font-weight:700;color:var(--text-faint)}
  .head ion-button{margin:0;min-height:34px}

  .stats{display:grid;grid-template-columns:repeat(3,1fr);gap:var(--sp-2);padding:var(--sp-3) var(--sp-4)}
  .stat{display:flex;flex-direction:column;gap:2px;padding:var(--sp-2) var(--sp-3);
    background:var(--surface-sunken);border-radius:var(--radius)}
  .stat b{font-size:14px;font-weight:800;color:var(--text-strong);font-variant-numeric:tabular-nums}

  .list{display:flex;flex-direction:column}

  /* Compras y abonos van apilados con signo explicito (+ / −) en vez de
     dos columnas mas un saldo. En mobile se lee mejor y no hay que
     recordar que columna era cada una. */
  .li{display:flex;align-items:center;gap:var(--sp-3);padding:var(--sp-3) var(--sp-4);
    min-height:56px;border-bottom:1px solid var(--border-subtle);text-align:left;width:100%;
    background:transparent;border-left:none;border-right:none;border-top:none;font-family:inherit}
  .li:last-child{border-bottom:none}
  .li-body{display:flex;flex-direction:column;gap:3px;flex:1;min-width:0}
  .li-title{font-size:14px;font-weight:600;color:var(--text-body);overflow-wrap:anywhere}
  .li-sub{font-size:11px;color:var(--text-faint)}
  .li-moves{display:flex;flex-direction:column;align-items:flex-end;gap:2px;flex:none}
  .move{font-size:12px;font-weight:700;white-space:nowrap;font-variant-numeric:tabular-nums}
  .move.in{color:var(--ok)}
  .move.out{color:var(--bad)}
  .li-saldo{font-size:14px;font-weight:800;color:var(--text-strong);white-space:nowrap;
    min-width:88px;text-align:right;flex:none;font-variant-numeric:tabular-nums}
  /* Flecha: la fila se edita al tocarla */
  .li-chev{flex:none;font-size:16px;color:var(--text-faint)}
  .row-click{cursor:pointer;transition:background .15s ease}
  .row-click:hover{background:var(--surface-sunken)}
  .row-click:focus-visible{outline:2px solid var(--accent);outline-offset:-2px}

  /* Totales al final, igual que en la pestaña de deudas */
  .totals{display:grid;grid-template-columns:repeat(3,1fr);gap:var(--sp-2);
    padding:var(--sp-3) var(--sp-4);border-top:1px solid var(--border-subtle)}
  .tot{display:flex;flex-direction:column;gap:2px;padding:var(--sp-2) var(--sp-3);
    background:var(--surface-sunken);border-radius:var(--radius)}
  .tot b{font-size:14px;font-weight:800;color:var(--text-strong);font-variant-numeric:tabular-nums}
  .tot b.in{color:var(--ok)}
  .tot b.out{color:var(--bad)}

  /* Estado vacio con accion directa */
  .empty{display:flex;flex-direction:column;align-items:center;gap:var(--sp-2);
    padding:var(--sp-6) var(--sp-4);text-align:center}
  .empty ion-icon{font-size:26px;color:var(--text-faint)}
  .empty p{margin:0;font-size:13px;color:var(--text-faint)}
  .empty ion-button{margin:var(--sp-1) 0 0;min-height:36px}

  @media (prefers-reduced-motion: reduce){
    .row-click{transition:none}
  }
  `]
})
export class MovimientosPage {
  cfg = this.budget.getMovConfig();
  movimientos: any[] = [];
  rows: any[] = [];
  totalCompras = 0;
  totalAbonos = 0;
  saldoFinal = 0;
  constructor(private budget: BudgetService, private modalCtrl: ModalController, private alertCtrl: AlertController, private toastCtrl: ToastController){
    addIcons({ addOutline, cashOutline, eyeOutline, createOutline, chevronForwardOutline, cardOutline });
    this.refresh();
    this.budget.movimientos$.subscribe(()=>this.refresh());
    this.budget.movConfig$.subscribe(c=>this.cfg=c);
  }
  /** Fechas en ISO a formato local corto, igual que en las otras pestañas. */
  private readonly fmtFecha = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  fechaCorta(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    if (isNaN(d.getTime())) return iso;
    return this.fmtFecha.format(d).replace(/\.$/, '');
  }
  refresh(){
    this.cfg = this.budget.getMovConfig();
    this.movimientos = this.budget.getMovimientos();
    let saldo = 19800;
    const sorted = [...this.movimientos].sort((a,b)=> a.fecha.localeCompare(b.fecha));
    this.rows = sorted.map(m=>{
      const isSaldoIni = m.descripcion.toLowerCase().includes('saldo inicial');
      if(isSaldoIni){
        saldo = 19800;
        return { ...m, orig:m, saldo };
      }
      saldo = saldo + (Number(m.compras)||0) - (Number(m.abonos)||0);
      return { ...m, orig:m, saldo };
    });
    this.totalCompras = this.rows.reduce((s,m)=>s+(Number(m.compras)||0),0);
    this.totalAbonos = this.rows.reduce((s,m)=>s+(Number(m.abonos)||0),0);
    this.saldoFinal = this.rows.length ? this.rows[this.rows.length-1].saldo : 19800;
  }
  async openAdd(){
    const modal = await this.modalCtrl.create({ component: MovModalComponent, breakpoints:[0,0.7], initialBreakpoint:0.7, handle:true, cssClass:'tc-70' });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if(data && data.descripcion){
      this.budget.addMovimiento({ fecha: data.fecha, descripcion: data.descripcion, compras: data.compras, abonos: data.abonos });
    }
  }
  async edit(m:any){
    const tipo = (Number(m.abonos)||0) > 0 ? 'abono' : 'compras';
    const monto = tipo==='abono' ? m.abonos : m.compras;
    const modal = await this.modalCtrl.create({ component: MovModalComponent, componentProps:{ fecha:m.fecha, descripcion:m.descripcion, tipo, monto, isEdit:true }, breakpoints:[0,0.7], initialBreakpoint:0.7, handle:true, cssClass:'tc-70' });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if(data?.remove){ this.budget.removeMovimiento(m.id); return; }
    if(data && data.descripcion){
      this.budget.updateMovimiento(m.id, { fecha:data.fecha, descripcion:data.descripcion, compras:data.compras, abonos:data.abonos });
    }
  }
  async editConfig(){
    const alert = await this.alertCtrl.create({
      header: 'Configuración',
      inputs: [
        { name:'corte', type:'number', value:String(this.cfg.fechaCorte), placeholder:'Fecha corte' },
        { name:'pago', type:'number', value:String(this.cfg.fechaPago), placeholder:'Fecha pago' },
        { name:'ppngi', type:'number', value:String(this.cfg.ppngi), placeholder:'PPNGI' },
      ],
      buttons: [
        { text:'Cancelar', role:'cancel' },
        { text:'Guardar', handler: (d)=>{
            this.budget.setMovConfig({ fechaCorte:Number(d.corte)||13, fechaPago:Number(d.pago)||6, ppngi:Number(d.ppngi)||1280 });
            return true;
          }
        }
      ]
    });
    await alert.present();
  }
}
