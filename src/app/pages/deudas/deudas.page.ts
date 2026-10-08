import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonInput, IonItem, IonButtons, IonIcon, ModalController, AlertController, ToastController } from '@ionic/angular';
import { CurrencyPipe } from '@angular/common';
import { BudgetService } from '../../core/services/budget.service';
import { addIcons } from 'ionicons';
import { checkmarkCircle, cashOutline } from 'ionicons/icons';

@Component({
  selector: 'app-tc-modal',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonInput, IonButton, IonButtons, FormsModule],
  template: `
  <ion-header><ion-toolbar><ion-title>{{isEdit?'Editar':'Nuevo'}} pago TC</ion-title><ion-buttons slot="end"><ion-button (click)="cancel()">Cerrar</ion-button></ion-buttons></ion-toolbar></ion-header>
  <ion-content class="ion-padding">
    <ion-item><ion-input label="Fecha" labelPlacement="stacked" type="date" [(ngModel)]="fecha"></ion-input></ion-item>
    @if(showTipo){ <ion-item><ion-input label="Tipo" labelPlacement="stacked" [(ngModel)]="tipo" placeholder="Ej. General"></ion-input></ion-item> }
    <ion-item><ion-input label="Descripción" labelPlacement="stacked" [(ngModel)]="desc" placeholder="Ej. TV"></ion-input></ion-item>
    <ion-item><ion-input label="Monto ($)" labelPlacement="stacked" type="number" [(ngModel)]="monto"></ion-input></ion-item>
    <ion-item><ion-input label="Mensualidades (total)" labelPlacement="stacked" type="number" [(ngModel)]="mensualidad"></ion-input></ion-item>
    @if(isEdit){ <ion-item><ion-input label="Mensualidades pagadas" labelPlacement="stacked" type="number" [(ngModel)]="pagadas"></ion-input></ion-item> }
    <div style="display:flex;gap:8px;margin-top:20px">
      @if(isEdit){ <ion-button color="danger" fill="outline" (click)="remove()" style="flex:1">Eliminar</ion-button> }
      <ion-button (click)="save()" style="flex:1">{{isEdit?'Guardar':'Agregar'}}</ion-button>
    </div>
  </ion-content>
  `,
})
export class TcModalComponent {
  @Input() fecha: string = new Date().toISOString().slice(0,10);
  @Input() desc: string = '';
  @Input() monto: any = null;
  @Input() mensualidad: any = 1;
  @Input() pagadas: any = 0;
  @Input() tipo: string = '';
  @Input() showTipo: boolean = false;
  @Input() isEdit: boolean = false;
  constructor(private modalCtrl: ModalController) {}
  cancel(){ this.modalCtrl.dismiss(null); }
  remove(){ this.modalCtrl.dismiss({ remove: true }); }
  save(){
    if(!this.desc || this.monto==null || this.monto==='') return;
    this.modalCtrl.dismiss({ fecha:this.fecha, desc:this.desc.trim(), monto:Number(this.monto), mensualidad:Number(this.mensualidad)||1, pagadas:Number(this.pagadas)||0, tipo:this.tipo });
  }
}

