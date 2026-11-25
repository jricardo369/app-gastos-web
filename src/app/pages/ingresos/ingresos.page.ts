import { Component, DestroyRef, inject, Input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonInput, IonTitle, IonToolbar, ModalController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { addOutline, chevronDownOutline, chevronUpOutline, trashOutline } from 'ionicons/icons';
import { BudgetService } from '../../core/services/budget.service';
import { FiltroQuincena } from '../../core/models/budget.model';

@Component({
  selector: 'app-ingreso-modal',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonInput, IonButton, IonButtons, FormsModule],
  template: `
  <ion-header><ion-toolbar><ion-title>Nuevo ingreso</ion-title><ion-buttons slot="end"><ion-button (click)="cancel()">Cerrar</ion-button></ion-buttons></ion-toolbar></ion-header>
  <ion-content class="ion-padding">
    <ion-input label="Concepto" labelPlacement="stacked" [(ngModel)]="concepto" placeholder="Ej. Nómina"></ion-input>
    <ion-input label="Monto ($)" labelPlacement="stacked" type="number" [(ngModel)]="monto"></ion-input>
    <ion-button expand="block" class="btn-add" style="margin-top:20px" (click)="save()">Agregar</ion-button>
  </ion-content>
  `,
})
export class IngresoModalComponent {
  private modalCtrl = inject(ModalController);
  @Input() concepto: string = '';
  @Input() monto: any = null;
  cancel(){ this.modalCtrl.dismiss(null); }
  save(){ if(!this.concepto||this.monto==null||this.monto==='') return; this.modalCtrl.dismiss({ concepto:this.concepto.trim(), monto:Number(this.monto)}); }
}

