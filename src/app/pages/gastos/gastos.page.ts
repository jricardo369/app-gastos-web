import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonSegment, IonSegmentButton, IonLabel, IonIcon, IonButton, IonItem, IonInput, IonSelect, IonSelectOption, ModalController, IonButtons } from '@ionic/angular';
import { CurrencyPipe } from '@angular/common';
import { BudgetService } from '../../core/services/budget.service';
import { Gasto, Imprevisto, Quincena } from '../../core/models/budget.model';
import { addIcons } from 'ionicons';
import { chevronDownOutline, chevronUpOutline } from 'ionicons/icons';

@Component({
  selector: 'app-gasto-modal',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonInput, IonSelect, IonSelectOption, IonButton, IonButtons, FormsModule],
  template: `
  <ion-header><ion-toolbar><ion-title>Nuevo gasto</ion-title><ion-buttons slot="end"><ion-button (click)="cancel()">Cerrar</ion-button></ion-buttons></ion-toolbar></ion-header>
  <ion-content class="ion-padding">
    <ion-item><ion-select label="Categoría" labelPlacement="stacked" [(ngModel)]="categoriaId"><ion-select-option value="hogar">Hogar</ion-select-option><ion-select-option value="escuelas">Escuelas</ion-select-option><ion-select-option value="carro">Carro</ion-select-option><ion-select-option value="ejercicio">Ejercicio</ion-select-option><ion-select-option value="credito">Trj crédito</ion-select-option><ion-select-option value="lamarina">La Marina</ion-select-option><ion-select-option value="adic">Adic.</ion-select-option><ion-select-option value="impv">Impv.</ion-select-option><ion-select-option value="ahorro">Ahorro</ion-select-option><ion-select-option value="ropa">Ropa</ion-select-option></ion-select></ion-item>
    <ion-item><ion-input label="Descripción" labelPlacement="stacked" [(ngModel)]="descripcion" placeholder="Ej. Gasolina"></ion-input></ion-item>
    <ion-item><ion-input label="Previsto ($)" labelPlacement="stacked" type="number" [(ngModel)]="previsto"></ion-input></ion-item>
    <ion-button expand="block" style="margin-top:20px" (click)="save()">Agregar</ion-button>
  </ion-content>
  `,
})
export class GastoModalComponent {
  @Input() categoriaId: string = 'hogar';
  @Input() descripcion: string = '';
  @Input() previsto: any = null;
  constructor(private modalCtrl: ModalController) {}
  cancel(){ this.modalCtrl.dismiss(null); }
  save(){ if(!this.descripcion||this.previsto==null||this.previsto==='') return; this.modalCtrl.dismiss({ categoriaId:this.categoriaId, descripcion:this.descripcion.trim(), previsto:Number(this.previsto)}); }
}

@Component({
  selector: 'app-imprevisto-modal',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonInput, IonButton, IonButtons, FormsModule],
  template: `
  <ion-header><ion-toolbar><ion-title>Nuevo imprevisto</ion-title><ion-buttons slot="end"><ion-button (click)="cancel()">Cerrar</ion-button></ion-buttons></ion-toolbar></ion-header>
  <ion-content class="ion-padding">
    <ion-item><ion-input label="Fecha" labelPlacement="stacked" type="date" [(ngModel)]="fecha"></ion-input></ion-item>
    <ion-item><ion-input label="Importe ($)" labelPlacement="stacked" type="number" [(ngModel)]="importe"></ion-input></ion-item>
    <ion-item><ion-input label="Descripción" labelPlacement="stacked" [(ngModel)]="descripcion" placeholder="Ej. Reparación"></ion-input></ion-item>
    <ion-button expand="block" style="margin-top:20px" (click)="save()">Agregar</ion-button>
  </ion-content>
  `,
})
export class ImprevistoModalComponent {
  @Input() fecha: string = new Date().toISOString().slice(0,10);
  @Input() importe: any = null;
  @Input() descripcion: string = '';
  constructor(private modalCtrl: ModalController) {}
  cancel(){ this.modalCtrl.dismiss(null); }
  save(){ if(!this.descripcion||this.importe==null||this.importe==='') return; this.modalCtrl.dismiss({ fecha:this.fecha, importe:Number(this.importe), descripcion:this.descripcion.trim()}); }
}

