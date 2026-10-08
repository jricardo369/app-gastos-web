import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonIcon, IonButton, IonItem, IonInput, IonSelect, IonSelectOption, IonText, ModalController, IonButtons } from '@ionic/angular';
import { CurrencyPipe } from '@angular/common';
import { BudgetService } from '../../core/services/budget.service';
import { Gasto, Imprevisto, Quincena } from '../../core/models/budget.model';
import { addIcons } from 'ionicons';
import { chevronDownOutline, chevronUpOutline } from 'ionicons/icons';

@Component({
  selector: 'app-gasto-modal',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonInput, IonSelect, IonSelectOption, IonText, IonButton, IonButtons, FormsModule, CurrencyPipe],
  template: `
  <ion-header><ion-toolbar><ion-title>{{ isEdit ? 'Editar gasto' : 'Nuevo gasto' }}</ion-title><ion-buttons slot="end"><ion-button (click)="cancel()">Cerrar</ion-button></ion-buttons></ion-toolbar></ion-header>
  <ion-content class="ion-padding">
    <div class="field">
      <ion-select label="Categoría" labelPlacement="stacked" [(ngModel)]="categoriaId">
        <ion-select-option value="hogar">Hogar</ion-select-option><ion-select-option value="escuelas">Escuelas</ion-select-option><ion-select-option value="carro">Carro</ion-select-option><ion-select-option value="ejercicio">Ejercicio</ion-select-option><ion-select-option value="credito">Trj crédito</ion-select-option><ion-select-option value="lamarina">La Marina</ion-select-option><ion-select-option value="adic">Adic.</ion-select-option><ion-select-option value="impv">Impv.</ion-select-option><ion-select-option value="ahorro">Ahorro</ion-select-option><ion-select-option value="ropa">Ropa</ion-select-option>
      </ion-select>
      @if (isEdit && cambioCategoria) {
        <span class="antes">Antes: {{ nombreCategoria(originalCategoriaId) }}</span>
      }
    </div>

    <div class="field">
      <ion-input label="Descripción" labelPlacement="stacked" [(ngModel)]="descripcion" placeholder="Ej. Gasolina"></ion-input>
      @if (isEdit && cambioDescripcion) {
        <span class="antes">Antes: {{ originalDescripcion }}</span>
      }
    </div>

    <div class="field">
      <ion-input label="Previsto ($)" labelPlacement="stacked" type="number" [(ngModel)]="previsto"></ion-input>
      @if (isEdit && cambioPrevisto) {
        <span class="antes">Antes: {{ originalPrevisto | currency:'MXN':'symbol':'1.0-0' }}</span>
      }
    </div>

    <!-- Resumen de todo lo que va a cambiar, para verlo antes de guardar -->
    @if (isEdit && hayCambios) {
      <div class="diff">
        <span class="lbl">Vas a cambiar</span>
        @if (cambioDescripcion) { <div><span>Descripción</span><s>{{ originalDescripcion }}</s> <b>{{ descripcion }}</b></div> }
        @if (cambioPrevisto) { <div><span>Monto</span><s>{{ originalPrevisto | currency:'MXN':'symbol':'1.0-0' }}</s> <b>{{ previsto | currency:'MXN':'symbol':'1.0-0' }}</b></div> }
        @if (cambioCategoria) { <div><span>Categoría</span><s>{{ nombreCategoria(originalCategoriaId) }}</s> <b>{{ nombreCategoria(categoriaId) }}</b></div> }
      </div>
    }

    @if(error){ <ion-text color="danger" class="err">{{error}}</ion-text> }
    <ion-button expand="block" style="margin-top:20px" (click)="save()" [disabled]="isEdit && !hayCambios">
      {{ isEdit ? (hayCambios ? 'Guardar cambios' : 'Sin cambios') : 'Agregar' }}
    </ion-button>
  </ion-content>
  `,
  styles: [`
  .err{display:block;margin:10px 0 0;font-size:13px}
  .field{margin-bottom:6px}
  .antes{display:block;font-size:11px;color:var(--text-faint);padding:2px 16px 0;text-decoration:line-through}
  /* Resumen de cambios: tachado el valor viejo, en negrita el nuevo */
  .diff{background:var(--surface-sunken);border:1px solid var(--border);border-radius:12px;
    padding:12px;margin-top:8px}
  .diff .lbl{display:block;margin-bottom:6px}
  .diff > div{display:flex;align-items:baseline;gap:6px;font-size:13px;padding:3px 0;flex-wrap:wrap}
  .diff > div > span{color:var(--text-muted);min-width:82px}
  .diff s{color:var(--text-faint)}
  .diff b{color:var(--text-strong)}
  `],
})
export class GastoModalComponent {
  @Input() categoriaId: string = 'hogar';
  @Input() descripcion: string = '';
  @Input() previsto: any = null;
  /** En modo edicion devuelve update:true para que la pagina no duplique el gasto. */
  @Input() isEdit: boolean = false;
  /** Valores con los que abrio el modal, para poder mostrar el "antes". */
  @Input() originalCategoriaId: string = '';
  @Input() originalDescripcion: string = '';
  @Input() originalPrevisto: any = null;
  error = '';

