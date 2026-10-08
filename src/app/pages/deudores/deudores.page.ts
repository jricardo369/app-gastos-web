import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonInput, IonItem, IonIcon, ModalController, AlertController, ToastController, IonButtons } from '@ionic/angular';
import { CurrencyPipe } from '@angular/common';
import { BudgetService } from '../../core/services/budget.service';
import { addIcons } from 'ionicons';
import { cashOutline, checkmarkCircle } from 'ionicons/icons';

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
  <ion-header><ion-toolbar><ion-title>Me deben</ion-title></ion-toolbar></ion-header>
  <ion-content class="bg">
    <div class="container">

      <!-- Total primero: es la pregunta de esta pantalla -->
      <div class="card head-card">
        <span class="lbl">Total por cobrar</span>
        <b class="money big">{{ total | currency:'MXN':'symbol':'1.0-0' }}</b>
        <span class="lbl">{{ activos.length }} {{ activos.length === 1 ? 'persona' : 'personas' }}</span>
      </div>

      <div class="card">
        <div class="head">
          <span class="lbl">Pendientes</span>
          <ion-button size="small" fill="outline" (click)="openAdd()">Agregar</ion-button>
        </div>
        <div class="list">
          @for (d of activos; track d.id){
            <div class="li row-click" (click)="edit(d)">
              <div class="li-body">
                <span class="li-title">{{ d.nombre }}</span>
                <span class="li-sub">Alta {{ d.fechaInicio }} @if (d.fechaFin) { · vence {{ d.fechaFin }} }</span>
              </div>
              <span class="li-amount num">{{ d.saldo | currency:'MXN':'symbol':'1.0-0' }}</span>
              <button class="icon-btn" (click)="toHistorial(d); $event.stopPropagation()" [attr.aria-label]="'Ver historial de pagos de ' + d.nombre">
                <ion-icon name="cash-outline"></ion-icon>
              </button>
            </div>
          }
          @if(activos.length===0){<div class="empty">Nadie te debe nada. Agregá un deudor cuando prestes.</div>}
        </div>
        <div class="card-foot">
          <ion-button size="small" fill="clear" (click)="historialVisible=!historialVisible">
            {{historialVisible?'Ocultar historial':'Ver historial de pagos'}}
          </ion-button>
        </div>
        @if(historialVisible){
        <div class="sublist">
          @for (d of historial; track d.id){
            <div class="li sm">
              <div class="li-body">
                <span class="li-title">{{ d.nombre }}</span>
                <span class="li-sub">{{ d.fechaInicio }}</span>
              </div>
              <span class="li-amount num">{{ d.saldo | currency:'MXN':'symbol':'1.0-0' }}</span>
              <ion-icon name="checkmark-circle" class="ok"></ion-icon>
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
  .container{padding:var(--sp-3);max-width:900px;margin:0 auto;display:flex;flex-direction:column;gap:var(--sp-3)}
  .card{background:var(--surface);border-radius:var(--radius-lg);box-shadow:var(--shadow);border:1px solid var(--border);overflow:hidden}

  /* El total no es un encabezado de color: es la cifra de la pantalla */
  .head-card{display:flex;flex-direction:column;gap:2px;padding:var(--sp-4)}
  .money.big{font-size:28px;letter-spacing:-.02em}

  .head{display:flex;justify-content:space-between;align-items:center;gap:var(--sp-2);
    padding:var(--sp-3) var(--sp-4);border-bottom:1px solid var(--border-subtle)}
  .list{display:flex;flex-direction:column}
  .sublist{background:var(--surface-sunken);border-top:1px solid var(--border-subtle)}

  .li{display:flex;align-items:center;gap:var(--sp-3);padding:var(--sp-3) var(--sp-4);
    border-bottom:1px solid var(--border-subtle);text-align:left;width:100%;
    background:transparent;border-left:none;border-right:none;border-top:none;font-family:inherit}
  .li:last-child{border-bottom:none}
  .li.sm{padding:10px var(--sp-4)}
  .li-body{display:flex;flex-direction:column;gap:2px;flex:1;min-width:0}
  .li-title{font-size:14px;color:var(--text-body);overflow-wrap:anywhere}
  .li-sub{font-size:11px;color:var(--text-faint)}
  .li-amount{font-size:14px;font-weight:700;color:var(--text-strong);white-space:nowrap}
  .row-click{cursor:pointer}
  .row-click:hover{background:var(--surface-sunken)}
  .icon-btn{border:none;background:transparent;color:var(--text-muted);cursor:pointer;
    width:36px;height:36px;border-radius:var(--radius-sm);font-size:18px;flex:none}
  .icon-btn:hover{background:var(--surface-input)}
  .ok{color:var(--positive);font-size:16px;flex:none}
  .card-foot{display:flex;justify-content:center;padding:0 var(--sp-2) var(--sp-1)}
  `]
})
export class DeudoresPage {
  lista: any[] = [];
  activos: any[] = [];
  historial: any[] = [];
  total = 0;
  historialVisible = false;
  constructor(private budget: BudgetService, private modalCtrl: ModalController, private alertCtrl: AlertController, private toastCtrl: ToastController){
    addIcons({ cashOutline, checkmarkCircle });
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
