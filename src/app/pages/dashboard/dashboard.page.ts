import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonIcon, IonButton, IonInput, IonItem, IonButtons, ModalController } from '@ionic/angular';
import { CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { BudgetService } from '../../core/services/budget.service';
import { AuthService } from '../../core/services/auth.service';
import { addIcons } from 'ionicons';
import { chevronDownOutline, chevronUpOutline, createOutline, logOutOutline } from 'ionicons/icons';

@Component({
  selector: 'app-ingreso-modal',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonInput, IonButton, IonButtons, FormsModule],
  template: `
  <ion-header><ion-toolbar><ion-title>Nuevo ingreso</ion-title><ion-buttons slot="end"><ion-button (click)="cancel()">Cerrar</ion-button></ion-buttons></ion-toolbar></ion-header>
  <ion-content class="ion-padding">
    <ion-item><ion-input label="Concepto" labelPlacement="stacked" [(ngModel)]="concepto" placeholder="Ej. Nómina"></ion-input></ion-item>
    <ion-item><ion-input label="Monto ($)" labelPlacement="stacked" type="number" [(ngModel)]="monto"></ion-input></ion-item>
    <ion-button expand="block" style="margin-top:20px" (click)="save()">Agregar</ion-button>
  </ion-content>
  `,
})
export class IngresoModalComponent {
  @Input() concepto: string = '';
  @Input() monto: any = null;
  constructor(private modalCtrl: ModalController) {}
  cancel(){ this.modalCtrl.dismiss(null); }
  save(){ if(!this.concepto||this.monto==null||this.monto==='') return; this.modalCtrl.dismiss({ concepto:this.concepto.trim(), monto:Number(this.monto)}); }
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonIcon, IonButton, IonInput, FormsModule, CurrencyPipe],
  template: `
  <ion-header class="hdr">
    <ion-toolbar>
      <ion-title>
        <div class="title-wrap">
          <span>Dashboard</span><small>{{today}}</small>
        </div>
      </ion-title>
      <ion-button slot="end" fill="clear" (click)="logout()"><ion-icon name="log-out-outline"></ion-icon></ion-button>
    </ion-toolbar>
  </ion-header>

  <ion-content class="bg">
    <div class="container">

      <div class="q-switch">
        <span>Quincena actual:</span>
        <label class="chk" [class.active]="quincenaActual==='TODO'"><input type="checkbox" [checked]="quincenaActual==='TODO'" (change)="setActual('TODO')"> TODO</label>
        <label class="chk" [class.active]="quincenaActual==='Q1'"><input type="checkbox" [checked]="quincenaActual==='Q1'" (change)="setActual('Q1')"> Q1</label>
        <label class="chk" [class.active]="quincenaActual==='Q2'"><input type="checkbox" [checked]="quincenaActual==='Q2'" (change)="setActual('Q2')"> Q2</label>
      </div>

      <div class="grid2">
        @for (q of filteredQs; track q) {
        <div class="card q-card" [class.collapsed]="isCollapsed(q)" [class.q2]="q==='Q2'">
          <div class="q-head" [style.background]="q==='Q1' ? '#0fb27a' : '#0e9b6b'" (click)="toggleCollapse(q)">
            <span class="head-left"><ion-icon [name]="isCollapsed(q) ? 'chevron-down-outline' : 'chevron-up-outline'"></ion-icon> {{'DINERO TOTAL ' + q}}</span>
            <span class="head-right">{{ ingreso(q) | currency:'MXN':'symbol':'1.0-0'}} <ion-icon name="create-outline" class="edit-icon" (click)="toggleEdit(q); $event.stopPropagation()"></ion-icon></span>
          </div>
          @if(!isCollapsed(q)){
          <div class="q-body">
            @if(!editing[q]){
              <div class="row"><span>Efectivo</span><b>{{efectivo(q) | currency:'MXN':'symbol':'1.0-0'}}</b></div>
              <div class="row"><span>Vales</span><b>{{vales(q) | currency:'MXN':'symbol':'1.0-0'}}</b></div>
              <div class="row muted"><span>Nomina</span><b>{{nomina(q) | currency:'MXN':'symbol':'1.0-0'}}</b></div>
              <div class="edit-link"><a (click)="toggleEdit(q)">✎ Editar efectivo / vales / nómina</a></div>
            } @else {
              <div class="edit-grid">
                <label>Efectivo<ion-input type="number" [(ngModel)]="editVals[q].efectivo" class="edit-inp"></ion-input></label>
                <label>Vales<ion-input type="number" [(ngModel)]="editVals[q].vales" class="edit-inp"></ion-input></label>
                <label>Nómina<ion-input type="number" [(ngModel)]="editVals[q].nomina" class="edit-inp"></ion-input></label>
              </div>
              <div class="edit-actions">
                <ion-button size="small" color="medium" fill="outline" (click)="toggleEdit(q)">Cancelar</ion-button>
                <ion-button size="small" (click)="saveEdit(q)">Guardar</ion-button>
              </div>
            }
            <div class="divider"></div>
            <div class="row warn"><span style="font-size:16px">Gastos previstos</span><b>{{ previstos(q) | currency:'MXN':'symbol':'1.0-0'}}</b></div>
            <div class="row ok"><span style="font-size:16px">Gastos reales</span><b>{{ reales(q) | currency:'MXN':'symbol':'1.0-0'}}</b></div>
            <div class="divider"></div>
            <div class="row sob"><span>Sobrante</span><b>{{ sobrante(q) | currency:'MXN':'symbol':'1.0-0'}}</b></div>
            <div class="row saldo"><span>Saldo total</span><b>{{ saldoTotal(q) | currency:'MXN':'symbol':'1.0-0'}}</b></div>
            <div class="divider"></div>
            <div class="row gasto-pend"><span>Gasto pendiente</span><b class="pend">{{ pendiente(q) | currency:'MXN':'symbol':'1.0-0'}}</b></div>
            @if (todoBien(q) > 0) {
              <div class="row sobra todo-row"><span>SOBRA DINERO</span><b>{{ todoBien(q) | currency:'MXN':'symbol':'1.0-0'}}</b></div>
            } @else if (todoBien(q) < 0) {
              <div class="row falta todo-row"><span>FALTA DINERO</span><b>{{ (todoBien(q) * -1) | currency:'MXN':'symbol':'1.0-0'}}</b></div>
            } @else {
              <div class="row todo-row"><span>TODO EN ORDEN</span><span class="badge-ok">✓</span></div>
            }
            <div class="progress"><div [style.width.%]="pct(q)"></div></div>
            <small>Falta {{ pendiente(q) | currency:'MXN':'symbol':'1.0-0'}} para completar</small>
          </div>
          }
        </div>
        }
      </div>

      <div class="saldo-card">
        @if(quincenaActual==='TODO'){
          <span>SALDO MENSUAL PREVISTO</span><b>{{saldoPrevisto | currency:'MXN':'symbol':'1.0-0'}}</b>
        } @else if(quincenaActual==='Q1'){
          <span>SALDO Q1</span><b>{{ sobrante('Q1') | currency:'MXN':'symbol':'1.0-0'}}</b>
        } @else {
          <span>SALDO Q2</span><b>{{ sobrante('Q2') | currency:'MXN':'symbol':'1.0-0'}}</b>
        }
      </div>

      <div class="grid2">
        <div class="card q-card" [class.collapsed]="deudasCollapsed">
          <div class="q-head" style="background:#ffa500" (click)="deudasCollapsed=!deudasCollapsed">
            <span class="head-left"><ion-icon [name]="deudasCollapsed ? 'chevron-down-outline' : 'chevron-up-outline'"></ion-icon> CUENTAS POR PAGAR</span>
            <span class="head-right">{{ (pagosPendientesMonto + deudaMarinaMensual) | currency:'MXN':'symbol':'1.0-0'}}</span>
          </div>
          @if(!deudasCollapsed){
          <div class="q-body">
            <div class="deuda-row"><span>Pagos Tarjeta {{pagosPendientesCount}} - {{pagosPendientesMonto | currency:'MXN':'symbol':'1.0-0'}}</span><span></span></div>
            <div class="deuda-row"><span>Deudas General - {{deudaMarinaMensual | currency:'MXN':'symbol':'1.0-0'}}</span><span></span></div>
          </div>
          }
        </div>
        <div class="card q-card" [class.collapsed]="deudoresCollapsed">
          <div class="q-head" style="background:#45818e" (click)="deudoresCollapsed=!deudoresCollapsed">
            <span class="head-left"><ion-icon [name]="deudoresCollapsed ? 'chevron-down-outline' : 'chevron-up-outline'"></ion-icon> DEUDORES</span>
            <span class="head-right">{{ deudoresTotal | currency:'MXN':'symbol':'1.0-0'}}</span>
          </div>
          @if(!deudoresCollapsed){
          <div class="q-body">
            <div class="deuda-row"><span>Total Deudores - {{deudoresTotal | currency:'MXN':'symbol':'1.0-0'}}</span><span></span></div>
          </div>
          }
        </div>
      </div>

      @if(quincenaActual==='TODO' || true){
      <div class="card table-card" [class.collapsed]="gastosCollapsed">
        <div class="card-title clickable" (click)="gastosCollapsed=!gastosCollapsed">
          <span><ion-icon [name]="gastosCollapsed ? 'chevron-down-outline' : 'chevron-up-outline'"></ion-icon> Gastos mensuales</span>
        </div>
        @if(!gastosCollapsed){
          @if(quincenaActual==='TODO'){
            <div class="tbl head"><span>Categoría</span><span>Q1</span><span>Q2</span><span>Total</span></div>
            @for (r of rows; track r.cat.id) {
              <div class="tbl">
                <span class="cat"><i [style.background]="r.cat.color"></i>{{r.cat.nombre}}</span>
                <span>{{r.q1 | currency:'MXN':'symbol':'1.0-0'}}</span>
                <span>{{r.q2 | currency:'MXN':'symbol':'1.0-0'}}</span>
                <span class="bold">{{r.q1+r.q2 | currency:'MXN':'symbol':'1.0-0'}}</span>
              </div>
            }
            <div class="tbl total"><span>Total</span><span>{{totalQ1 | currency:'MXN':'symbol':'1.0-0'}}</span><span>{{totalQ2 | currency:'MXN':'symbol':'1.0-0'}}</span><span>{{totalQ1+totalQ2 | currency:'MXN':'symbol':'1.0-0'}}</span></div>
          } @else if(quincenaActual==='Q1'){
            <div class="tbl head th-3"><span>Categoría</span><span>Q1</span><span>Total</span></div>
            @for (r of rows; track r.cat.id) { @if(r.q1>0){
              <div class="tbl th-3">
                <span class="cat"><i [style.background]="r.cat.color"></i>{{r.cat.nombre}}</span>
                <span>{{r.q1 | currency:'MXN':'symbol':'1.0-0'}}</span>
                <span class="bold">{{r.q1 | currency:'MXN':'symbol':'1.0-0'}}</span>
              </div>
            } }
            <div class="tbl total th-3"><span>Total</span><span>{{totalQ1 | currency:'MXN':'symbol':'1.0-0'}}</span><span>{{totalQ1 | currency:'MXN':'symbol':'1.0-0'}}</span></div>
          } @else {
            <div class="tbl head th-3"><span>Categoría</span><span>Q2</span><span>Total</span></div>
            @for (r of rows; track r.cat.id) { @if(r.q2>0){
              <div class="tbl th-3">
                <span class="cat"><i [style.background]="r.cat.color"></i>{{r.cat.nombre}}</span>
                <span>{{r.q2 | currency:'MXN':'symbol':'1.0-0'}}</span>
                <span class="bold">{{r.q2 | currency:'MXN':'symbol':'1.0-0'}}</span>
              </div>
            } }
            <div class="tbl total th-3"><span>Total</span><span>{{totalQ2 | currency:'MXN':'symbol':'1.0-0'}}</span><span>{{totalQ2 | currency:'MXN':'symbol':'1.0-0'}}</span></div>
          }
        }
      </div>
      }

      <div class="grid2 ingresos-sep">
        @for (q of filteredQs; track q) {
          <div class="card ingreso-table-card" [class.collapsed]="isIngCollapsed(q)">
            <div class="ing-head clickable" (click)="toggleIngCollapse(q)"><span><ion-icon [name]="isIngCollapsed(q) ? 'chevron-down-outline' : 'chevron-up-outline'"></ion-icon> Ingresos {{q}}</span><b>{{ getIngresoTotal(q) | currency:'MXN':'symbol':'1.0-0'}}</b></div>
            @if(!isIngCollapsed(q)){
            <div class="ing-col">
              <div class="ing-list head"><span>Concepto</span><span>Monto</span><span></span></div>
              @for (ing of getIngresos(q); track ing.id) {
                <div class="ing-list">
                  <span><input class="cell-inp" [(ngModel)]="ing.concepto" (blur)="saveIngresoConcepto(q, ing)" placeholder="Concepto"></span>
                  <span><input class="cell-inp num" type="number" [(ngModel)]="ing.monto" (change)="saveIngresoMonto(q, ing)" (blur)="saveIngresoMonto(q, ing)"></span>
                  <span><button class="del" (click)="removeIngreso(q, ing.id)">×</button></span>
                </div>
              }
              <div class="add-ing" style="justify-content:flex-end">
                <ion-button size="small" (click)="openAddIngresoModal(q)">+ Agregar ingreso</ion-button>
              </div>
            </div>
            }
          </div>
          }
        </div>
    </div>
  </ion-content>
  `,
  styles: [`
  .hdr ion-toolbar{--background:#fff}
  .title-wrap{display:flex;flex-direction:column;line-height:1}
  .title-wrap small{font-size:11px;color:#6b7a90;font-weight:400}
  .bg{--background:#eef2f7}
  .container{padding:14px;max-width:900px;margin:0 auto}
  .greeting{display:flex;justify-content:space-between;align-items:center;margin:6px 0 12px}
  .greeting h2{margin:0;font-size:18px;font-weight:800;color:#0f3a5d}
  .greeting p{margin:2px 0 0;color:#6b7a90;font-size:12px}
  .pill{background:#0f3a5d;color:#fff;border-radius:999px;padding:6px 12px;font-size:12px;font-weight:700}
  .q-switch{display:flex;gap:10px;align-items:center;background:#fff;border-radius:999px;padding:8px 14px;margin-bottom:12px;box-shadow:0 4px 12px rgba(0,0,0,.05);flex-wrap:wrap}
  .q-switch span{font-size:12px;font-weight:700;color:#0f3a5d}
  .chk{font-size:12px;font-weight:700;color:#6b7a90;display:flex;gap:6px;align-items:center;border:1px solid #e6eaf0;border-radius:999px;padding:4px 10px;cursor:pointer}
  .chk.active{background:#0f3a5d;color:#fff;border-color:#0f3a5d}
  .chk input{accent-color:#0f3a5d}
  .hint{font-size:10px;color:#9aa8c0;margin-left:auto}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  @media(max-width:700px){.grid2{grid-template-columns:1fr}}
  .card{background:#fff;border-radius:16px;box-shadow:0 6px 20px rgba(0,0,0,.06);overflow:hidden}
  .card.collapsed{opacity:.95}
  .q-card.collapsed{padding-bottom:6px}
  .q-head{color:#fff;font-weight:800;padding:10px 14px;display:flex;justify-content:space-between;font-size:16px;cursor:pointer;align-items:center}
  .head-left{display:flex;gap:6px;align-items:center}
  .head-right{display:flex;gap:8px;align-items:center}
  .edit-icon{font-size:16px;background:rgba(255,255,255,.2);border-radius:6px;padding:4px}
  .q-body{padding:12px 14px}
  .row{display:flex;justify-content:space-between;font-size:16px;padding:3px 0}
  .row.muted{color:#9aa8c0}
  .row.warn{color:#b77900;background:#fff8e1;border-radius:6px;padding:4px 6px;font-size:16px !important}
  .row.warn span{font-size:16px !important}
  .row.ok{color:#0b7a4a;background:#e6f7ed;border-radius:6px;padding:4px 6px;margin-top:4px}
  .row.sob{color:#7a3fa0;background:#f3e8ff;border-radius:6px;padding:4px 6px;margin-top:6px;font-weight:700}
  .row.saldo{color:#0f3a5d;background:#e8f0fe;border-radius:6px;padding:4px 6px;margin-top:6px;font-weight:700}
  .row.gasto-pend{padding:4px 6px;margin-top:6px;font-weight:700}
  .row.sobra{color:#b77900;background:#fff3e0;border-radius:6px;padding:4px 6px;font-weight:800;border:1px solid #ffcc80;margin-top:8px}
  .row.falta{color:#c62828;background:#ffebee;border-radius:6px;padding:4px 6px;font-weight:800;border:1px solid #ef9a9a;margin-top:8px}
  .row.todo-row{margin-top:8px}
  .divider{height:1px;background:#eef2f7;margin:6px 0}
  .badge-ok{color:#0fb27a;font-weight:800}
  .pend{color:#0f3a5d}
  .progress{height:6px;background:#eef2f7;border-radius:999px;overflow:hidden;margin-top:6px}
  .progress div{height:100%;background:#0fb27a}
  .q-card small{font-size:10px;color:#6b7a90}
  .edit-link{margin:6px 0}
  .edit-link a{font-size:11px;color:#0f3a5d;font-weight:700;cursor:pointer;text-decoration:underline}
  .edit-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin:8px 0}
  @media(max-width:500px){.edit-grid{grid-template-columns:1fr}}
  .edit-grid label{font-size:11px;color:#6b7a90;font-weight:700;display:flex;flex-direction:column;gap:4px}
  .edit-inp{--background:#f4f6f9;border-radius:8px;--padding-start:8px}
  .edit-actions{display:flex;gap:8px;justify-content:flex-end}
  .table-card{padding:14px;margin-top:12px}
  .table-card.collapsed{padding-bottom:6px}
  .card-title{font-weight:800;color:#0f3a5d;margin-bottom:8px;font-size:16px;text-transform:uppercase}
  .card-title.clickable{cursor:pointer;display:flex;justify-content:space-between;align-items:center}
  .collapse-hint{font-size:11px;color:#9aa8c0;font-weight:400}
  .card-title.sm{font-size:13px;display:flex;justify-content:space-between}
  .price{background:#ff9a3d;color:#fff;border-radius:999px;padding:2px 8px;font-size:12px}
  .price.teal{background:#0f7a7a}
  .tbl{display:grid;grid-template-columns:1.2fr .7fr .7fr .8fr;gap:6px;padding:6px 0;border-bottom:1px solid #f0f2f7;font-size:12px;align-items:center}
  .tbl.th-3{grid-template-columns:1.2fr .8fr .8fr}
  .tbl.head{font-weight:700;color:#6b7a90;background:#f8fafc;border-radius:8px;padding:8px 6px}
  .tbl.total{font-weight:800;background:#f8fafc;border-radius:8px;margin-top:6px}
  .cat{display:flex;align-items:center;gap:6px}
  .cat i{width:10px;height:10px;border-radius:50%;display:inline-block}
  .bold{font-weight:700}
  .saldo-card{margin:12px 0;background:#ffe8d6;color:#e88c00;border-radius:12px;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;font-weight:800}
  .saldo-card b{font-size:18px}
  .chip{border-radius:999px;padding:2px 8px;font-size:11px;font-weight:700;color:#0f3a5d}
  .chip.ropa{background:#ffe18f}
  .chip.purple{background:#a8a4ff;color:#fff}
  .pad-card{padding:14px}
  .pad-card .card-title{margin:0 0 10px 0}
  .inner{padding:4px 2px}
  .deuda-row{display:flex;justify-content:space-between;font-size:12px;padding:8px 10px;border-bottom:1px solid #f0f2f7;background:#fafbfc;border-radius:8px;margin-bottom:6px}
  .deuda-row:last-child{margin-bottom:0}
  .falta{font-size:11px;color:#c0392b;display:flex;gap:4px;align-items:center;margin:6px 2px 0 2px}
  .ingreso-table-card{padding:14px;margin-top:0;overflow:hidden}
  .ingresos-sep{margin-top:28px}
  .ingreso-table-card.collapsed{padding-bottom:6px;opacity:.95}
  .ing-head.clickable{cursor:pointer}
  .ing-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  @media(max-width:700px){.ing-grid{grid-template-columns:1fr}}
  .ing-col{background:#fafbfc;border-radius:12px;padding:10px}
  .ing-head{display:flex;justify-content:space-between;align-items:center;font-weight:800;color:#0f3a5d;margin-bottom:8px;font-size:16px;text-transform:uppercase}
  .ing-head b{color:#0fb27a}
  .ing-list{display:grid;grid-template-columns:1fr 90px 30px;gap:6px;align-items:center;padding:6px 0;border-bottom:1px solid #eef2f7;font-size:12px}
  .ing-list.head{font-weight:700;color:#6b7a90;background:#fff;border-radius:8px;padding:6px}
  .cell-inp{width:100%;border:1px solid #e6eaf0;border-radius:6px;padding:6px 8px;font-size:12px;background:#fff}
  .cell-inp.num{text-align:right}
  .add-ing{display:flex;gap:6px;align-items:center;margin-top:8px;flex-wrap:wrap}
  .add-ing .inp{--background:#fff;border-radius:8px;--padding-start:8px;min-width:90px}
  .del{border:none;background:transparent;color:#c0392b;font-size:18px;cursor:pointer}
  `]
})
export class DashboardPage {
  today = new Date().toLocaleDateString('es-MX', { weekday: 'short', day: '2-digit', month: 'short' });
  userName = 'Peter';
  presupuesto = this.budget.getPresupuesto();
  pagosTC = this.budget.getPagosTC();
  deudas: any[] = [];
  deudoresLista: any[] = [];
  deudores = this.budget.getDeudores();
  deudaTotal = 0;
  totalLa = 0;
  deudaMarinaMensual = 0;
  deudoresTotal = 0;
  pagosPendientesCount = 0;
  pagosPendientesMonto = 0;
  pagosPendientesTotal = 0;
  saldoPrevisto = 0;
  rows: any[] = [];
  totalQ1 = 0; totalQ2 = 0;
  quincenaActual: 'Q1'|'Q2'|'TODO' = 'TODO';
  collapsed: Record<string, boolean> = { Q1: false, Q2: false };
  collapsedIng: Record<string, boolean> = { Q1: false, Q2: false };
  gastosCollapsed = true;
  get filteredQs(): string[] { return this.quincenaActual==='TODO' ? ['Q1','Q2'] : [this.quincenaActual]; }
  deudasCollapsed = true;
  deudoresCollapsed = true;
  editing: Record<string, boolean> = { Q1: false, Q2: false };
  editVals: Record<string, any> = { Q1: { efectivo: 0, vales: 0, nomina: 0 }, Q2: { efectivo: 0, vales: 0, nomina: 0 } };
  newIngConcepto: Record<string, string> = { Q1: '', Q2: '' };
  newIngMonto: Record<string, any> = { Q1: null, Q2: null };
  private manualToggle = new Set<string>();
  private manualIngToggle = new Set<string>();

