import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonInput, IonItem, IonButtons, IonSelect, IonSelectOption, ModalController, AlertController, ToastController } from '@ionic/angular';
import { CurrencyPipe } from '@angular/common';
import { BudgetService } from '../../core/services/budget.service';
import { addIcons } from 'ionicons';
import { addOutline, cashOutline, eyeOutline } from 'ionicons/icons';

@Component({
  selector: 'app-mov-modal',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonInput, IonSelect, IonSelectOption, IonButton, IonButtons, FormsModule],
  template: `
  <ion-header><ion-toolbar><ion-title>{{isEdit?'Editar':'Nuevo'}} movimiento</ion-title><ion-buttons slot="end"><ion-button (click)="cancel()">Cerrar</ion-button></ion-buttons></ion-toolbar></ion-header>
  <ion-content class="ion-padding">
    <ion-item><ion-input label="Fecha" labelPlacement="stacked" type="date" [(ngModel)]="fecha"></ion-input></ion-item>
    <ion-item><ion-input label="Descripción" labelPlacement="stacked" [(ngModel)]="descripcion"></ion-input></ion-item>
    <ion-item><ion-select label="Tipo" labelPlacement="stacked" [(ngModel)]="tipo"><ion-select-option value="compras">Compras</ion-select-option><ion-select-option value="abono">Abono</ion-select-option></ion-select></ion-item>
    <ion-item><ion-input label="Monto ($)" labelPlacement="stacked" type="number" [(ngModel)]="monto"></ion-input></ion-item>
    <div style="display:flex;gap:8px;margin-top:20px">
      @if(isEdit){ <ion-button color="danger" fill="outline" (click)="remove()" style="flex:1">Eliminar</ion-button> }
      <ion-button (click)="save()" style="flex:1">{{isEdit?'Guardar':'Agregar'}}</ion-button>
    </div>
  </ion-content>
  `,
})
export class MovModalComponent {
  @Input() fecha: string = new Date().toISOString().slice(0,10);
  @Input() descripcion: string = '';
  @Input() tipo: string = 'compras';
  @Input() monto: any = 0;
  @Input() isEdit: boolean = false;
  constructor(private modalCtrl: ModalController) {}
  cancel(){ this.modalCtrl.dismiss(null); }
  remove(){ this.modalCtrl.dismiss({ remove: true }); }
  save(){
    if(!this.descripcion || this.monto==null || this.monto==='') return;
    const compras = this.tipo==='compras' ? Number(this.monto)||0 : 0;
    const abonos = this.tipo==='abono' ? Number(this.monto)||0 : 0;
    this.modalCtrl.dismiss({ fecha:this.fecha, descripcion:this.descripcion.trim(), compras, abonos });
  }
}

@Component({
  selector: 'app-movimientos',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton, FormsModule, CurrencyPipe],
  template: `
  <ion-header><ion-toolbar><ion-title>Movimientos TC</ion-title></ion-toolbar></ion-header>
  <ion-content class="bg">
    <div class="container">
      <div class="card config-card">
        <div class="cfg"><span>Fecha corte cada día <b>{{cfg.fechaCorte}}</b></span><span>Fecha pago cada día <b>{{cfg.fechaPago}}</b></span><span>PPNGI: <b>{{cfg.ppngi | currency:'MXN':'symbol':'1.0-0'}}</b></span><span class="cfg-edit" (click)="editConfig()">Editar configuración</span></div>
      </div>

      <div class="card">
        <div class="head" style="background:#0f3a5d">MOVIMIENTOS <ion-button size="small" (click)="openAdd()" style="--background:#fff;--color:#0f3a5d">+ Agregar</ion-button></div>
        <div class="tbl head" style="grid-template-columns:90px 1fr 90px 90px 90px"><span style="text-align:left">Fecha</span><span style="text-align:left">Descripcion</span><span style="text-align:right">Compras</span><span style="text-align:right">Abonos</span><span style="text-align:right">Saldos</span></div>
        @for (r of rows; track r.id){
          <div class="tbl row-click" (click)="edit(r.orig)" style="grid-template-columns:90px 1fr 90px 90px 90px">
            <span>{{r.fecha}}</span><span>{{r.descripcion}}</span><span style="text-align:right">{{r.compras ? (r.compras | currency:'MXN':'symbol':'1.0-0') : ''}}</span><span style="text-align:right;color:#0fb27a">{{r.abonos ? (r.abonos | currency:'MXN':'symbol':'1.0-0') : ''}}</span><span style="text-align:right;font-weight:700">{{r.saldo | currency:'MXN':'symbol':'1.0-0'}}</span>
          </div>
        }
        @if(rows.length===0){<div class="empty">Sin movimientos</div>}
      </div>
    </div>
  </ion-content>
  `,
  styles: [`
  .bg{--background:#eef2f7}
  .container{padding:10px;max-width:1100px;margin:0 auto}
  .card{background:#fff;border-radius:16px;box-shadow:0 6px 20px rgba(0,0,0,.06);overflow:hidden;margin-bottom:12px}
  .config-card{padding:10px}
  .cfg-edit{cursor:pointer;color:#0f3a5d;text-decoration:underline;font-size:11px}
  .cfg-edit:hover{color:#c0392b}
  .cfg{display:flex;gap:16px;align-items:center;flex-wrap:wrap;font-size:12px;color:#0f3a5d}
  .cfg b{color:#c0392b}
  .head{padding:10px 14px;font-weight:800;color:#fff;display:flex;justify-content:space-between;align-items:center}
  .tbl{display:grid;gap:6px;padding:8px;font-size:11px;border-bottom:1px solid #f0f2f7;align-items:center}
  .tbl.head{font-weight:700;color:#0f3a5d;background:#eaf2ff}
  .row-click{cursor:pointer}
  .row-click:hover{background:#f8fafc}
  .edit-icon{font-size:16px;background:rgba(15,58,93,.1);border-radius:6px;padding:4px;color:#0f3a5d}
  .empty{text-align:center;color:#9aa8c0;padding:20px}
  @media(max-width:768px){.tbl,.tbl.head{grid-template-columns:80px 1fr 75px 75px 75px !important;gap:2px;font-size:10px}}
  @media(min-width:769px) and (max-width:1024px){.tbl,.tbl.head{font-size:11px}}
  `]
})
export class MovimientosPage {
  cfg = this.budget.getMovConfig();
  movimientos: any[] = [];
  rows: any[] = [];
  constructor(private budget: BudgetService, private modalCtrl: ModalController, private alertCtrl: AlertController, private toastCtrl: ToastController){
    addIcons({ addOutline, cashOutline, eyeOutline });
    this.refresh();
    this.budget.movimientos$.subscribe(()=>this.refresh());
    this.budget.movConfig$.subscribe(c=>this.cfg=c);
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