@Component({
  selector: 'app-ingresos',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonIcon, IonButton, FormsModule, CurrencyPipe],
  template: `
  <ion-header class="hdr">
    <ion-toolbar><ion-title>Ingresos</ion-title></ion-toolbar>
  </ion-header>

  <ion-content class="bg">
    <div class="container">
      <div class="seg" role="group" aria-label="Periodo">
        <button type="button" class="seg-btn" [class.on]="quincenaActual==='TODO'" [attr.aria-pressed]="quincenaActual==='TODO'" (click)="setActual('TODO')">Todo el mes</button>
        @if (!esMensual) {
          <button type="button" class="seg-btn" [class.on]="quincenaActual==='Q1'" [attr.aria-pressed]="quincenaActual==='Q1'" (click)="setActual('Q1')">Quincena 1</button>
          <button type="button" class="seg-btn" [class.on]="quincenaActual==='Q2'" [attr.aria-pressed]="quincenaActual==='Q2'" (click)="setActual('Q2')">Quincena 2</button>
        }
      </div>

      <div class="card total-card">
        <span class="lbl">Ingreso total del periodo</span>
        <b class="money">{{ ingresoTotalGlobal | currency:'MXN':'symbol':'1.0-0' }}</b>
        <span class="count">Ingresos cargados en el presupuesto</span>
      </div>

      @for (q of filteredQs; track q) {
        <div class="card ing-card">
          <button type="button" class="ing-head" (click)="toggleIngCollapse(q)" [attr.aria-expanded]="!isIngCollapsed(q)">
            <span class="head-left">
              <ion-icon [name]="isIngCollapsed(q) ? 'chevron-down-outline' : 'chevron-up-outline'" aria-hidden="true"></ion-icon>
              <span class="lbl">{{ etiquetaQuincena(q) }}</span>
            </span>
            <b class="money">{{ getIngresoTotal(q) | currency:'MXN':'symbol':'1.0-0' }}</b>
          </button>
          @if(!isIngCollapsed(q)){
            <div class="ing-body">
              @for (ing of getIngresos(q); track ing.id) {
                <div class="ing-list">
                  <input class="cell-inp" [(ngModel)]="ing.concepto" (blur)="saveIngresoConcepto(q, ing)" placeholder="Concepto" aria-label="Concepto del ingreso">
                  <input class="cell-inp num" type="number" [(ngModel)]="ing.monto" (change)="saveIngresoMonto(q, ing)" (blur)="saveIngresoMonto(q, ing)" aria-label="Monto del ingreso">
                  <button type="button" class="icon-btn" (click)="removeIngreso(q, ing.id)" [attr.aria-label]="'Eliminar el ingreso ' + ing.concepto">
                    <ion-icon name="trash-outline" aria-hidden="true"></ion-icon>
                  </button>
                </div>
              }
              @if (getIngresos(q).length === 0) {
                <div class="empty">Sin ingresos cargados</div>
              }
              <div class="add-ing">
                <ion-button size="small" class="btn-add" (click)="openAddIngresoModal(q)">
                  <ion-icon slot="start" name="add-outline" aria-hidden="true"></ion-icon>Agregar ingreso
                </ion-button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  </ion-content>
  `,
  styles: [`
    .bg{--background:var(--app-bg)}
    .container{max-width:980px;margin:0 auto;padding:16px 14px 32px;display:flex;flex-direction:column;gap:14px}
    .card{background:#fff;border:1px solid #e8eef7;border-radius:18px;box-shadow:0 8px 26px rgba(15,58,93,.06)}
    .seg{display:flex;gap:8px;background:transparent;padding:0;border:none;box-shadow:none}
    .seg-btn{
      flex:1;border:1px solid #dbe7f5;background:#fff;cursor:pointer;
      font-family:'Nunito',sans-serif;font-size:13px;font-weight:800;
      color:#47607f;padding:10px 12px;border-radius:999px;min-height:44px;
      box-shadow:0 3px 10px rgba(15,58,93,.04);transition:all .18s ease;
    }
    .seg-btn.on{background:var(--c-primary);color:#fff;border-color:var(--c-primary);box-shadow:0 8px 20px rgba(0,100,250,.3)}
    .seg-btn:focus-visible{outline:2px solid var(--c-primary);outline-offset:2px}
    .total-card{display:flex;flex-direction:column;gap:5px;padding:18px;background:var(--c-green-bg);border-color:#d8ecd8;color:var(--c-green-dark)}
    .total-card .money{font-size:30px;line-height:1.1}
    .lbl{font-size:12px;font-weight:800;color:#486581;letter-spacing:.02em;text-transform:uppercase}
    .total-card .lbl{color:#07797A}
    .count{font-size:11px;color:#6b84a3;font-weight:600}
    .money{font-variant-numeric:tabular-nums;font-weight:900}
    .ing-card{overflow:hidden}
    .ing-head{display:flex;justify-content:space-between;align-items:center;gap:12px;width:100%;min-height:56px;text-align:left;background:#fff;border:none;padding:12px 16px;cursor:pointer;font-family:inherit;color:var(--c-green-dark);border-bottom:1px solid #eef3f9}
    .ing-head:focus-visible{outline:2px solid var(--c-green);outline-offset:-2px}
    .head-left{display:flex;align-items:center;gap:10px;min-width:0}
    .head-left ion-icon{font-size:18px;color:var(--c-green-dark)}
    .ing-body{padding:16px;display:flex;flex-direction:column;gap:10px;background:#fff}
    .ing-list{display:grid;grid-template-columns:1fr 120px 36px;gap:8px;align-items:center}
    .cell-inp{width:100%;border:1px solid #cfe0ff;border-radius:12px;padding:9px 10px;font-size:13px;background:#fbfdff;font-family:inherit;color:var(--c-text);font-weight:600}
    .cell-inp.num{text-align:right;font-variant-numeric:tabular-nums}
    .cell-inp:focus-visible{outline:none;border-color:var(--c-primary);box-shadow:0 0 0 3px rgba(0,100,250,.12)}
    .icon-btn{display:flex;align-items:center;justify-content:center;width:36px;height:36px;border:none;background:#f4f7fb;color:#7a93b5;cursor:pointer;border-radius:12px;transition:all .15s ease}
    .icon-btn ion-icon{font-size:16px}
    .icon-btn:hover{background:#fee2e2;color:#dc2626}
    .icon-btn:focus-visible{outline:2px solid #dc2626;outline-offset:1px}
    .empty{padding:14px;text-align:center;color:#6b84a3;font-size:13px;background:#f4f9ff;border-radius:14px;font-weight:600;border:1px dashed #bfd7f5}
    .add-ing{display:flex;justify-content:flex-end;margin-top:4px}
    @media (max-width:520px){
      .ing-list{grid-template-columns:1fr 100px 34px}
      .icon-btn{width:34px;height:34px}
      .total-card .money{font-size:26px}
    }
    @media (prefers-reduced-motion: reduce){
      .seg-btn,.icon-btn{transition:none}
    }
    `]
})
export class IngresosPage {
  private budget = inject(BudgetService);
  private modalCtrl = inject(ModalController);
  private destroyRef = inject(DestroyRef);

