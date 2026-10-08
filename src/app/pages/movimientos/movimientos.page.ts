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

      <!-- Configuracion: solo 3 datos, no necesita ser una tarjeta prominente -->
      <div class="card config-card">
        <div class="cfg">
          <span>Corte día <b>{{cfg.fechaCorte}}</b></span>
          <span>Pago día <b>{{cfg.fechaPago}}</b></span>
          <span>PPNGI <b class="num">{{cfg.ppngi | currency:'MXN':'symbol':'1.0-0'}}</b></span>
          <button class="cfg-edit" (click)="editConfig()">Editar</button>
        </div>
      </div>

      <div class="card">
        <div class="head">
          <span class="lbl">Movimientos</span>
          <ion-button size="small" fill="outline" (click)="openAdd()">Agregar</ion-button>
        </div>
        <div class="list">
          @for (r of rows; track r.id){
            <div class="li row-click" (click)="edit(r.orig)">
              <div class="li-body">
                <span class="li-title">{{ r.descripcion }}</span>
                <span class="li-sub">{{ r.fecha }}</span>
              </div>
              <div class="li-moves">
                @if (r.compras) { <span class="move out num">−{{ r.compras | currency:'MXN':'symbol':'1.0-0' }}</span> }
                @if (r.abonos) { <span class="move in num">+{{ r.abonos | currency:'MXN':'symbol':'1.0-0' }}</span> }
              </div>
              <span class="li-saldo num">{{ r.saldo | currency:'MXN':'symbol':'1.0-0' }}</span>
            </div>
          }
          @if(rows.length===0){<div class="empty">Sin movimientos</div>}
        </div>
      </div>
    </div>
  </ion-content>
  `,
  styles: [`
  .bg{--background:#eef2f7}
  .container{padding:var(--sp-3);max-width:900px;margin:0 auto;display:flex;flex-direction:column;gap:var(--sp-3)}
  .card{background:var(--surface);border-radius:var(--radius-lg);box-shadow:var(--shadow);border:1px solid var(--border);overflow:hidden}

  .config-card{padding:var(--sp-3)}
  .cfg{display:flex;gap:var(--sp-4);align-items:center;flex-wrap:wrap;font-size:12px;color:var(--text-muted)}
  .cfg b{color:var(--text-strong)}
  .cfg-edit{border:none;background:transparent;cursor:pointer;font-family:inherit;
    font-size:12px;font-weight:700;color:var(--accent);text-decoration:underline;padding:4px}

  .head{display:flex;justify-content:space-between;align-items:center;gap:var(--sp-2);
    padding:var(--sp-3) var(--sp-4);border-bottom:1px solid var(--border-subtle)}
  .list{display:flex;flex-direction:column}

  /* Compras y abonos van apilados con signo explicito (+ / −) en vez de
     dos columnas mas un saldo. En mobile se lee mejor y no hay que
     recordar que columna era cada una. */
  .li{display:flex;align-items:center;gap:var(--sp-3);padding:var(--sp-3) var(--sp-4);
    border-bottom:1px solid var(--border-subtle);text-align:left;width:100%;
    background:transparent;border-left:none;border-right:none;border-top:none;font-family:inherit}
  .li:last-child{border-bottom:none}
  .li-body{display:flex;flex-direction:column;gap:2px;flex:1;min-width:0}
  .li-title{font-size:14px;color:var(--text-body);overflow-wrap:anywhere}
  .li-sub{font-size:11px;color:var(--text-faint)}
  .li-moves{display:flex;flex-direction:column;align-items:flex-end;gap:2px;flex:none}
  .move{font-size:12px;white-space:nowrap}
  .move.in{color:var(--ok)}
  .move.out{color:var(--bad)}
  .li-saldo{font-size:14px;font-weight:700;color:var(--text-strong);white-space:nowrap;
    min-width:88px;text-align:right;flex:none}
  .row-click{cursor:pointer}
  .row-click:hover{background:var(--surface-sunken)}
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
