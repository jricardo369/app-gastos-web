import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonIcon, IonButton, IonItem, IonInput, IonSelect, IonSelectOption, IonText, ModalController, IonButtons, AlertController } from '@ionic/angular';
import { CurrencyPipe } from '@angular/common';
import { BudgetService } from '../../core/services/budget.service';
import { Gasto, Imprevisto, Quincena } from '../../core/models/budget.model';
import { addIcons } from 'ionicons';
import { chevronDownOutline, chevronUpOutline, addOutline, chevronForwardOutline, trashOutline, walletOutline, alertCircleOutline, calendarOutline } from 'ionicons/icons';

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

      <!-- 1. Periodo. Cada opción muestra cuántos gastos de esa quincena
           ya están pagados, para poder comparar sin cambiar de pestaña. -->
      <div class="seg" role="group" aria-label="Periodo">
        <button type="button" class="seg-btn" [class.on]="tab==='Q1'" [attr.aria-pressed]="tab==='Q1'" (click)="tab='Q1'">
          <span>Quincena 1</span>
          <span class="seg-num">{{ pagados('Q1') }}/{{ total('Q1') }} pagados</span>
        </button>
        <button type="button" class="seg-btn" [class.on]="tab==='Q2'" [attr.aria-pressed]="tab==='Q2'" (click)="tab='Q2'">
          <span>Quincena 2</span>
          <span class="seg-num">{{ pagados('Q2') }}/{{ total('Q2') }} pagados</span>
        </button>
      </div>

      @for (q of [tab]; track q) {
        <!-- 2. Cuanto va: una cifra grande, la barra y el desglose en tres.
             El verde y el ambar son semanticos: verde = ya pagado,
             ambar = todavia falta. -->
        <section class="usage">
          <div class="usage-top">
            <div class="usage-main">
              <span class="lbl">{{ q === 'Q1' ? 'Quincena 1' : 'Quincena 2' }} · pagado de lo previsto</span>
              <strong class="usage-pct">{{ pct(q) }}%</strong>
            </div>
            <div class="usage-side">
              <span class="lbl">Falta por pagar</span>
              <strong class="money faltante">{{ faltante(q) | currency:'MXN':'symbol':'1.0-0' }}</strong>
            </div>
          </div>
          <div class="progress" role="progressbar" [attr.aria-valuenow]="pct(q)" aria-valuemin="0" aria-valuemax="100"
               [attr.aria-label]="'Avance de pagos de la ' + (q === 'Q1' ? 'quincena 1' : 'quincena 2')">
            <div [style.width.%]="pct(q)"></div>
          </div>
          <div class="usage-stats">
            <div><span class="lbl">Previsto</span><b class="money">{{ previstos(q) | currency:'MXN':'symbol':'1.0-0' }}</b></div>
            <div><span class="lbl">Pagado</span><b class="money ok">{{ reales(q) | currency:'MXN':'symbol':'1.0-0' }}</b></div>
            <div><span class="lbl">Falta</span><b class="money warn">{{ faltante(q) | currency:'MXN':'symbol':'1.0-0' }}</b></div>
          </div>
        </section>

        <!-- 3. Gastos previstos, con check para marcar pagado -->
        <section class="panel">
          <div class="panel-head">
            <div class="panel-title">
              <span class="lbl">Gastos previstos</span>
              <span class="count">{{ pendientes(q) }} por pagar</span>
            </div>
            <ion-button size="small" (click)="openAddGastoModal(q)">
              <ion-icon slot="start" name="add-outline" aria-hidden="true"></ion-icon>Agregar
            </ion-button>
          </div>
          <div class="list">
            @for (g of gastos(q); track g.id) {
              <!-- La fila abre la edicion. El check, el borrado y el chevron
                   detienen la propagacion para que no abran el modal. -->
              <div class="li li-edit" [class.paid]="g.pagado" (click)="openEditGastoModal(g)"
                   role="button" tabindex="0" [attr.aria-label]="'Editar ' + g.descripcion"
                   (keydown.enter)="openEditGastoModal(g)">
                <span class="check-wrap">
                  <input class="li-check" type="checkbox" [checked]="g.pagado" (change)="toggleGasto(g.id); $event.stopPropagation()"
                         [attr.aria-label]="'Marcar ' + g.descripcion + ' como pagado'" (click)="$event.stopPropagation()">
                </span>
                <div class="li-body">
                  <span class="li-title">{{ g.descripcion }}</span>
                  <span class="li-cat"><span class="dot" [style.background]="catColor(g.categoriaId)"></span>{{ catName(g.categoriaId) }}</span>
                </div>
                <span class="li-amount" [class.ok]="g.pagado">{{ g.previsto | currency:'MXN':'symbol':'1.0-0' }}</span>
                <ion-icon class="li-chev" name="chevron-forward-outline" aria-hidden="true"></ion-icon>
                <button type="button" class="del" (click)="confirmDeleteGasto(g); $event.stopPropagation()" [attr.aria-label]="'Eliminar ' + g.descripcion">
                  <ion-icon name="trash-outline" aria-hidden="true"></ion-icon>
                </button>
              </div>
            }
            @if (gastos(q).length === 0) {
              <div class="empty">
                <ion-icon name="wallet-outline" aria-hidden="true"></ion-icon>
                <p>Todavía no hay gastos previstos en esta quincena</p>
                <ion-button size="small" fill="outline" (click)="openAddGastoModal(q)">Agregar gasto</ion-button>
              </div>
            }
          </div>
        </section>

        <!-- 4. Imprevistos -->
        <section class="panel">
          <div class="panel-head">
            <div class="panel-title">
              <span class="lbl">Imprevistos</span>
              <span class="count">{{ imprevistos(q).length }} este periodo</span>
            </div>
            <span class="money">{{ impTotal(q) | currency:'MXN':'symbol':'1.0-0' }}</span>
          </div>
          <div class="list">
            @for (i of imprevistos(q); track i.id){
              <div class="li">
                <div class="li-body">
                  <span class="li-title">{{ i.descripcion }}</span>
                  <span class="li-sub"><ion-icon name="calendar-outline" aria-hidden="true"></ion-icon>{{ i.fecha }}</span>
                </div>
                <span class="li-amount">{{ i.importe | currency:'MXN':'symbol':'1.0-0' }}</span>
                <button type="button" class="del" (click)="confirmDeleteImp(i)" [attr.aria-label]="'Eliminar ' + i.descripcion">
                  <ion-icon name="trash-outline" aria-hidden="true"></ion-icon>
                </button>
              </div>
            }
            @if(imprevistos(q).length===0){
              <div class="empty">
                <ion-icon name="alert-circle-outline" aria-hidden="true"></ion-icon>
                <p>Sin imprevistos registrados</p>
              </div>
            }
          </div>
          <div class="add-row">
            <ion-button size="small" fill="clear" (click)="openAddImpModal(q)">
              <ion-icon slot="start" name="add-outline" aria-hidden="true"></ion-icon>Agregar imprevisto
            </ion-button>
          </div>
        </section>

        <!-- 5. Reparto por categoria. Ordenado de mayor a menor y con una
             barra por categoria: se ve de un vistazo donde se va el dinero. -->
        <section class="card pad-card" [class.collapsed]="isPrevistosCollapsed(q)">
          <button class="card-title" (click)="togglePrevistos(q)" [attr.aria-expanded]="!isPrevistosCollapsed(q)">
            <span><ion-icon [name]="isPrevistosCollapsed(q) ? 'chevron-down-outline' : 'chevron-up-outline'" aria-hidden="true"></ion-icon> Previsto por categoría</span>
            <span class="money">{{ previstos(q) | currency:'MXN':'symbol':'1.0-0' }}</span>
          </button>
          @if(!isPrevistosCollapsed(q)){
          <div class="summary">
            @for (b of breakdown(q); track b.categoria.id){
              <div class="brow">
                <div class="brow-head">
                  <span class="brow-label"><span class="dot" [style.background]="b.categoria.color"></span>{{b.categoria.nombre}}</span>
                  <span class="money">{{b.total | currency:'MXN':'symbol':'1.0-0'}}</span>
                </div>
                <div class="bar" aria-hidden="true"><div class="bar-fill" [style.width.%]="share(b.total, q)" [style.background]="b.categoria.color"></div></div>
              </div>
            }
          </div>
          }
        </section>
        <section class="card pad-card" [class.collapsed]="isRealesCollapsed(q)">
          <button class="card-title" (click)="toggleReales(q)" [attr.aria-expanded]="!isRealesCollapsed(q)">
            <span><ion-icon [name]="isRealesCollapsed(q) ? 'chevron-down-outline' : 'chevron-up-outline'" aria-hidden="true"></ion-icon> Pagado por categoría</span>
            <span class="money">{{ reales(q) | currency:'MXN':'symbol':'1.0-0' }}</span>
          </button>
          @if(!isRealesCollapsed(q)){
          <div class="summary">
            @for (b of breakdown(q); track b.categoria.id){
              <div class="brow">
                <div class="brow-head">
                  <span class="brow-label"><span class="dot" [style.background]="b.categoria.color"></span>{{b.categoria.nombre}}</span>
                  <span class="money">{{ realesCat(q,b.categoria.id) | currency:'MXN':'symbol':'1.0-0'}}</span>
                </div>
                <div class="bar" aria-hidden="true"><div class="bar-fill" [style.width.%]="share(realesCat(q,b.categoria.id), q)" [style.background]="b.categoria.color"></div></div>
              </div>
            }
          </div>
          }
        </section>
        }
    </div>
  </ion-content>
  `,
  styles: [`
  .bg{--background:#eef2f7}
  .container{padding:var(--sp-3);max-width:900px;margin:0 auto;display:flex;flex-direction:column;gap:var(--sp-3)}

  /* ------------------------------------------------------------------
     Periodo. Ademas del nombre, cada opcion dice cuantos gastos de esa
     quincena ya estan pagados: se compara sin tener que cambiar de una.
     ------------------------------------------------------------------ */
  .seg{display:flex;gap:var(--sp-1);background:var(--surface-sunken);padding:4px;border-radius:var(--radius-pill);border:1px solid var(--border-subtle)}
  .seg-btn{
    flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:1px;
    min-height:44px;padding:8px 10px;border:none;background:transparent;cursor:pointer;
    font-family:'Nunito', sans-serif;font-size:13px;font-weight:700;color:var(--text-muted);
    border-radius:var(--radius-pill);
  }
  .seg-btn.on{background:var(--surface);color:var(--text-strong);box-shadow:var(--shadow)}
  .seg-btn:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
  .seg-num{font-family:'Nunito', sans-serif;font-size:10px;font-weight:700;letter-spacing:.02em;
    color:var(--text-faint);font-variant-numeric:tabular-nums}
  .seg-btn.on .seg-num{color:var(--text-muted)}

  /* ------------------------------------------------------------------
     Cuanto va. Una sola cifra grande manda, la barra la acompaña y las
     tres cajas de abajo dan el detalle sin tener que sumar de memoria.
     ------------------------------------------------------------------ */
  .usage{background:var(--surface);border-radius:var(--radius-lg);padding:var(--sp-4);
    box-shadow:var(--shadow);border:1px solid var(--border)}
  .usage-top{display:flex;justify-content:space-between;align-items:flex-start;gap:var(--sp-3)}
  .usage-main{min-width:0}
  .usage-pct{display:block;margin-top:2px;font-size:34px;line-height:1.05;font-weight:800;
    color:var(--text-strong);font-variant-numeric:tabular-nums}
  .usage-side{text-align:right;flex:none}
  .usage-side .money{display:block;margin-top:2px;font-size:15px}
  .faltante{color:var(--warn)}
  .usage .progress{margin-top:var(--sp-4)}
  .usage-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:var(--sp-2);margin-top:var(--sp-4)}
  .usage-stats > div{display:flex;flex-direction:column;gap:2px;padding:var(--sp-2) var(--sp-3);
    background:var(--surface-sunken);border-radius:var(--radius)}
  .usage-stats b{font-size:14px;font-weight:800;color:var(--text-strong);font-variant-numeric:tabular-nums}
  /* Verde = ya pagado, ambar = todavia falta. Solo informacion, nunca adorno. */
  .money.ok{color:var(--ok)}
  .money.warn{color:var(--warn)}

  .panel{background:var(--surface);border-radius:var(--radius-lg);box-shadow:var(--shadow);
    border:1px solid var(--border);overflow:hidden}
  .panel-head{display:flex;justify-content:space-between;align-items:center;gap:var(--sp-2);
    padding:var(--sp-3) var(--sp-4);border-bottom:1px solid var(--border-subtle);flex-wrap:wrap}
  .panel-title{display:flex;flex-direction:column;gap:1px;min-width:0}
  .count{font-family:'Nunito', sans-serif;font-size:11px;font-weight:700;color:var(--text-faint)}
  /* Botones de accion de la cabecera: objetivo tactil comodo */
  .panel-head ion-button{margin:0;min-height:36px}

  /* Filas tipo lista en vez de tabla de 4 columnas.
     Las columnas fijas de 90px se desbordaban en pantalla angosta; con
     grid flexible el monto queda siempre a la derecha sin importar el ancho. */
  .list{display:flex;flex-direction:column}
  .li{display:flex;align-items:center;gap:var(--sp-3);padding:var(--sp-3) var(--sp-4);
    min-height:56px;border-bottom:1px solid var(--border-subtle)}
  .li:last-child{border-bottom:none}
  /* Fila que abre la edicion del gasto */
  .li-edit{cursor:pointer;transition:background .15s ease}
  .li-edit:hover{background:var(--surface-sunken)}
  .li-edit:focus-visible{outline:2px solid var(--accent);outline-offset:-2px}
  /* El area de toque del check es mas grande que el cuadro mismo */
  .check-wrap{flex:none;display:flex;align-items:center;justify-content:center;
    min-width:32px;min-height:32px;margin-left:calc(var(--sp-2) * -1)}
  .li-check{width:20px;height:20px;accent-color:var(--positive);cursor:pointer}
  .li.paid{background:var(--surface-sunken)}
  .li.paid .li-title{text-decoration:line-through;color:var(--text-faint)}
  .li-body{display:flex;flex-direction:column;gap:3px;flex:1;min-width:0}
  .li-title{font-size:14px;font-weight:600;color:var(--text-body);overflow-wrap:anywhere}
  .li-sub{display:flex;align-items:center;gap:4px;font-size:11px;color:var(--text-faint)}
  .li-sub ion-icon{font-size:12px}
  /* Categoria como punto de color + texto: el chip con texto blanco sobre
     pastel no tenia contraste suficiente para leerse. */
  .li-cat{display:flex;align-items:center;gap:6px;font-family:'Nunito', sans-serif;
    font-size:11px;font-weight:700;color:var(--text-muted)}
  .dot{width:8px;height:8px;border-radius:50%;flex:none}
  .li-amount{font-size:14px;font-weight:800;color:var(--text-strong);white-space:nowrap;
    font-variant-numeric:tabular-nums}
  .li-amount.ok{color:var(--ok)}
  /* Flecha: indica que la fila se puede editar */
  .li-chev{flex:none;font-size:16px;color:var(--text-faint)}
  .del{display:flex;align-items:center;justify-content:center;flex:none;width:36px;height:36px;
    border:none;background:transparent;color:var(--text-faint);cursor:pointer;
    border-radius:var(--radius-sm);transition:background .15s ease, color .15s ease}
  .del ion-icon{font-size:16px}
  .del:hover{background:var(--bad-bg);color:var(--bad)}
  .del:focus-visible{outline:2px solid var(--bad);outline-offset:1px}

  /* Estado vacio con accion: antes solo era una linea de texto. */
  .empty{display:flex;flex-direction:column;align-items:center;gap:var(--sp-2);
    padding:var(--sp-6) var(--sp-4);text-align:center}
  .empty ion-icon{font-size:26px;color:var(--text-faint)}
  .empty p{margin:0;font-size:13px;color:var(--text-faint)}
  .empty ion-button{margin:var(--sp-1) 0 0;min-height:36px}

  .add-row{display:flex;justify-content:flex-end;padding:var(--sp-2) var(--sp-3)}
  .add-row ion-button{margin:0;min-height:36px}

  .card{background:var(--surface);border-radius:var(--radius-lg);box-shadow:var(--shadow);
    border:1px solid var(--border);overflow:hidden}
  .pad-card{padding:var(--sp-4)}
  .card-title{width:100%;display:flex;justify-content:space-between;align-items:center;gap:var(--sp-2);
    text-align:left;background:none;border:none;padding:0;margin:0 0 var(--sp-3);
    font-family:inherit;font-size:14px;font-weight:700;color:var(--text-strong);cursor:pointer}
  .card-title > span:first-child{display:flex;align-items:center;gap:6px}
  .card-title:focus-visible{outline:2px solid var(--accent);outline-offset:2px}

  /* Reparto por categoria. Cada fila trae su barra para ver de un vistazo
     a donde se va el dinero, no solo numeros sueltos. */
  .summary{display:grid;gap:var(--sp-3)}
  .brow-head{display:flex;justify-content:space-between;align-items:center;gap:var(--sp-2);font-size:13px}
  .brow-label{display:flex;align-items:center;gap:6px;font-weight:600;color:var(--text-body);min-width:0}
  .bar{height:6px;background:var(--surface-sunken);border-radius:var(--radius-pill);overflow:hidden;margin-top:6px}
  .bar-fill{height:100%;border-radius:var(--radius-pill);transition:width .25s ease}

  @media (prefers-reduced-motion: reduce){
    .li-edit,.del,.bar-fill{transition:none}
  }
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
  constructor(public budget: BudgetService, private modalCtrl: ModalController, private alertCtrl: AlertController){
    addIcons({ chevronDownOutline, chevronUpOutline, addOutline, chevronForwardOutline, trashOutline, walletOutline, alertCircleOutline, calendarOutline });
  }
  gastos(q: Quincena) { return this.budget.getGastos(q); }
  imprevistos(q: Quincena) { return this.budget.getImprevistos(q); }
  previstos(q: Quincena) { return this.budget.resumenQuincena(q).previstos; }
  reales(q: Quincena) { return this.budget.resumenQuincena(q).reales; }
  faltante(q: Quincena) { return this.budget.resumenQuincena(q).pendiente; }
  impTotal(q: Quincena) { return this.budget.getImprevistos(q).reduce((s, i) => s + i.importe, 0); }
  pct(q: Quincena) { const r = this.budget.resumenQuincena(q); return r.previstos ? Math.round((r.reales / r.previstos) * 100) : 0; }
  /** Total de gastos de la quincena, para el contador del segmento. */
  total(q: Quincena) { return this.budget.getGastos(q).length; }
  /** Cuantos ya estan marcados como pagados. */
  pagados(q: Quincena) { return this.budget.getGastos(q).filter(g => g.pagado).length; }
  /** Los que faltan por pagar: es la lista de pendientes real. */
  pendientes(q: Quincena) { return this.total(q) - this.pagados(q); }
  breakdown(q: Quincena) { return [...this.budget.breakdownCategoria(q)].sort((a, b) => b.total - a.total); }
  /** Cuanto representa un monto dentro del total de la quincena. */
  share(monto: number, q: Quincena) { const p = this.previstos(q); return p ? Math.round((monto / p) * 100) : 0; }
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

  /**
   * Borrar es destructivo y estaba a un clic de distancia del tap sobre la
   * fila: por eso pide confirmacion y dice que se pierde exactamente.
   */
  async confirmDeleteGasto(g: Gasto) {
    const alert = await this.alertCtrl.create({
      header: '¿Eliminar gasto?',
      message: `Se borra "${g.descripcion}" de esta quincena. No se puede deshacer.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', role: 'destructive', handler: () => this.budget.removeGasto(g.id) },
      ],
    });
    await alert.present();
  }

  /** Misma confirmacion para los imprevistos. */
  async confirmDeleteImp(i: Imprevisto) {
    const alert = await this.alertCtrl.create({
      header: '¿Eliminar imprevisto?',
      message: `Se borra "${i.descripcion}" del registro de esta quincena. No se puede deshacer.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', role: 'destructive', handler: () => this.budget.removeImprevisto(i.id) },
      ],
    });
    await alert.present();
  }
}