  private readonly CAT_NOMBRES: Record<string, string> = {
    hogar: 'Hogar', escuelas: 'Escuelas', carro: 'Carro', ejercicio: 'Ejercicio',
    credito: 'Trj crédito', lamarina: 'La Marina', adic: 'Adic.', impv: 'Impv.',
    ahorro: 'Ahorro', ropa: 'Ropa',
  };

  get cambioDescripcion(): boolean { return this.descripcion.trim() !== this.originalDescripcion; }
  get cambioPrevisto(): boolean { return Number(this.previsto) !== Number(this.originalPrevisto); }
  get cambioCategoria(): boolean { return this.categoriaId !== this.originalCategoriaId; }
  get hayCambios(): boolean { return this.cambioDescripcion || this.cambioPrevisto || this.cambioCategoria; }

  nombreCategoria(id: string): string { return this.CAT_NOMBRES[id] || id || '-'; }

  constructor(private modalCtrl: ModalController) {}
  cancel(){ this.modalCtrl.dismiss(null); }
  save(){
    if (!this.descripcion?.trim()) { this.error = 'Poné una descripción'; return; }
    if (this.previsto === null || this.previsto === '' || Number(this.previsto) < 0) { this.error = 'Poné un monto válido'; return; }
    if (this.isEdit && !this.hayCambios) { this.error = 'No cambiaste nada'; return; }
    this.modalCtrl.dismiss({
      update: this.isEdit,
      categoriaId: this.categoriaId,
      descripcion: this.descripcion.trim(),
      previsto: Number(this.previsto),
    });
  }
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
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonIcon, IonButton, FormsModule, CurrencyPipe],
  template: `
  <ion-header><ion-toolbar><ion-title>Gastos</ion-title></ion-toolbar></ion-header>
  <ion-content class="bg">
    <div class="container">

      <!-- 1. Periodo -->
      <div class="seg" role="group" aria-label="Periodo">
        <button class="seg-btn" [class.on]="tab==='Q1'" (click)="tab='Q1'">Quincena 1</button>
        <button class="seg-btn" [class.on]="tab==='Q2'" (click)="tab='Q2'">Quincena 2</button>
      </div>

      @for (q of [tab]; track q) {
        <!-- 2. Cuanto va: previsto vs pagado vs lo que falta -->
        <div class="card usage">
          <div class="usage-head">
            <span class="lbl">{{ q === 'Q1' ? 'Quincena 1' : 'Quincena 2' }}</span>
            <span class="usage-pct num">{{ pct(q) }}%</span>
          </div>
          <div class="progress"><div [style.width.%]="pct(q)"></div></div>
          <div class="usage-foot">
            <span>{{ reales(q) | currency:'MXN':'symbol':'1.0-0' }} de {{ previstos(q) | currency:'MXN':'symbol':'1.0-0' }}</span>
            <span class="usage-rest">faltan {{ faltante(q) | currency:'MXN':'symbol':'1.0-0' }}</span>
          </div>
        </div>

        <!-- 3. Gastos previstos, con check para marcar pagado -->
        <div class="panel">
          <div class="panel-head">
            <span class="lbl">Gastos previstos</span>
            <ion-button size="small" fill="outline" (click)="openAddGastoModal(q)">Agregar</ion-button>
          </div>
          <div class="list">
            @for (g of gastos(q); track g.id) {
              <!-- La fila abre la edicion. El check y el boton de borrar
                   detienen la propagacion para que no abran el modal. -->
              <div class="li li-edit" [class.paid]="g.pagado" (click)="openEditGastoModal(g)"
                   role="button" tabindex="0" [attr.aria-label]="'Editar ' + g.descripcion"
                   (keydown.enter)="openEditGastoModal(g)">
                <input class="li-check" type="checkbox" [checked]="g.pagado" (change)="toggleGasto(g.id); $event.stopPropagation()"
                       [attr.aria-label]="'Marcar ' + g.descripcion + ' como pagado'" (click)="$event.stopPropagation()">
                <div class="li-body">
                  <span class="li-title">{{ g.descripcion }}</span>
                  <span class="chip sm" [style.background]="catColor(g.categoriaId)">{{ catName(g.categoriaId) }}</span>
                </div>
                <span class="li-amount num">{{ g.previsto | currency:'MXN':'symbol':'1.0-0' }}</span>
                <button class="del" (click)="removeGasto(g.id); $event.stopPropagation()" [attr.aria-label]="'Eliminar ' + g.descripcion">&times;</button>
              </div>
            }
            @if (gastos(q).length === 0) {
              <div class="empty">Todavía no hay gastos previstos en esta quincena</div>
            }
          </div>
        </div>

        <!-- 4. Imprevistos -->
        <div class="panel">
          <div class="panel-head">
            <span class="lbl">Imprevistos</span>
            <span class="num money">{{ impTotal(q) | currency:'MXN':'symbol':'1.0-0' }}</span>
          </div>
          <div class="list">
            @for (i of imprevistos(q); track i.id){
              <div class="li">
                <div class="li-body">
                  <span class="li-title">{{ i.descripcion }}</span>
                  <span class="li-sub">{{ i.fecha }}</span>
                </div>
                <span class="li-amount num">{{ i.importe | currency:'MXN':'symbol':'1.0-0' }}</span>
                <button class="del" (click)="removeImp(i.id)" [attr.aria-label]="'Eliminar ' + i.descripcion">&times;</button>
              </div>
            }
            @if(imprevistos(q).length===0){ <div class="empty">Sin imprevistos</div> }
          </div>
          <div class="add-row">
            <ion-button size="small" fill="clear" (click)="openAddImpModal(q)">+ Agregar imprevisto</ion-button>
          </div>
        </div>

        <!-- 5. Reparto por categoria -->
        <div class="card pad-card" [class.collapsed]="isPrevistosCollapsed(q)">
          <button class="card-title sm clickable" (click)="togglePrevistos(q)" [attr.aria-expanded]="!isPrevistosCollapsed(q)">
            <span><ion-icon [name]="isPrevistosCollapsed(q) ? 'chevron-down-outline' : 'chevron-up-outline'"></ion-icon> Previsto por categoría</span>
            <span class="money">{{ previstos(q) | currency:'MXN':'symbol':'1.0-0' }}</span>
          </button>
          @if(!isPrevistosCollapsed(q)){
          <div class="summary single">
            @for (b of breakdown(q); track b.categoria.id){
              <div class="brow"><span class="chip sm" [style.background]="b.categoria.color">{{b.categoria.nombre}}</span><span class="num">{{b.total | currency:'MXN':'symbol':'1.0-0'}}</span></div>
            }
          </div>
          }
        </div>
        <div class="card pad-card" [class.collapsed]="isRealesCollapsed(q)">
          <button class="card-title sm clickable" (click)="toggleReales(q)" [attr.aria-expanded]="!isRealesCollapsed(q)">
            <span><ion-icon [name]="isRealesCollapsed(q) ? 'chevron-down-outline' : 'chevron-up-outline'"></ion-icon> Pagado por categoría</span>
            <span class="money">{{ reales(q) | currency:'MXN':'symbol':'1.0-0' }}</span>
          </button>
          @if(!isRealesCollapsed(q)){
          <div class="summary single">
            @for (b of breakdown(q); track b.categoria.id){
              <div class="brow"><span class="chip sm" [style.background]="b.categoria.color">{{b.categoria.nombre}}</span><span class="num">{{ realesCat(q,b.categoria.id) | currency:'MXN':'symbol':'1.0-0'}}</span></div>
            }
          </div>
          }
        </div>
        }
    </div>
  </ion-content>
  `,
  styles: [`
  .bg{--background:#eef2f7}
  .container{padding:var(--sp-3);max-width:900px;margin:0 auto;display:flex;flex-direction:column;gap:var(--sp-3)}

  .seg{display:flex;gap:2px;background:var(--surface-sunken);padding:3px;border-radius:var(--radius-pill)}
  .seg-btn{
    flex:1;border:none;background:transparent;cursor:pointer;font-family:inherit;
    font-size:13px;font-weight:700;color:var(--text-muted);
    padding:8px 10px;border-radius:var(--radius-pill);
  }
  .seg-btn.on{background:var(--surface);color:var(--text-strong);box-shadow:var(--shadow)}
  .seg-btn:focus-visible{outline:2px solid var(--accent);outline-offset:2px}

  .usage{background:var(--surface);border-radius:var(--radius-lg);padding:var(--sp-4);box-shadow:var(--shadow);border:1px solid var(--border)}
  .usage-head{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:var(--sp-2)}
  .usage-pct{font-size:15px;font-weight:700;color:var(--text-strong)}
  .usage-foot{display:flex;justify-content:space-between;gap:var(--sp-2);margin-top:var(--sp-2);font-size:12px;color:var(--text-muted);flex-wrap:wrap}

  .panel{background:var(--surface);border-radius:var(--radius-lg);box-shadow:var(--shadow);border:1px solid var(--border);overflow:hidden}
  .panel-head{display:flex;justify-content:space-between;align-items:center;gap:var(--sp-2);
    padding:var(--sp-3) var(--sp-4);border-bottom:1px solid var(--border-subtle)}

  /* Filas tipo lista en vez de tabla de 4 columnas.
     Las columnas fijas de 90px se desbordaban en pantalla angosta; con
     grid flexible el monto queda siempre a la derecha sin importar el ancho. */
  .list{display:flex;flex-direction:column}
  .li{display:flex;align-items:center;gap:var(--sp-3);padding:var(--sp-3) var(--sp-4);
    border-bottom:1px solid var(--border-subtle)}
  .li:last-child{border-bottom:none}
  /* Fila que abre la edicion del gasto */
  .li-edit{cursor:pointer}
  .li-edit:hover{background:var(--surface-sunken)}
  .li-edit:focus-visible{outline:2px solid var(--accent);outline-offset:-2px}
  .li-check{flex:none;width:20px;height:20px;accent-color:var(--positive);cursor:pointer}
  .li.paid .li-title{text-decoration:line-through;color:var(--text-faint)}
  .li.paid .li-amount{color:var(--text-faint)}
  .li-body{display:flex;flex-direction:column;gap:3px;flex:1;min-width:0}
  .li-title{font-size:14px;color:var(--text-body);overflow-wrap:anywhere}
  .li-sub{font-size:11px;color:var(--text-faint)}
  .li-amount{font-size:14px;font-weight:700;color:var(--text-strong);white-space:nowrap}
  .chip{border-radius:var(--radius-pill);padding:2px 8px;font-size:10px;font-weight:700;color:#fff;align-self:flex-start}
  .del{border:none;background:transparent;color:var(--text-faint);font-size:20px;cursor:pointer;
    line-height:1;width:32px;height:32px;border-radius:var(--radius-sm);flex:none}
  .del:hover{background:var(--bad-bg);color:var(--bad)}

  .add-row{display:flex;justify-content:flex-end;padding:var(--sp-2) var(--sp-3)}

  .card{background:var(--surface);border-radius:var(--radius-lg);box-shadow:var(--shadow);border:1px solid var(--border);overflow:hidden}
  .pad-card{padding:var(--sp-4)}
  .card-title{width:100%;text-align:left;background:none;border:none;padding:0;margin:0 0 var(--sp-3);
    font-family:inherit;font-size:14px;font-weight:700;color:var(--text-strong);cursor:pointer}
  .card-title.sm{display:flex;justify-content:space-between;align-items:center;gap:var(--sp-2)}
  .card-title.sm > span:first-child{display:flex;align-items:center;gap:6px}
  .card-title:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
  .summary{display:grid;gap:var(--sp-1)}
  .brow{display:flex;justify-content:space-between;align-items:center;gap:var(--sp-2);
    font-size:13px;padding:6px 0;border-bottom:1px solid var(--border-subtle)}
  .brow:last-child{border-bottom:none}
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
  /** Edita un gasto existente. Antes no habia forma: solo agregar y borrar. */
  async openEditGastoModal(g: Gasto) {
    const modal = await this.modalCtrl.create({
      component: GastoModalComponent,
      componentProps: {
        isEdit: true,
        categoriaId: g.categoriaId,
        descripcion: g.descripcion,
        previsto: g.previsto,
        // Se pasa el estado original aparte para que el modal pueda mostrar
        // el "antes" de cada campo y el resumen de lo que va a cambiar.
        originalCategoriaId: g.categoriaId,
        originalDescripcion: g.descripcion,
        originalPrevisto: g.previsto,
      },
      breakpoints: [0, 0.7], initialBreakpoint: 0.7, handle: true, cssClass: 'tc-70',
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (!data) return;
    this.budget.updateGasto(g.id, { categoriaId: data.categoriaId, descripcion: data.descripcion, previsto: data.previsto });
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
