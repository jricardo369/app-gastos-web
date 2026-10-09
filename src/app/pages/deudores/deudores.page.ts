import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonInput, IonItem, IonIcon, IonText, ModalController, AlertController, ToastController, IonButtons } from '@ionic/angular';
import { CurrencyPipe } from '@angular/common';
import { BudgetService } from '../../core/services/budget.service';
import { addIcons } from 'ionicons';
import { cashOutline, checkmarkCircle, addOutline, chevronDownOutline, chevronUpOutline, chevronForwardOutline, walletOutline, alertCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-deudor-simple-modal',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonInput, IonButton, IonButtons, IonText, FormsModule],
  template: `
  <ion-header><ion-toolbar><ion-title>{{ isEdit ? 'Editar deudor' : 'Nuevo deudor' }}</ion-title><ion-buttons slot="end"><ion-button (click)="cancel()">Cerrar</ion-button></ion-buttons></ion-toolbar></ion-header>
  <ion-content class="ion-padding">
    <ion-item><ion-input label="Fecha alta" labelPlacement="stacked" type="date" [(ngModel)]="fecha" [disabled]="true"></ion-input></ion-item>
    <ion-item><ion-input label="Fecha vencimiento" labelPlacement="stacked" type="date" [(ngModel)]="fechaVenc"></ion-input></ion-item>
    <ion-item><ion-input label="Descripción" labelPlacement="stacked" [(ngModel)]="desc" placeholder="Ej. Préstamo a Juan"></ion-input></ion-item>
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
export class DeudorSimpleModal {
  @Input() fecha: string = new Date().toISOString().slice(0,10);
  @Input() fechaVenc: string = '';
  @Input() desc: string = '';
  @Input() monto: any = null;
  @Input() isEdit: boolean = false;
  error = '';
  constructor(private modalCtrl: ModalController) {}
  cancel(){ this.modalCtrl.dismiss(null); }
  remove(){ this.modalCtrl.dismiss({ remove: true }); }
  save(){
    if (!this.desc?.trim()) { this.error = 'Escribe una descripción'; return; }
    if (this.monto === null || this.monto === '' || Number(this.monto) <= 0) { this.error = 'Escribe un monto válido'; return; }
    this.error = '';
    this.modalCtrl.dismiss({ fecha:this.fecha, fechaVenc:this.fechaVenc, desc:this.desc.trim(), monto:Number(this.monto)});
  }
}

@Component({
  selector: 'app-deudores',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon, FormsModule, CurrencyPipe],
  template: `
  <ion-header><ion-toolbar><ion-title>Me deben</ion-title></ion-toolbar></ion-header>
  <ion-content class="bg">
    <div class="container">

      <!-- Total primero: es la pregunta de esta pantalla -->
      <div class="card head-card">
        <span class="lbl">Total por cobrar</span>
        <b class="money big">{{ total | currency:'MXN':'symbol':'1.0-0' }}</b>
        <div class="stats">
          <div class="stat"><span class="lbl">Personas</span><b class="money">{{ activos.length }}</b></div>
          <div class="stat"><span class="lbl">Vencidos</span><b class="money" [class.warn]="vencidos.length > 0">{{ vencidos.length }}</b></div>
          <div class="stat"><span class="lbl">Cobrado</span><b class="money ok">{{ cobrado | currency:'MXN':'symbol':'1.0-0' }}</b></div>
        </div>
      </div>

      <div class="card">
        <header class="head">
          <div class="panel-title">
            <span class="lbl">Pendientes</span>
            <span class="count">{{ activos.length }} por cobrar</span>
          </div>
          <ion-button size="small" (click)="openAdd()">
            <ion-icon slot="start" name="add-outline" aria-hidden="true"></ion-icon>Agregar
          </ion-button>
        </header>
        <div class="list">
          @for (d of activos; track d.id){
            <div class="li row-click" role="button" tabindex="0"
                 [attr.aria-label]="'Editar ' + d.nombre" (click)="edit(d)" (keydown.enter)="edit(d)">
              <div class="li-body">
                <span class="li-title">{{ d.nombre }}</span>
                <span class="li-sub" [class.warn-txt]="estaVencido(d)">
                  @if(estaVencido(d)){ <ion-icon name="alert-circle-outline" aria-hidden="true"></ion-icon> }
                  Alta {{ fechaCorta(d.fechaInicio) }}@if (d.fechaFin) { · vence {{ fechaCorta(d.fechaFin) }} }
                </span>
              </div>
              <span class="li-amount num">{{ d.saldo | currency:'MXN':'symbol':'1.0-0' }}</span>
              <button type="button" class="icon-btn" (click)="toHistorial(d); $event.stopPropagation()"
                      [attr.aria-label]="'Marcar ' + d.nombre + ' como cobrado'">
                <ion-icon name="cash-outline" aria-hidden="true"></ion-icon>
              </button>
              <ion-icon class="li-chev" name="chevron-forward-outline" aria-hidden="true"></ion-icon>
            </div>
          }
          @if(activos.length===0){
            <div class="empty">
              <ion-icon name="wallet-outline" aria-hidden="true"></ion-icon>
              <p>Nadie te debe nada</p>
              <ion-button size="small" fill="outline" (click)="openAdd()">Agregar deudor</ion-button>
            </div>
          }
        </div>
        <div class="card-foot">
          <ion-button size="small" fill="clear" (click)="historialVisible=!historialVisible">
            <ion-icon slot="start" [name]="historialVisible ? 'chevron-up-outline' : 'chevron-down-outline'" aria-hidden="true"></ion-icon>
            {{historialVisible?'Ocultar historial':'Ver historial de cobros'}}
          </ion-button>
        </div>
        @if(historialVisible){
        <div class="sublist">
          @for (d of historial; track d.id){
            <div class="li sm">
              <div class="li-body">
                <span class="li-title">{{ d.nombre }}</span>
                <span class="li-sub">{{ fechaCorta(d.fechaInicio) }}</span>
              </div>
              <span class="li-amount num">{{ d.saldo | currency:'MXN':'symbol':'1.0-0' }}</span>
              <ion-icon name="checkmark-circle" class="ok" aria-hidden="true"></ion-icon>
            </div>
          }
          @if(historial.length===0){ <div class="empty sm">Sin historial</div> }
        </div>
        }
      </div>
    </div>
  </ion-content>
  `,
  styles: [`
  .bg{--background:#eef2f7}
  .container{padding:var(--sp-3);max-width:900px;margin:0 auto;display:flex;flex-direction:column;gap:var(--sp-3)}
  .card{background:var(--surface);border-radius:var(--radius-lg);box-shadow:var(--shadow);border:1px solid var(--border);overflow:hidden}

  /* El total no es un encabezado de color: es la cifra de la pantalla */
  .head-card{display:flex;flex-direction:column;gap:var(--sp-1);padding:var(--sp-4)}
  .money.big{font-size:30px;line-height:1.1;letter-spacing:-.02em}
  .stats{display:grid;grid-template-columns:repeat(3,1fr);gap:var(--sp-2);margin-top:var(--sp-2)}
  .stat{display:flex;flex-direction:column;gap:2px;padding:var(--sp-2) var(--sp-3);
    background:var(--surface-sunken);border-radius:var(--radius)}
  .stat b{font-size:14px;font-weight:800;color:var(--text-strong);font-variant-numeric:tabular-nums}
  .money.warn{color:var(--warn)}
  .money.ok{color:var(--ok)}

  /* Misma cabecera que en gastos y deudas: titulo y cuantos a la izquierda,
     boton de Agregar a la derecha */
  .head{display:flex;justify-content:space-between;align-items:center;gap:var(--sp-2);
    padding:var(--sp-3) var(--sp-4);border-bottom:1px solid var(--border-subtle);flex-wrap:wrap}
  .panel-title{display:flex;flex-direction:column;gap:1px;min-width:0}
  .count{font-family:'Nunito', sans-serif;font-size:11px;font-weight:700;color:var(--text-faint)}
  .head ion-button{margin:0;min-height:34px}

  .list{display:flex;flex-direction:column}
  .sublist{background:var(--surface-sunken);border-top:1px solid var(--border-subtle)}

  .li{display:flex;align-items:center;gap:var(--sp-3);padding:var(--sp-3) var(--sp-4);
    min-height:56px;border-bottom:1px solid var(--border-subtle);text-align:left;width:100%;
    background:transparent;border-left:none;border-right:none;border-top:none;font-family:inherit}
  .li:last-child{border-bottom:none}
  .li.sm{padding:10px var(--sp-4);min-height:48px}
  .li-body{display:flex;flex-direction:column;gap:3px;flex:1;min-width:0}
  .li-title{font-size:14px;font-weight:600;color:var(--text-body);overflow-wrap:anywhere}
  .li-sub{display:flex;align-items:center;gap:4px;font-size:11px;color:var(--text-faint)}
  .li-sub ion-icon{font-size:12px}
  /* Vencido: ambar, el mismo semantico que en el resto de la app */
  .li-sub.warn-txt{color:var(--warn)}
  .li-amount{font-size:14px;font-weight:800;color:var(--text-strong);white-space:nowrap;
    font-variant-numeric:tabular-nums}
  .row-click{cursor:pointer;transition:background .15s ease}
  .row-click:hover{background:var(--surface-sunken)}
  .row-click:focus-visible{outline:2px solid var(--accent);outline-offset:-2px}
  /* Flecha: la fila se edita al tocarla */
  .li-chev{flex:none;font-size:16px;color:var(--text-faint)}
  .icon-btn{display:flex;align-items:center;justify-content:center;flex:none;width:36px;height:36px;
    border:none;background:transparent;color:var(--text-muted);cursor:pointer;
    border-radius:var(--radius-sm);font-size:18px;transition:background .15s ease}
  .icon-btn ion-icon{font-size:18px}
  .icon-btn:hover{background:var(--surface-input);color:var(--text-strong)}
  .icon-btn:focus-visible{outline:2px solid var(--accent);outline-offset:1px}
  .ok{color:var(--positive);font-size:16px;flex:none}
  .card-foot{display:flex;justify-content:center;padding:0 var(--sp-2) var(--sp-1)}
  .card-foot ion-button{margin:0;min-height:36px}
  .card-foot ion-icon{font-size:14px}

  /* Estado vacio con accion directa */
  .empty{display:flex;flex-direction:column;align-items:center;gap:var(--sp-2);
    padding:var(--sp-6) var(--sp-4);text-align:center}
  .empty.sm{padding:var(--sp-4)}
  .empty ion-icon{font-size:26px;color:var(--text-faint)}
  .empty p{margin:0;font-size:13px;color:var(--text-faint)}
  .empty ion-button{margin:var(--sp-1) 0 0;min-height:36px}

  @media (prefers-reduced-motion: reduce){
    .row-click,.icon-btn{transition:none}
  }
  `]
})
export class DeudoresPage {
  lista: any[] = [];
  activos: any[] = [];
  historial: any[] = [];
  vencidos: any[] = [];
  cobrado = 0;
  total = 0;
  historialVisible = false;
  constructor(private budget: BudgetService, private modalCtrl: ModalController, private alertCtrl: AlertController, private toastCtrl: ToastController){
    addIcons({ cashOutline, checkmarkCircle, addOutline, chevronDownOutline, chevronUpOutline, chevronForwardOutline, walletOutline, alertCircleOutline });
    this.refresh();
    this.budget.deudoresLista$.subscribe(()=>this.refresh());
  }
  /** Las fechas vienen en ISO (2026-10-09): se muestran en formato local
      corto, igual que en el resto de las pestañas. */
  private readonly fmtFecha = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  fechaCorta(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    if (isNaN(d.getTime())) return iso;
    return this.fmtFecha.format(d).replace(/\.$/, '');
  }
  /** Vencido = tenia fecha de vencimiento y ya paso: se marca en ambar. */
  estaVencido(d: any): boolean {
    if (!d.fechaFin) return false;
    const v = new Date(d.fechaFin + 'T00:00:00');
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    return v < hoy;
  }
  refresh(){
    this.lista = this.budget.getDeudoresLista();
    this.activos = this.lista.filter((d:any)=> !(d.pagados>0 && d.pagados>=d.pagos));
    this.historial = this.lista.filter((d:any)=> d.pagados>0 && d.pagados>=d.pagos);
    this.vencidos = this.activos.filter((d:any)=> this.estaVencido(d));
    this.cobrado = this.historial.reduce((s,d)=>s+(Number(d.saldo)||0),0);
    this.total = this.activos.reduce((s,d)=>s+d.saldo,0);
  }
  async openAdd(){
    const modal = await this.modalCtrl.create({ component: DeudorSimpleModal, breakpoints: [0,0.7], initialBreakpoint: 0.7, handle: true, cssClass: 'tc-70' });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if(data && data.desc){
      this.budget.addDeudorLista({ nombre: data.desc, fechaInicio: data.fecha || new Date().toISOString().slice(0,10), fechaFin: data.fechaVenc || '', pagado: 0, saldo: data.monto, mensualidad: data.monto, desc: data.desc, pagos: 1, pagados: 0, estatus: 'Pendiente', tipo: '' });
      this.refresh();
    }
  }
  async edit(d:any){
    const modal = await this.modalCtrl.create({ component: DeudorSimpleModal, componentProps: { fecha: d.fechaInicio, fechaVenc: d.fechaFin, desc: d.nombre, monto: d.saldo, isEdit: true }, breakpoints: [0,0.7], initialBreakpoint: 0.7, handle: true, cssClass: 'tc-70' });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if(data?.remove){ this.budget.removeDeudorLista(d.id); this.refresh(); return; }
    if(data && data.desc){
      this.budget.updateDeudorLista(d.id, { nombre: data.desc, fechaInicio: data.fecha, fechaFin: data.fechaVenc || '', mensualidad: data.monto, saldo: data.monto, desc: data.desc });
      this.refresh();
    }
  }
  async toHistorial(d:any){
    if(d.pagados>0 && d.pagados>=d.pagos) return;
    const alert = await this.alertCtrl.create({
      header: 'Terminar cobro',
      message: `¿Realmente deseas terminar "${d.nombre}" y enviarlo al historial?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Terminar', handler: async () => {
            this.budget.updateDeudorLista(d.id, { pagados: 1, pagos: 1 });
            this.refresh();
            this.historialVisible = true;
            const toast = await this.toastCtrl.create({ message: 'Se agregó correctamente a historial de pagos', duration: 2000, color: 'success', position: 'bottom' });
            await toast.present();
          }
        }
      ]
    });
    await alert.present();
  }
}
