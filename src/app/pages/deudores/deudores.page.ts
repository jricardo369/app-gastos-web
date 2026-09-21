import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonInput, IonItem, IonIcon, ModalController, AlertController, ToastController, IonButtons } from '@ionic/angular';
import { CurrencyPipe } from '@angular/common';
import { BudgetService } from '../../core/services/budget.service';
import { addIcons } from 'ionicons';
import { cashOutline, checkmarkCircle, eyeOutline, eyeOffOutline } from 'ionicons/icons';

@Component({
  selector: 'app-deudor-simple-modal',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonInput, IonButton, IonButtons, FormsModule],
  template: `
  <ion-header><ion-toolbar><ion-title>{{isEdit?'Editar':'Nuevo'}} deudor</ion-title><ion-buttons slot="end"><ion-button (click)="cancel()">Cerrar</ion-button></ion-buttons></ion-toolbar></ion-header>
  <ion-content class="ion-padding">
    <ion-item><ion-input label="Fecha alta" labelPlacement="stacked" type="date" [(ngModel)]="fecha" [disabled]="true"></ion-input></ion-item>
    <ion-item><ion-input label="Fecha vencimiento" labelPlacement="stacked" type="date" [(ngModel)]="fechaVenc"></ion-input></ion-item>
    <ion-item><ion-input label="Descripción" labelPlacement="stacked" [(ngModel)]="desc"></ion-input></ion-item>
    <ion-item><ion-input label="Monto ($)" labelPlacement="stacked" type="number" [(ngModel)]="monto"></ion-input></ion-item>
    <div style="display:flex;gap:8px;margin-top:20px">
      @if(isEdit){ <ion-button color="danger" fill="outline" (click)="remove()" style="flex:1">Eliminar</ion-button> }
      <ion-button (click)="save()" style="flex:1">{{isEdit?'Guardar':'Agregar'}}</ion-button>
    </div>
  </ion-content>
  `,
})
export class DeudorSimpleModal {
  @Input() fecha: string = new Date().toISOString().slice(0,10);
  @Input() fechaVenc: string = '';
  @Input() desc: string = '';
  @Input() monto: any = null;
  @Input() isEdit: boolean = false;
  constructor(private modalCtrl: ModalController) {}
  cancel(){ this.modalCtrl.dismiss(null); }
  remove(){ this.modalCtrl.dismiss({ remove: true }); }
  save(){ if(!this.desc || this.monto==null || this.monto==='') return; this.modalCtrl.dismiss({ fecha:this.fecha, fechaVenc:this.fechaVenc, desc:this.desc.trim(), monto:Number(this.monto)}); }
}

@Component({
  selector: 'app-deudores',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon, FormsModule, CurrencyPipe],
  template: `
  <ion-header><ion-toolbar><ion-title>Deudores</ion-title></ion-toolbar></ion-header>
  <ion-content class="bg">
    <div class="container">
      <div class="card">
        <div class="head" style="background:#7b1fa2">DEUDORES <span>{{total | currency:'MXN':'symbol':'1.0-0'}}</span></div>
        <div class="add" style="justify-content:flex-end">
          <ion-button size="small" (click)="openAdd()">+ Agregar deudor</ion-button>
        </div>
        <div class="tbl2 head" style="grid-template-columns:90px 90px 1fr 90px"><span>FECHA ALTA</span><span>FECHA VENC</span><span>DESC</span><span>MONTO</span></div>
        @for (d of activos; track d.id){
          <div class="tbl2 row-click" (click)="edit(d)" style="grid-template-columns:90px 90px 1fr 90px">
            <span>{{d.fechaInicio}}</span><span>{{d.fechaFin || '-'}}</span><span>{{d.nombre}}</span><span style="display:flex;align-items:center;gap:6px">{{d.saldo | currency:'MXN':'symbol':'1.0-0'}} <ion-icon name="cash-outline" (click)="toHistorial(d); $event.stopPropagation()" style="cursor:pointer;color:#0f3a5d;font-size:16px"></ion-icon></span>
          </div>
        }
        @if(activos.length===0){<div class="empty">Sin deudores</div>}
        <div class="totals">
          <div>Total <b>{{total | currency:'MXN':'symbol':'1.0-0'}}</b></div>
        </div>
        <div style="text-align:center">
          <ion-button fill="clear" (click)="historialVisible=!historialVisible" style="--background:transparent;--box-shadow:none;color:#0fb27a;font-size:12px">
            <ion-icon [name]="historialVisible?'eye-off-outline':'eye-outline'" slot="start"></ion-icon>
            {{historialVisible?'Ocultar historial':'Ver historial de pagos'}}
          </ion-button>
        </div>
        @if(historialVisible){
        <div class="card" style="margin:0 8px 8px 8px">
          <div class="head" style="background:#4a148c">HISTORIAL DE PAGOS</div>
          <div class="tbl2 head" style="grid-template-columns:90px 90px 1fr 90px"><span>FECHA ALTA</span><span>FECHA VENC</span><span>DESC</span><span>MONTO</span></div>
          @for (d of historial; track d.id){
            <div class="tbl2" style="grid-template-columns:90px 90px 1fr 90px">
              <span>{{d.fechaInicio}}</span><span>{{d.fechaFin || '-'}}</span><span>{{d.nombre}}</span><span style="display:flex;align-items:center;gap:4px">{{d.saldo | currency:'MXN':'symbol':'1.0-0'}} <ion-icon name="checkmark-circle" style="color:#0fb27a;font-size:14px"></ion-icon></span>
            </div>
          }
          @if(historial.length===0){<div class="empty">Sin historial</div>}
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
  .add{display:flex;gap:6px;padding:8px;flex-wrap:wrap;align-items:center}
  .tbl2{display:grid;gap:6px;padding:8px;font-size:11px;border-bottom:1px solid #f0f2f7;align-items:center}
  .tbl2.head{font-weight:700;color:#0f3a5d;background:#f3e0ff}
  .row-click{cursor:pointer}
  .row-click:hover{background:#f8fafc}
  .empty{text-align:center;color:#9aa8c0;padding:20px}
  .totals{display:flex;gap:16px;justify-content:flex-end;padding:10px;font-size:12px;flex-wrap:wrap}
  .totals b{color:#0f3a5d}
  `]
})
export class DeudoresPage {
  lista: any[] = [];
  activos: any[] = [];
  historial: any[] = [];
  total = 0;
  historialVisible = false;
  constructor(private budget: BudgetService, private modalCtrl: ModalController, private alertCtrl: AlertController, private toastCtrl: ToastController){
    addIcons({ cashOutline, checkmarkCircle, eyeOutline, eyeOffOutline });
    this.refresh();
    this.budget.deudoresLista$.subscribe(()=>this.refresh());
  }
  refresh(){
    this.lista = this.budget.getDeudoresLista();
    this.activos = this.lista.filter((d:any)=> !(d.pagados>0 && d.pagados>=d.pagos));
    this.historial = this.lista.filter((d:any)=> d.pagados>0 && d.pagados>=d.pagos);
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
