import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonInput, IonItem, IonButtons, IonIcon, ModalController, AlertController, ToastController } from '@ionic/angular';
import { CurrencyPipe } from '@angular/common';
import { BudgetService } from '../../core/services/budget.service';
import { addIcons } from 'ionicons';
import { checkmarkCircle, eyeOutline, eyeOffOutline, cashOutline } from 'ionicons/icons';

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
      <div class="card">
        <div class="head la">DEUDAS GENERALES <span>{{deudaMarinaMensual | currency:'MXN':'symbol':'1.0-0'}}</span></div>
        <div class="add" style="justify-content:flex-end">
          <ion-button size="small" (click)="openAddMarinaModal()">+ Agregar pago</ion-button>
        </div>
        <div class="tbl2 head" style="grid-template-columns:90px 80px 1fr 80px 60px 90px"><span>FECHA</span><span>TIPO</span><span>DESC</span><span>MONTO</span><span>MENS</span><span>TOTAL</span></div>
        @for (d of deudasActivas; track d.id){
          <div class="tbl2 row-click" (click)="editMarina(d)" style="grid-template-columns:90px 80px 1fr 80px 60px 90px">
            <span>{{d.fechaInicio}}</span><span>{{d.tipo || '-'}}</span><span>{{d.nombre}}</span><span>{{d.mensualidad | currency:'MXN':'symbol':'1.0-0'}}</span><span>{{d.pagados}}:{{d.pagos}}</span><span style="display:flex;align-items:center;gap:6px">{{d.saldo | currency:'MXN':'symbol':'1.0-0'}} <ion-icon name="cash-outline" (click)="toMarinaHistorial(d); $event.stopPropagation()" style="cursor:pointer;color:#0f3a5d;font-size:16px"></ion-icon></span>
          </div>
        }
        @if(deudasActivas.length===0){<div class="empty">Sin deudas registradas</div>}
        <div class="totals">
          <div>Deuda mensual <b>{{deudaMarinaMensual | currency:'MXN':'symbol':'1.0-0'}}</b></div>
          <div>Deuda total <b>{{totalLa | currency:'MXN':'symbol':'1.0-0'}}</b></div>
        </div>
        <div style="text-align:center">
          <ion-button fill="clear" (click)="historialMarinaVisible=!historialMarinaVisible" style="--background:transparent;--box-shadow:none;color:#0fb27a;font-size:12px">
            <ion-icon [name]="historialMarinaVisible?'eye-off-outline':'eye-outline'" slot="start"></ion-icon>
            {{historialMarinaVisible?'Ocultar historial':'Ver historial de pagos'}}
          </ion-button>
        </div>
        @if(historialMarinaVisible){
        <div class="card" style="margin:0 8px 8px 8px">
          <div class="head" style="background:#0b7a3e">HISTORIAL DE PAGOS</div>
          <div class="tbl2 head" style="grid-template-columns:90px 80px 1fr 80px 60px 90px"><span>FECHA</span><span>TIPO</span><span>DESC</span><span>MONTO</span><span>MENS</span><span>TOTAL</span></div>
          @for (d of historialMarina; track d.id){
            <div class="tbl2" style="grid-template-columns:90px 80px 1fr 80px 60px 90px">
              <span>{{d.fechaInicio}}</span><span>{{d.tipo || '-'}}</span><span>{{d.nombre}}</span><span>{{d.mensualidad | currency:'MXN':'symbol':'1.0-0'}}</span><span>{{d.pagados}}:{{d.pagos}}</span><span style="display:flex;align-items:center;gap:4px">{{d.saldo | currency:'MXN':'symbol':'1.0-0'}} <ion-icon name="checkmark-circle" style="color:#0fb27a;font-size:14px"></ion-icon></span>
            </div>
          }
          @if(historialMarina.length===0){<div class="empty">Sin historial</div>}
        </div>
        }
      </div>

      <div class="card">
        <div class="head blue">PAGOS TARJETA DE CREDITO RECURRENTES</div>
        <div class="add" style="justify-content:flex-end">
          <ion-button size="small" (click)="openAddTCModal()">+ Agregar pago</ion-button>
        </div>
        <div class="tbl2 head"><span>FECHA</span><span>DESC</span><span>MONTO</span><span>MENS</span><span>TOTAL</span></div>
        @for (p of pagosActivos; track p.id){
          <div class="tbl2 row-click" (click)="editTC(p)">
            <span>{{p.fechaCompra}}</span><span>{{p.desc}}</span><span>{{p.monto | currency:'MXN':'symbol':'1.0-0'}}</span><span>{{p.mensualidadPagada}}:{{p.mensualidad}}</span><span style="display:flex;align-items:center;gap:6px">{{p.montoTotal | currency:'MXN':'symbol':'1.0-0'}} <ion-icon name="cash-outline" (click)="toHistorial(p); $event.stopPropagation()" style="cursor:pointer;color:#0f3a5d;font-size:16px"></ion-icon></span>
          </div>
        }
        <div class="totals">
          <div>Deuda mensual <b>{{deudaMensual | currency:'MXN':'symbol':'1.0-0'}}</b></div>
          <div>Deuda total <b>{{deudaGeneral | currency:'MXN':'symbol':'1.0-0'}}</b></div>
        </div>
        <div style="text-align:center">
          <ion-button fill="clear" (click)="historialVisible=!historialVisible" style="--background:transparent;--box-shadow:none;color:#0fb27a;font-size:12px">
            <ion-icon [name]="historialVisible?'eye-off-outline':'eye-outline'" slot="start"></ion-icon>
            {{historialVisible?'Ocultar historial':'Ver historial de pagos'}}
          </ion-button>
        </div>
        @if(historialVisible){
        <div class="card" style="margin:0 8px 8px 8px">
          <div class="head" style="background:#0f3a5d">HISTORIAL DE PAGOS</div>
          <div class="tbl2 head"><span>FECHA</span><span>DESC</span><span>MONTO</span><span>MENS</span><span>TOTAL</span></div>
          @for (p of pagosPagados; track p.id){
            <div class="tbl2">
              <span>{{p.fechaCompra}}</span><span>{{p.desc}}</span><span>{{p.monto | currency:'MXN':'symbol':'1.0-0'}}</span><span>{{p.mensualidadPagada}}:{{p.mensualidad}}</span><span style="display:flex;align-items:center;gap:4px">{{p.montoTotal | currency:'MXN':'symbol':'1.0-0'}} <ion-icon name="checkmark-circle" style="color:#0fb27a;font-size:14px"></ion-icon></span>
            </div>
          }
          @if(pagosPagados.length===0){<div class="empty">Sin historial</div>}
        </div>
        }
      </div>


    </div>
  </ion-content>
  `,
  styles: [`
  .bg{--background:#eef2f7}
  .container{padding:10px;max-width:1000px;margin:0 auto}
  .card{background:#fff;border-radius:16px;box-shadow:0 6px 20px rgba(0,0,0,.06);overflow:hidden;margin-bottom:12px;padding-bottom:8px}
  .head{padding:10px 14px;font-weight:800;color:#fff;display:flex;justify-content:space-between}
  .head.la{background:#0b7a3e}
  .head.blue{background:#2a6cb6}
  .add{display:flex;gap:6px;padding:8px;flex-wrap:wrap;align-items:center}
  .inp{--background:#f4f6f9;border-radius:8px;--padding-start:8px}
  .inp.sm{max-width:130px}
  .tbl{display:grid;grid-template-columns:1fr 90px 90px 80px 80px 70px 90px;gap:6px;padding:8px;font-size:11px;align-items:center;border-bottom:1px solid #f0f2f7}
  .tbl.head{font-weight:700;color:#0f3a5d;background:#e8f5e9}
  .tbl2{display:grid;grid-template-columns:90px 1fr 80px 60px 90px;gap:6px;padding:8px;font-size:11px;border-bottom:1px solid #f0f2f7;align-items:center}
  .tbl2.head{font-weight:700;color:#0f3a5d;background:#eaf2ff}
  .tbl2.paid{opacity:.5;text-decoration:line-through}
  .row-click{cursor:pointer}
  .row-click:hover{background:#f8fafc}
  .chip{background:#eef2f7;border-radius:999px;padding:2px 6px;font-size:10px}
  .empty{text-align:center;color:#9aa8c0;padding:20px}
  .totals{display:flex;gap:16px;justify-content:flex-end;padding:10px;font-size:12px;flex-wrap:wrap}
  .totals b{color:#0f3a5d}
  .pagado{color:#2a6cb6}
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
    addIcons({ checkmarkCircle, eyeOutline, eyeOffOutline, cashOutline });
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