  quincenaActual: FiltroQuincena = 'TODO';
  collapsed: Record<string, boolean> = { Q1: false, Q2: false, MEN: false };
  private manualToggle = new Set<string>();

  constructor() {
    addIcons({ addOutline, chevronDownOutline, chevronUpOutline, trashOutline });
    this.quincenaActual = this.budget.getQuincenaActual();
    this.periodoValido();
    this.applyAutoCollapse();
    this.budget.presupuesto$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.applyAutoCollapse());
    this.budget.config$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => { this.periodoValido(); this.applyAutoCollapse(); });
    this.budget.quincenaActual$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((q: any) => { this.quincenaActual = q; this.applyAutoCollapse(); });
  }

  ionViewWillEnter() {
    this.quincenaActual = this.budget.getQuincenaActual();
    this.periodoValido();
    this.applyAutoCollapse();
  }

  get esMensual(): boolean { return this.budget.getConfig().tipoPago === 'mensual'; }
  get filteredQs(): string[] {
    if (this.quincenaActual !== 'TODO') return [this.quincenaActual];
    return this.budget.periodos();
  }
  get ingresoTotalGlobal(): number {
    return this.filteredQs.reduce((s, q) => s + this.getIngresoTotal(q), 0);
  }

  getIngresos(q: string) { return this.budget.getIngresos(q as any); }
  getIngresoTotal(q: string) { return this.budget.getIngresoTotal(q as any); }
  etiquetaQuincena(q: string): string {
    if (q === 'Q1') return 'Quincena 1';
    if (q === 'Q2') return 'Quincena 2';
    return 'Todo el mes';
  }
  isIngCollapsed(q: string) { return !!this.collapsed[q]; }
  toggleIngCollapse(q: string) { this.collapsed[q] = !this.collapsed[q]; if (this.collapsed[q]) this.manualToggle.add(q); else this.manualToggle.delete(q); }
  setActual(q: FiltroQuincena) { this.budget.setQuincenaActual(q); this.manualToggle.clear(); this.applyAutoCollapse(); }

  async openAddIngresoModal(q: any) {
    const modal = await this.modalCtrl.create({ component: IngresoModalComponent, cssClass: 'dialog-modal' });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data && data.concepto) this.budget.addIngreso(q, data.concepto, Number(data.monto));
  }
  saveIngresoMonto(q: any, ing: any) { this.budget.updateIngreso(q, ing.id, { monto: Number(ing.monto) || 0 }); }
  saveIngresoConcepto(q: any, ing: any) { this.budget.updateIngreso(q, ing.id, { concepto: ing.concepto }); }
  removeIngreso(q: any, id: string) { this.budget.removeIngreso(q, id); }

  private periodoValido() {
    if (this.quincenaActual !== 'TODO' && !this.budget.periodos().includes(this.quincenaActual as any)) {
      this.quincenaActual = 'TODO';
      this.budget.setQuincenaActual('TODO');
    }
  }
  private applyAutoCollapse() {
    const abiertos: Record<string, boolean> = {};
    for (const q of this.budget.periodos()) abiertos[q] = this.quincenaActual === 'TODO' ? false : this.quincenaActual !== q;
    if (this.quincenaActual !== 'TODO') {
      for (const q of this.budget.periodos()) {
        if (this.manualToggle.has(q)) abiertos[q] = !!this.collapsed[q];
      }
    }
    this.collapsed = abiertos;
  }
}