@Component({
  selector: 'app-deudas',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon, FormsModule, CurrencyPipe],
  template: `
  <ion-header><ion-toolbar><ion-title>Cuentas por Pagar</ion-title></ion-toolbar></ion-header>
  <ion-content class="bg">
    <div class="container">

      <!-- Deudas generales -->
      <div class="card">
        <div class="head">
          <span class="lbl">Deudas generales</span>
          <span class="money">{{ deudaMarinaMensual | currency:'MXN':'symbol':'1.0-0' }} al mes</span>
        </div>
        <div class="list">
          @for (d of deudasActivas; track d.id){
            <div class="li row-click" (click)="editMarina(d)">
              <div class="li-body">
                <span class="li-title">{{ d.nombre }}</span>
                <span class="li-sub">{{ d.fechaInicio }} @if (d.tipo) { · {{ d.tipo }} } · {{ d.pagados }}/{{ d.pagos }} pagos</span>
              </div>
              <div class="li-right">
                <span class="li-amount num">{{ d.saldo | currency:'MXN':'symbol':'1.0-0' }}</span>
                <span class="li-sub num">{{ d.mensualidad | currency:'MXN':'symbol':'1.0-0' }}/mes</span>
              </div>
              <button class="icon-btn" (click)="toMarinaHistorial(d); $event.stopPropagation()" aria-label="Ver historial de pagos de esta deuda">
                <ion-icon name="cash-outline"></ion-icon>
              </button>
            </div>
          }
          @if(deudasActivas.length===0){<div class="empty">Sin deudas registradas</div>}
        </div>
        <div class="totals">
          <div>Deuda mensual <b class="num">{{deudaMarinaMensual | currency:'MXN':'symbol':'1.0-0'}}</b></div>
          <div>Deuda total <b class="num">{{totalLa | currency:'MXN':'symbol':'1.0-0'}}</b></div>
        </div>
        <div class="card-foot">
          <ion-button size="small" fill="clear" (click)="historialMarinaVisible=!historialMarinaVisible">
            {{historialMarinaVisible?'Ocultar historial':'Ver historial de pagos'}}
          </ion-button>
        </div>
        @if(historialMarinaVisible){
        <div class="sublist">
          @for (d of historialMarina; track d.id){
            <div class="li sm">
              <div class="li-body">
                <span class="li-title">{{ d.nombre }}</span>
                <span class="li-sub">{{ d.fechaInicio }}</span>
              </div>
              <span class="li-amount num">{{ d.saldo | currency:'MXN':'symbol':'1.0-0' }}</span>
              <ion-icon name="checkmark-circle" class="ok"></ion-icon>
            </div>
          }
          @if(historialMarina.length===0){<div class="empty">Sin historial</div>}
        </div>
        }
        <div class="add"><ion-button size="small" fill="outline" (click)="openAddMarinaModal()">Agregar deuda</ion-button></div>
      </div>

      <!-- Pagos de tarjeta -->
      <div class="card">
        <div class="head">
          <span class="lbl">Pagos de tarjeta</span>
          <span class="money">{{ deudaMensual | currency:'MXN':'symbol':'1.0-0' }} al mes</span>
        </div>
        <div class="list">
          @for (p of pagosActivos; track p.id){
            <div class="li row-click" (click)="editTC(p)">
              <div class="li-body">
                <span class="li-title">{{ p.desc }}</span>
                <span class="li-sub">{{ p.fechaCompra }} · {{ p.mensualidadPagada }}/{{ p.mensualidad }} pagos</span>
              </div>
              <div class="li-right">
                <span class="li-amount num">{{ p.montoTotal | currency:'MXN':'symbol':'1.0-0' }}</span>
                <span class="li-sub num">{{ p.monto | currency:'MXN':'symbol':'1.0-0' }}</span>
              </div>
              <button class="icon-btn" (click)="toHistorial(p); $event.stopPropagation()" aria-label="Ver historial de pagos de este pago">
                <ion-icon name="cash-outline"></ion-icon>
              </button>
            </div>
          }
          @if(pagosActivos.length===0){<div class="empty">Sin pagos de tarjeta registrados</div>}
        </div>
        <div class="totals">
          <div>Deuda mensual <b class="num">{{deudaMensual | currency:'MXN':'symbol':'1.0-0'}}</b></div>
          <div>Deuda total <b class="num">{{deudaGeneral | currency:'MXN':'symbol':'1.0-0'}}</b></div>
        </div>
        <div class="card-foot">
          <ion-button size="small" fill="clear" (click)="historialVisible=!historialVisible">
            {{historialVisible?'Ocultar historial':'Ver historial de pagos'}}
          </ion-button>
        </div>
        @if(historialVisible){
        <div class="sublist">
          @for (p of pagosPagados; track p.id){
            <div class="li sm">
              <div class="li-body">
                <span class="li-title">{{ p.desc }}</span>
                <span class="li-sub">{{ p.fechaCompra }}</span>
              </div>
              <span class="li-amount num">{{ p.montoTotal | currency:'MXN':'symbol':'1.0-0' }}</span>
              <ion-icon name="checkmark-circle" class="ok"></ion-icon>
            </div>
          }
          @if(pagosPagados.length===0){<div class="empty">Sin historial</div>}
        </div>
        }
        <div class="add"><ion-button size="small" fill="outline" (click)="openAddTCModal()">Agregar pago</ion-button></div>
      </div>

    </div>
  </ion-content>
  `,
  styles: [`
  .bg{--background:#eef2f7}
  .container{padding:var(--sp-3);max-width:900px;margin:0 auto;display:flex;flex-direction:column;gap:var(--sp-3)}
  .card{background:var(--surface);border-radius:var(--radius-lg);box-shadow:var(--shadow);border:1px solid var(--border);overflow:hidden}

  /* Encabezado sin fondo de color: el monto al mes ya da la jerarquia */
  .head{display:flex;justify-content:space-between;align-items:baseline;gap:var(--sp-2);
    padding:var(--sp-3) var(--sp-4);border-bottom:1px solid var(--border-subtle)}

  .list{display:flex;flex-direction:column}
  .sublist{background:var(--surface-sunken);border-top:1px solid var(--border-subtle)}

  /* Antes: grid de 6 columnas con anchos fijos en px. En un telefono de 360px
     eso suma mas del ancho disponible y la tabla se desbordaba con scroll
     horizontal. Ahora cada deuda es una fila con el monto alineado a la derecha. */
  .li{display:flex;align-items:center;gap:var(--sp-3);padding:var(--sp-3) var(--sp-4);
    border-bottom:1px solid var(--border-subtle);text-align:left;width:100%;background:transparent;border-left:none;border-right:none;border-top:none;font-family:inherit}
  .li:last-child{border-bottom:none}
  .li.sm{padding:10px var(--sp-4);background:transparent}
  .li-body{display:flex;flex-direction:column;gap:2px;flex:1;min-width:0}
  .li-title{font-size:14px;color:var(--text-body);overflow-wrap:anywhere}
  .li-sub{font-size:11px;color:var(--text-faint)}
  .li-right{display:flex;flex-direction:column;align-items:flex-end;gap:2px;flex:none}
  .li-amount{font-size:14px;font-weight:700;color:var(--text-strong);white-space:nowrap}
  .row-click{cursor:pointer}
  .row-click:hover{background:var(--surface-sunken)}
  .icon-btn{border:none;background:transparent;color:var(--text-muted);cursor:pointer;
    width:36px;height:36px;border-radius:var(--radius-sm);font-size:18px;flex:none}
  .icon-btn:hover{background:var(--surface-input)}
  .ok{color:var(--positive);font-size:16px;flex:none}

  .totals{display:flex;gap:var(--sp-5);justify-content:flex-end;
    padding:var(--sp-3) var(--sp-4);font-size:12px;color:var(--text-muted);flex-wrap:wrap;
    border-top:1px solid var(--border-subtle)}
  .totals b{color:var(--text-strong);font-size:13px}
  .card-foot{display:flex;justify-content:center;padding:0 var(--sp-2) var(--sp-1)}
  .add{display:flex;justify-content:flex-end;padding:var(--sp-2) var(--sp-3)}
  `]
})
export class DeudasPage {
  deudas = this.budget.getDeudas();
  pagos = this.budget.getPagosTC();
  totalLa = 0;
  deudaGeneral = 3589;
  deudaMensual = 0;
  deudaMarinaMensual = 0;
  pagadoTC = 0;
  historialVisible = false;
  pagosPagados: any[] = [];
  pagosActivos: any[] = [];
  historialMarinaVisible = false;
  deudasActivas: any[] = [];
  historialMarina: any[] = [];
  newDeuda: any = { nombre: '', mensualidad: null, saldo: null };
  constructor(private budget: BudgetService, private modalCtrl: ModalController, private alertCtrl2: AlertController, private toastCtrl: ToastController) {
    addIcons({ checkmarkCircle, cashOutline });
    this.refresh();
    this.budget.deudas$.subscribe(() => this.refresh());
    this.budget.pagosTC$.subscribe(() => this.refresh());
  }
  refresh() {
    this.deudas = this.budget.getDeudas();
    this.pagos = this.budget.getPagosTC();
    this.pagosPagados = this.pagos.filter((p:any)=>p.pagado);
    this.pagosActivos = this.pagos.filter((p:any)=>!p.pagado);
    this.deudasActivas = this.deudas.filter((d:any)=> !(d.pagados>0 && d.pagados>=d.pagos));
    this.historialMarina = this.deudas.filter((d:any)=> d.pagados>0 && d.pagados>=d.pagos);
    this.totalLa = this.deudasActivas.reduce((s, d) => s + d.saldo, 0);
    this.deudaMarinaMensual = this.deudasActivas.reduce((s, d) => s + (Number(d.mensualidad)||0), 0);
    this.deudaMensual = this.pagosActivos.reduce((s, p) => s + p.monto, 0);
    const total = this.pagosActivos.reduce((s, p) => s + p.montoTotal, 0);
    this.deudaGeneral = total;
    this.pagadoTC = this.pagos.filter(p => p.pagado).reduce((s, p) => s + p.montoTotal, 0);
  }
  toggleTC(id: string) { this.budget.togglePagoTC(id); }
  async toHistorial(p: any){
    if(p.pagado) return;
    const alert = await this.alertCtrl2.create({
      header: 'Terminar pago',
      message: `¿Realmente deseas terminar "${p.desc}" y enviarlo al historial?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Terminar', handler: async () => {
            this.budget.updatePagoTC(p.id, { pagado: true, mensualidadPagada: p.mensualidad });
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
  async openAddTCModal() {
    const modal = await this.modalCtrl.create({ component: TcModalComponent, componentProps: { isEdit: false }, breakpoints: [0,0.7], initialBreakpoint: 0.7, handle: true, cssClass: 'tc-70' });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data && data.desc) {
      this.budget.addPagoTC({ fechaCompra: data.fecha || new Date().toISOString().slice(0,10), desc: data.desc, monto: data.monto, mensualidad: data.mensualidad, mensualidadPagada: 0, montoTotal: data.monto * data.mensualidad, pagado: false });
      this.refresh();
    }
  }
  async editTC(p: any) {
    const modal = await this.modalCtrl.create({ component: TcModalComponent, componentProps: { fecha: p.fechaCompra, desc: p.desc, monto: p.monto, mensualidad: p.mensualidad, pagadas: p.mensualidadPagada, isEdit: true }, breakpoints: [0,0.7], initialBreakpoint: 0.7, handle: true, cssClass: 'tc-70' });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.remove) { this.budget.removePagoTC(p.id); this.refresh(); return; }
    if (data && data.desc) {
      this.budget.updatePagoTC(p.id, { fechaCompra: data.fecha, desc: data.desc, monto: data.monto, mensualidad: data.mensualidad, mensualidadPagada: data.pagadas, montoTotal: data.monto * data.mensualidad });
      this.refresh();
    }
  }
  async openAddMarinaModal() {
    const modal = await this.modalCtrl.create({ component: TcModalComponent, componentProps: { isEdit: false, showTipo: true, tipo: '' }, breakpoints: [0,0.7], initialBreakpoint: 0.7, handle: true, cssClass: 'tc-70' });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data && data.desc) {
      this.budget.addDeuda({ nombre: data.desc, fechaInicio: data.fecha || new Date().toISOString().slice(0,10), fechaFin: '', pagado: 0, saldo: data.monto * data.mensualidad, mensualidad: data.monto, desc: data.desc, pagos: data.mensualidad, pagados: 0, estatus: 'Pendiente', tipo: data.tipo || '' });
      this.refresh();
    }
  }
  async editMarina(d: any) {
    const modal = await this.modalCtrl.create({ component: TcModalComponent, componentProps: { fecha: d.fechaInicio, desc: d.nombre, monto: d.mensualidad, mensualidad: d.pagos||1, pagadas: d.pagados||0, tipo: d.tipo||'', showTipo: true, isEdit: true }, breakpoints: [0,0.7], initialBreakpoint: 0.7, handle: true, cssClass: 'tc-70' });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.remove) { this.budget.removeDeuda(d.id); this.refresh(); return; }
    if (data && data.desc) {
      this.budget.updateDeuda(d.id, { nombre: data.desc, fechaInicio: data.fecha, mensualidad: data.monto, pagos: data.mensualidad, pagados: data.pagadas, saldo: data.monto * data.mensualidad, desc: data.desc, tipo: data.tipo });
      this.refresh();
    }
  }
  async toMarinaHistorial(d: any){
    if(d.pagados>0 && d.pagados>=d.pagos) return;
    const alert = await this.alertCtrl2.create({
      header: 'Terminar pago',
      message: `¿Realmente deseas terminar "${d.nombre}" y enviarlo al historial?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Terminar', handler: async () => {
            this.budget.updateDeuda(d.id, { pagados: d.pagos });
            this.refresh();
            this.historialMarinaVisible = true;
            const toast = await this.toastCtrl.create({ message: 'Se agregó correctamente a historial de pagos', duration: 2000, color: 'success', position: 'bottom' });
            await toast.present();
          }
        }
      ]
    });
    await alert.present();
  }
  addDeuda() {
    if (!this.newDeuda.nombre) return;
    this.budget.addDeuda({ nombre: this.newDeuda.nombre, fechaInicio: new Date().toISOString().slice(0, 10), fechaFin: '', pagado: 0, saldo: Number(this.newDeuda.saldo) || 0, mensualidad: Number(this.newDeuda.mensualidad) || 0, desc: '', pagos: 0, pagados: 0, estatus: 'Pendiente' });
    this.newDeuda = { nombre: '', mensualidad: null, saldo: null };
  }
}