  constructor(private budget: BudgetService, private auth: AuthService, private router: Router, private modalCtrl: ModalController) {
    addIcons({ chevronDownOutline, chevronUpOutline, createOutline, logOutOutline });
    const u = this.auth.currentUser(); if (u) this.userName = u.nombre;
    this.quincenaActual = this.budget.getQuincenaActual();
    this.applyAutoCollapse();
    this.refresh();
    this.budget.gastos$.subscribe(() => this.refresh());
    this.budget.imprevistos$.subscribe(() => this.refresh());
    this.budget.presupuesto$.subscribe(p => { this.presupuesto = p; this.refresh(); });
    this.budget.quincenaActual$.subscribe((q: any) => { this.quincenaActual = q; this.applyAutoCollapse(); });
  }
  ionViewWillEnter() { this.refresh(); }
  refresh() {
    this.presupuesto = this.budget.getPresupuesto();
    const cats = this.budget.categorias;
    this.rows = cats.map(c => {
      const q1 = this.budget.getGastos('Q1').filter(g => g.categoriaId === c.id).reduce((s, g) => s + g.previsto, 0);
      const q2 = this.budget.getGastos('Q2').filter(g => g.categoriaId === c.id).reduce((s, g) => s + g.previsto, 0);
      return { cat: c, q1, q2 };
    }).filter(r => r.q1 || r.q2);
    this.totalQ1 = this.rows.reduce((s, r) => s + r.q1, 0);
    this.totalQ2 = this.rows.reduce((s, r) => s + r.q2, 0);
    this.saldoPrevisto = this.budget.resumenQuincena('Q1').sobrante + this.budget.resumenQuincena('Q2').sobrante;
    this.pagosTC = this.budget.getPagosTC();
    this.deudas = this.budget.getDeudas();
    this.deudoresLista = this.budget.getDeudoresLista();
    this.deudoresTotal = this.deudoresLista.filter((d:any)=> !(d.pagados>0 && d.pagados>=d.pagos)).reduce((s:any,d:any)=>s+(Number(d.saldo)||0),0);
    this.totalLa = this.deudas.reduce((s:any,d:any)=>s+(Number(d.saldo)||0),0);
    this.deudaMarinaMensual = this.deudas.reduce((s:any,d:any)=>s+(Number(d.mensualidad)||0),0);
    this.pagosPendientesCount = this.pagosTC.filter((p:any)=>!p.pagado).length;
    this.pagosPendientesMonto = this.pagosTC.filter((p:any)=>!p.pagado).reduce((s:any,p:any)=>s+(Number(p.monto)||0),0);
    this.pagosPendientesTotal = this.pagosTC.filter((p:any)=>!p.pagado).reduce((s:any,p:any)=>s+(Number(p.montoTotal)||0),0);
    this.deudores = this.budget.getDeudores();
    this.deudoresTotal = this.deudores.reduce((s, d) => s + d.monto, 0);
  }
  getIngresos(q: string) { return this.budget.getIngresos(q as any); }
  getIngresoTotal(q: string) { return this.budget.getIngresoTotal(q as any); }
  ingreso(q: string) { return this.budget.getDineroTotal(q as any); }
  efectivo(q: string) { return this.budget.getDinero(q as any).efectivo; }
  vales(q: string) { return this.budget.getDinero(q as any).vales; }
  nomina(q: string) { return this.budget.getDinero(q as any).nomina; }
  previstos(q: any) { return this.budget.resumenQuincena(q).previstos; }
  reales(q: any) { return this.budget.resumenQuincena(q).reales; }
  sobrante(q: any) { return this.budget.resumenQuincena(q).sobrante; }
  saldoTotal(q: any) { return this.budget.getIngresoTotal(q) - this.budget.resumenQuincena(q).reales; }
  todoBien(q: any) { return this.saldoTotal(q) - this.ingreso(q); }
  pendiente(q: any) { return this.budget.resumenQuincena(q).pendiente; }
  pct(q: any) { const r = this.budget.resumenQuincena(q); return r.previstos ? Math.round((r.reales / r.previstos) * 100) : 0; }
  isCollapsed(q: string) { return !!this.collapsed[q]; }
  isIngCollapsed(q: string) { return !!this.collapsedIng[q]; }
  toggleCollapse(q: string) { this.collapsed[q] = !this.collapsed[q]; if (this.collapsed[q]) this.manualToggle.add(q); else this.manualToggle.delete(q); }
  toggleIngCollapse(q: string) { this.collapsedIng[q] = !this.collapsedIng[q]; if (this.collapsedIng[q]) this.manualIngToggle.add(q); else this.manualIngToggle.delete(q); }
  setActual(q: 'Q1'|'Q2'|'TODO') { this.budget.setQuincenaActual(q as any); this.manualToggle.clear(); this.manualIngToggle.clear(); this.applyAutoCollapse(); }
  private applyAutoCollapse() {
    if (this.quincenaActual === 'TODO') { this.collapsed = { Q1: false, Q2: false }; this.collapsedIng = { Q1: false, Q2: false }; return; }
    if (this.manualToggle.size === 0) {
      this.collapsed = { Q1: this.quincenaActual === 'Q2', Q2: this.quincenaActual === 'Q1' };
    } else {
      if (!this.manualToggle.has('Q1')) this.collapsed['Q1'] = this.quincenaActual === 'Q2';
      if (!this.manualToggle.has('Q2')) this.collapsed['Q2'] = this.quincenaActual === 'Q1';
    }
    if (this.manualIngToggle.size === 0) {
      this.collapsedIng = { Q1: this.quincenaActual === 'Q2', Q2: this.quincenaActual === 'Q1' };
    } else {
      if (!this.manualIngToggle.has('Q1')) this.collapsedIng['Q1'] = this.quincenaActual === 'Q2';
      if (!this.manualIngToggle.has('Q2')) this.collapsedIng['Q2'] = this.quincenaActual === 'Q1';
    }
  }
  toggleEdit(q: string) {
    const cur = this.editing[q];
    if (!cur) {
      this.editVals[q] = { efectivo: this.efectivo(q), vales: this.vales(q), nomina: this.nomina(q) };
    }
    this.editing[q] = !cur;
  }
  saveEdit(q: any) {
    const v = this.editVals[q];
    this.budget.patchPresupuesto(q, { efectivo: Number(v.efectivo) || 0, vales: Number(v.vales) || 0, nomina: Number(v.nomina) || 0 });
    this.editing[q] = false;
    this.refresh();
  }
  async openAddIngresoModal(q: any) {
    const modal = await this.modalCtrl.create({ component: IngresoModalComponent, breakpoints: [0,0.7], initialBreakpoint: 0.7, handle: true, cssClass: 'tc-70' });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data && data.concepto) { this.budget.addIngreso(q, data.concepto, Number(data.monto)); this.refresh(); }
  }
  addIngreso(q: any) { this.openAddIngresoModal(q); }
  saveIngresoMonto(q: any, ing: any) { this.budget.updateIngreso(q, ing.id, { monto: Number(ing.monto) || 0 }); this.refresh(); }
  saveIngresoConcepto(q: any, ing: any) { this.budget.updateIngreso(q, ing.id, { concepto: ing.concepto }); this.refresh(); }
  removeIngreso(q: any, id: string) { this.budget.removeIngreso(q, id); this.refresh(); }
  logout() { this.auth.logout(); this.router.navigateByUrl('/login'); }
}