@Component({
  selector: 'app-gastos',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonSegment, IonSegmentButton, IonLabel, IonIcon, IonButton, FormsModule, CurrencyPipe],
  template: `
  <ion-header><ion-toolbar><ion-title>Gastos</ion-title></ion-toolbar></ion-header>
  <ion-content class="bg">
    <div class="container">
      <ion-segment [(ngModel)]="tab" class="seg">
        <ion-segment-button value="Q1"><ion-label>Gastos Q1</ion-label></ion-segment-button>
        <ion-segment-button value="Q2"><ion-label>Gastos Q2</ion-label></ion-segment-button>
      </ion-segment>

      <div class="grid" [class.single]="true">
        @for (q of [tab]; track q) {
        <div class="panel">
          <div class="panel-head">
            <span>{{q==='Q1'?'Gastos Q1':'Gastos Q2'}}</span>
            <div style="display:flex;gap:6px;align-items:center">
              <span class="falt">FALTANTE {{faltante(q) | currency:'MXN':'symbol':'1.0-0'}}</span>
              <span class="pag">PAGADO {{reales(q) | currency:'MXN':'symbol':'1.0-0'}}</span>
            </div>
          </div>
          <div class="subhead">
            <div class="add-row" style="justify-content:flex-end">
              <ion-button size="small" (click)="openAddGastoModal(q)">+ Agregar gasto</ion-button>
            </div>
          </div>

          <div class="table">
            <div class="th"><span>Tipo</span><span>Descripción</span><span>Previsto</span><span>Pagado</span></div>
            @for (g of gastos(q); track g.id) {
              <div class="tr" [class.paid]="g.pagado">
                <span class="chip" [style.background]="catColor(g.categoriaId)">{{catName(g.categoriaId)}}</span>
                <span class="desc">{{g.descripcion}} <button class="del" (click)="removeGasto(g.id)">×</button></span>
                <span>{{g.previsto | currency:'MXN':'symbol':'1.0-0'}}</span>
                <span><input type="checkbox" [checked]="g.pagado" (change)="toggleGasto(g.id)"></span>
              </div>
            }
          </div>

          <div class="imp-section">
            <div class="imp-head">Imprevistos {{q}} <span class="imp-total">{{ impTotal(q) | currency:'MXN':'symbol':'1.0-0'}}</span></div>
            <div class="add-row" style="justify-content:flex-end">
              <ion-button size="small" (click)="openAddImpModal(q)">+ Agregar imprevisto</ion-button>
            </div>
            <div class="table imp-table">
              <div class="th"><span>Fecha</span><span>Importe</span><span>Desc</span></div>
              @for (i of imprevistos(q); track i.id){
                <div class="tr">
                  <span>{{i.fecha}}</span>
                  <span>{{i.importe | currency:'MXN':'symbol':'1.0-0'}}</span>
                  <span class="desc">{{i.descripcion}} <button class="del" (click)="removeImp(i.id)">×</button></span>
                </div>
              }
              @if(imprevistos(q).length===0){ <div class="empty">Sin imprevistos</div> }
            </div>
          </div>

        </div>
        <div class="card breakdown-card pad-card" [class.collapsed]="isPrevistosCollapsed(q)">
          <div class="card-title sm clickable" (click)="togglePrevistos(q)">
            <span><ion-icon [name]="isPrevistosCollapsed(q) ? 'chevron-down-outline' : 'chevron-up-outline'"></ion-icon> Gastos Previstos</span><span class="price">{{previstos(q) | currency:'MXN':'symbol':'1.0-0'}}</span>
          </div>
          @if(!isPrevistosCollapsed(q)){
          <div class="summary single">
            @for (b of breakdown(q); track b.categoria.id){
              <div class="brow"><span class="chip sm" [style.background]="b.categoria.color">{{b.categoria.nombre}}</span><span>{{b.total | currency:'MXN':'symbol':'1.0-0'}}</span></div>
            }
          </div>
          }
        </div>
        <div class="card breakdown-card pad-card" [class.collapsed]="isRealesCollapsed(q)">
          <div class="card-title sm clickable" (click)="toggleReales(q)">
            <span><ion-icon [name]="isRealesCollapsed(q) ? 'chevron-down-outline' : 'chevron-up-outline'"></ion-icon> Gastos Reales</span><span class="price teal">{{reales(q) | currency:'MXN':'symbol':'1.0-0'}}</span>
          </div>
          @if(!isRealesCollapsed(q)){
          <div class="summary single">
            @for (b of breakdown(q); track b.categoria.id){
              <div class="brow"><span class="chip sm" [style.background]="b.categoria.color">{{b.categoria.nombre}}</span><span>{{ realesCat(q,b.categoria.id) | currency:'MXN':'symbol':'1.0-0'}}</span></div>
            }
          </div>
          }
        </div>
        }
      </div>

      <div class="dual-view">
        <div class="both">
            <div class="mini">
              <h5>{{tab}} • Previsto {{previstos(tab) | currency:'MXN':'symbol':'1.0-0'}} • Pagado {{reales(tab) | currency:'MXN':'symbol':'1.0-0'}} • Faltante {{faltante(tab) | currency:'MXN':'symbol':'1.0-0'}}</h5>
              <div class="bar"><div [style.width.%]="pct(tab)"></div></div>
            </div>
        </div>
      </div>
    </div>
  </ion-content>
  `,
  styles: [`
  .bg{--background:#eef2f7}
  .container{padding:10px;max-width:1200px;margin:0 auto}
  .seg{--background:#fff;margin:8px 0;border-radius:12px}
  .panel{background:#fff;border-radius:16px;box-shadow:0 6px 20px rgba(0,0,0,.06);overflow:hidden;margin-bottom:12px}
  .panel-head{display:flex;justify-content:space-between;align-items:center;padding:10px 14px;font-weight:800;color:#e67e22;background:#fff;border-bottom:1px solid #f0f2f7}
  .falt{background:#fff3cd;border-radius:999px;padding:2px 8px;font-size:12px;border:1px solid #ffe69c}
  .pag{background:#eaf2ff;border-radius:999px;padding:2px 8px;font-size:12px;border:1px solid #cfe0ff;color:#2a6cb6}
  .imp-total{font-size:12px}
  .add-row{display:flex;gap:6px;align-items:center;padding:8px;flex-wrap:wrap}
  .table{padding:0 8px}
  .th{display:grid;grid-template-columns:90px 1fr 90px 60px;gap:6px;font-size:11px;font-weight:700;color:#6b7a90;background:#f8fafc;padding:6px;border-radius:8px;margin:6px 0}
  .tr{display:grid;grid-template-columns:90px 1fr 90px 60px;gap:6px;font-size:12px;padding:6px 0;border-bottom:1px solid #f0f2f7;align-items:center}
  .tr.paid{opacity:.6;text-decoration:line-through}
  .chip{border-radius:999px;padding:2px 6px;font-size:10px;font-weight:700;color:#0f3a5d;text-align:center}
  .chip.sm{font-size:9px}
  .desc{display:flex;gap:6px;align-items:center}
  .del{border:none;background:transparent;color:#c0392b;font-size:16px;cursor:pointer}
  .imp-section{border-top:2px solid #3a86ff;margin-top:10px;padding-top:8px}
  .imp-head{font-weight:800;color:#3a86ff;padding:0 8px;display:flex;justify-content:space-between}
  .imp-table .th{grid-template-columns:90px 90px 1fr}
  .imp-table{margin-bottom:10px;margin-left:10px}
  .imp-table .tr{grid-template-columns:90px 90px 1fr}
  .imp-total{background:#eaf2ff;border-radius:999px;padding:2px 8px}
  .empty{text-align:center;color:#9aa8c0;font-size:12px;padding:12px}
  .summary{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:10px}
  .summary.single{grid-template-columns:1fr}
  @media(max-width:700px){.summary{grid-template-columns:1fr}}
  .sum-card{background:#fafbfc;border-radius:12px;padding:10px}
  .sum-card h4{margin:0 0 8px;font-size:12px;color:#b03a5b;text-align:center}
  .brow{display:flex;justify-content:space-between;font-size:11px;padding:3px 0;border-bottom:1px solid #f0f2f7}
  .both{display:grid;grid-template-columns:1fr;gap:10px}
  .mini{background:#fff;border-radius:12px;padding:10px;box-shadow:0 4px 12px rgba(0,0,0,.05)}
  .mini h5{margin:0 0 6px;font-size:11px;color:#0f3a5d}
  .bar{height:6px;background:#eef2f7;border-radius:999px;overflow:hidden}
  .bar div{height:100%;background:#0fb27a}
  .breakdown-card{background:#fff;border-radius:16px;box-shadow:0 6px 20px rgba(0,0,0,.06);overflow:hidden;margin:12px 0 12px 0;border:1px solid #e6eaf0}
  .breakdown-card.collapsed{opacity:.95}
  .collapse-head{display:flex;justify-content:space-between;align-items:center;padding:10px 14px;font-weight:800;color:#0f3a5d;cursor:pointer;background:#fff;border-bottom:1px solid #f0f2f7}
  .card-title{font-weight:800;color:#0f3a5d;margin-bottom:8px}
  .card-title.sm{font-size:13px;display:flex;justify-content:space-between;align-items:center}
  .card-title.sm.clickable{cursor:pointer}
  .price{background:#ff9a3d;color:#fff;border-radius:999px;padding:2px 8px;font-size:12px}
  .price.teal{background:#0f7a7a}
  .pad-card{padding:14px}
  .collapse-head ion-icon{margin-right:6px}
  .collapse-hint{font-size:11px;color:#9aa8c0;font-weight:400}
  `]
})
export class GastosPage {
  tab: Quincena = 'Q1';
  previstosCollapsed: Record<string, boolean> = { Q1: true, Q2: true };
  realesCollapsed: Record<string, boolean> = { Q1: true, Q2: true };
  isPrevistosCollapsed(q: string){ return !!this.previstosCollapsed[q]; }
  togglePrevistos(q: string){ this.previstosCollapsed[q] = !this.previstosCollapsed[q]; }
  isRealesCollapsed(q: string){ return !!this.realesCollapsed[q]; }
  toggleReales(q: string){ this.realesCollapsed[q] = !this.realesCollapsed[q]; }
  constructor(public budget: BudgetService, private modalCtrl: ModalController){ addIcons({ chevronDownOutline, chevronUpOutline }); }
  gastos(q: Quincena) { return this.budget.getGastos(q); }
  imprevistos(q: Quincena) { return this.budget.getImprevistos(q); }
  previstos(q: Quincena) { return this.budget.resumenQuincena(q).previstos; }
  reales(q: Quincena) { return this.budget.resumenQuincena(q).reales; }
  faltante(q: Quincena) { return this.budget.resumenQuincena(q).pendiente; }
  impTotal(q: Quincena) { return this.budget.getImprevistos(q).reduce((s, i) => s + i.importe, 0); }
  pct(q: Quincena) { const r = this.budget.resumenQuincena(q); return r.previstos ? Math.round((r.reales / r.previstos) * 100) : 0; }
  breakdown(q: Quincena) { return this.budget.breakdownCategoria(q); }
  realesCat(q: Quincena, catId: string) { return this.budget.getGastos(q).filter(g => g.categoriaId === catId && g.pagado).reduce((s, g) => s + g.previsto, 0); }
  catName(id: string) { return this.budget.categorias.find(c => c.id === id)?.nombre || id; }
  catColor(id: string) { return this.budget.categorias.find(c => c.id === id)?.color || '#ddd'; }
  toggleGasto(id: string) { this.budget.toggleGasto(id); }
  removeGasto(id: string) { this.budget.removeGasto(id); }
  async openAddGastoModal(q: Quincena) {
    const modal = await this.modalCtrl.create({ component: GastoModalComponent, breakpoints: [0,0.7], initialBreakpoint: 0.7, handle: true, cssClass: 'tc-70' });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data) this.budget.addGasto({ quincena: q, categoriaId: data.categoriaId, descripcion: data.descripcion, previsto: data.previsto, pagado: false, tipo: 'fijo' });
  }
  async openAddImpModal(q: Quincena) {
    const modal = await this.modalCtrl.create({ component: ImprevistoModalComponent, breakpoints: [0,0.7], initialBreakpoint: 0.7, handle: true, cssClass: 'tc-70' });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data) this.budget.addImprevisto({ quincena: q, fecha: data.fecha, importe: data.importe, descripcion: data.descripcion, pagado: false });
  }
  toggleImp(id: string) { this.budget.toggleImprevisto(id); }
  removeImp(id: string) { this.budget.removeImprevisto(id); }
}
