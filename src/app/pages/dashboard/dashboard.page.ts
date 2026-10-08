import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonIcon, IonButton, IonInput, IonItem, IonButtons, ModalController } from '@ionic/angular';
import { CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { BudgetService } from '../../core/services/budget.service';
import { AuthService } from '../../core/services/auth.service';
import { addIcons } from 'ionicons';
import { chevronDownOutline, chevronUpOutline, logOutOutline } from 'ionicons/icons';

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
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonIcon, IonButton, IonButtons, IonInput, FormsModule, CurrencyPipe],
  template: `
  <ion-header class="hdr">
    <ion-toolbar>
      <ion-title>
        <div class="title-wrap">
          <span>Dashboard</span><small>{{today}}</small>
        </div>
      </ion-title>
      <ion-buttons slot="end">
        <ion-button fill="clear" (click)="logout()"><ion-icon name="log-out-outline"></ion-icon></ion-button>
      </ion-buttons>
    </ion-toolbar>
  </ion-header>

  <ion-content class="bg">
    <div class="container">

      <!-- 1. Selector de quincena: decide que muestra todo lo de abajo -->
      <div class="seg" role="group" aria-label="Periodo">
        <button class="seg-btn" [class.on]="quincenaActual==='TODO'" (click)="setActual('TODO')">Todo el mes</button>
        <button class="seg-btn" [class.on]="quincenaActual==='Q1'" (click)="setActual('Q1')">Quincena 1</button>
        <button class="seg-btn" [class.on]="quincenaActual==='Q2'" (click)="setActual('Q2')">Quincena 2</button>
      </div>

      <!-- 2. Veredicto: "lo que tengo" vs "lo que llevo gastado".
           Ojo: NO es ingresos - gastado. Falta el dineroTotal, que es el
           efectivo + vales + nomina que hay sobre la mesa. Sin ese termino
           el numero no responde si el gasto real se sostiene con lo que hay. -->
      <div class="verdict" [class.estado-sobra]="todoBienGlobal > 0" [class.estado-falta]="todoBienGlobal < 0" [class.estado-ok]="todoBienGlobal === 0">
        <div class="verdict-head">
          <span class="lbl">{{etiquetaPeriodo}}</span>
          @if (todoBienGlobal === 0) {
            <span class="verdict-tag">Todo en orden</span>
          } @else {
            <span class="verdict-monto money">{{ (todoBienGlobal * -1) | currency:'MXN':'symbol':'1.0-0' }}</span>
          }
        </div>
        <p class="verdict-txt">
          @if (todoBienGlobal > 0) {
            Sobra <b>{{ todoBienGlobal | currency:'MXN':'symbol':'1.0-0' }}</b> de lo que tienes
          } @else if (todoBienGlobal < 0) {
            Falta <b>{{ (todoBienGlobal * -1) | currency:'MXN':'symbol':'1.0-0' }}</b> de lo que tienes
          } @else {
            Lo gastado calza justo con lo que tienes
          }
        </p>
        <div class="verdict-split">
          <div><span class="lbl">Tienes</span><b class="num">{{ dineroTotalGlobal | currency:'MXN':'symbol':'1.0-0' }}</b></div>
          <div><span class="lbl">Gastado</span><b class="num">{{ gastoRealGlobal | currency:'MXN':'symbol':'1.0-0' }}</b></div>
          <div><span class="lbl">Registrado</span><b class="num">{{ ingresoTotalGlobal | currency:'MXN':'symbol':'1.0-0' }}</b></div>
        </div>
      </div>

      <!-- 3. Cuanto sobra si se gasta lo planeado.
           El monto cambia con el selector de arriba: si esta en "Todo el mes"
           es la suma de Q1+Q2, si esta en una quincena es solo esa.
           Color: rojo si es negativo, amarillo si esta cerca de cero. -->
      <div class="card saldo"
           [class.saldo-cero]="saldoCercaDeCero"
           [class.saldo-neg]="sobranteGlobal < 0">
        <div class="saldo-head">
          <span class="lbl">{{ etiquetaPeriodoPrevisto }}</span>
          <b class="money saldo-monto">{{ (sobranteGlobal * -1) | currency:'MXN':'symbol':'1.0-0' }}</b>
        </div>
      </div>

      <!-- 4. Uso del presupuesto: la unica barra de progreso de la app -->
      <div class="card usage">
        <div class="usage-head">
          <span class="lbl">Uso del presupuesto</span>
          <b class="num">{{ pctGlobal }}%</b>
        </div>
        <div class="progress"><div [style.width.%]="pctGlobal"></div></div>
        <div class="usage-foot">
          <span>{{ gastoRealGlobal | currency:'MXN':'symbol':'1.0-0' }} de {{ previstoGlobal | currency:'MXN':'symbol':'1.0-0' }} previstos</span>
          @if (pendienteGlobal > 0) {
            <span class="usage-rest">faltan {{ pendienteGlobal | currency:'MXN':'symbol':'1.0-0' }}</span>
          }
        </div>
      </div>

      <!-- 5. Detalle por quincena -->
      <div class="section-title">Detalle</div>
      <div class="grid2">
        @for (q of filteredQs; track q) {
        <div class="card q-card" [class.collapsed]="isCollapsed(q)">
          <button class="q-head" (click)="toggleCollapse(q)" [attr.aria-expanded]="!isCollapsed(q)">
            <span class="head-left">
              <ion-icon [name]="isCollapsed(q) ? 'chevron-down-outline' : 'chevron-up-outline'"></ion-icon>
              <span class="lbl">{{ etiquetaQuincena(q) }}</span>
            </span>
            <span class="head-right money">{{ ingreso(q) | currency:'MXN':'symbol':'1.0-0' }}</span>
          </button>
          @if(!isCollapsed(q)){
          <div class="q-body">
            @if(!editing[q]){
              <div class="row"><span>Efectivo</span><b>{{efectivo(q) | currency:'MXN':'symbol':'1.0-0'}}</b></div>
              <div class="row"><span>Vales</span><b>{{vales(q) | currency:'MXN':'symbol':'1.0-0'}}</b></div>
              <div class="row"><span>Nómina</span><b>{{nomina(q) | currency:'MXN':'symbol':'1.0-0'}}</b></div>
              <button class="link" (click)="toggleEdit(q)">Editar montos</button>
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

            <hr class="sep" />
            <div class="row"><span>Previsto en gastos</span><b>{{ previstos(q) | currency:'MXN':'symbol':'1.0-0' }}</b></div>
            <div class="row"><span>Gastado real</span><b>{{ reales(q) | currency:'MXN':'symbol':'1.0-0' }}</b></div>
            <div class="progress"><div [style.width.%]="pct(q)"></div></div>
            <span class="usage-rest">{{ pct(q) }}% del previsto</span>

            <hr class="sep" />
            <div class="row total-row">
              <span>Disponible</span>
              <b [class.pos]="sobrante(q) >= 0" [class.neg]="sobrante(q) < 0">{{ sobrante(q) | currency:'MXN':'symbol':'1.0-0' }}</b>
            </div>
            @if (pendiente(q) > 0) {
              <div class="row"><span>Falta por gastar</span><b>{{ pendiente(q) | currency:'MXN':'symbol':'1.0-0' }}</b></div>
            }

            <!-- Indicador por quincena: es el aviso de que lo gastado no calza
                 con el dinero que hay. Se calcula con todoBien(q). -->
            <div class="flag" [class.flag-sobra]="todoBien(q) > 0" [class.flag-falta]="todoBien(q) < 0" [class.flag-ok]="todoBien(q) === 0">
              @if (todoBien(q) > 0) {
                <span>Sobra dinero</span><b>{{ todoBien(q) | currency:'MXN':'symbol':'1.0-0' }}</b>
              } @else if (todoBien(q) < 0) {
                <span>Falta dinero</span><b>{{ (todoBien(q) * -1) | currency:'MXN':'symbol':'1.0-0' }}</b>
              } @else {
                <span>Todo en orden</span><b>✓</b>
              }
            </div>
          </div>
          }
        </div>
        }
      </div>

      <!-- 6. Deudas y deudores: van despues del detalle porque son otra cosa.
           El detalle es el dinero de la quincena; esto es lo que se debe
           fuera del ciclo, asi que no compite con el veredicto de arriba. -->
      <div class="section-title">Cuentas pendientes</div>
      <div class="grid2">
        <a class="card sum" (click)="go('/tabs/deudas')">
          <span class="lbl">Cuentas por pagar</span>
          <b class="money">{{ (pagosPendientesMonto + deudaMarinaMensual) | currency:'MXN':'symbol':'1.0-0' }}</b>
          <span class="sum-sub">al mes · {{ pagosPendientesCount }} pagos de tarjeta</span>
        </a>
        <a class="card sum" (click)="go('/tabs/deudores')">
          <span class="lbl">Me deben</span>
          <b class="money">{{ deudoresTotal | currency:'MXN':'symbol':'1.0-0' }}</b>
          <span class="sum-sub">{{ deudoresLista.length }} personas</span>
        </a>
      </div>

      <!-- 7. Gastos por categoria -->
      <div class="card table-card" [class.collapsed]="gastosCollapsed">
        <button class="card-title clickable" (click)="gastosCollapsed=!gastosCollapsed" [attr.aria-expanded]="!gastosCollapsed">
          <span><ion-icon [name]="gastosCollapsed ? 'chevron-down-outline' : 'chevron-up-outline'"></ion-icon> Gastos por categoría</span>
        </button>
        @if(!gastosCollapsed){
          @if(quincenaActual==='TODO'){
            <div class="tbl head"><span>Categoría</span><span class="num">Q1</span><span class="num">Q2</span><span class="num">Total</span></div>
            @for (r of rows; track r.cat.id) {
              <div class="tbl">
                <span class="cat"><i [style.background]="r.cat.color"></i>{{r.cat.nombre}}</span>
                <span class="num">{{r.q1 | currency:'MXN':'symbol':'1.0-0'}}</span>
                <span class="num">{{r.q2 | currency:'MXN':'symbol':'1.0-0'}}</span>
                <span class="num bold">{{r.q1+r.q2 | currency:'MXN':'symbol':'1.0-0'}}</span>
              </div>
            }
            <div class="tbl total"><span>Total</span><span class="num">{{totalQ1 | currency:'MXN':'symbol':'1.0-0'}}</span><span class="num">{{totalQ2 | currency:'MXN':'symbol':'1.0-0'}}</span><span class="num">{{totalQ1+totalQ2 | currency:'MXN':'symbol':'1.0-0'}}</span></div>
          } @else if(quincenaActual==='Q1'){
            <div class="tbl head th-3"><span>Categoría</span><span class="num">Previsto</span><span class="num">Total mes</span></div>
            @for (r of rows; track r.cat.id) { @if(r.q1>0){
              <div class="tbl th-3">
                <span class="cat"><i [style.background]="r.cat.color"></i>{{r.cat.nombre}}</span>
                <span class="num">{{r.q1 | currency:'MXN':'symbol':'1.0-0'}}</span>
                <span class="num bold">{{r.q1+r.q2 | currency:'MXN':'symbol':'1.0-0'}}</span>
              </div>
            } }
            <div class="tbl total th-3"><span>Total</span><span class="num">{{totalQ1 | currency:'MXN':'symbol':'1.0-0'}}</span><span class="num">{{totalQ1+totalQ2 | currency:'MXN':'symbol':'1.0-0'}}</span></div>
          } @else {
            <div class="tbl head th-3"><span>Categoría</span><span class="num">Previsto</span><span class="num">Total mes</span></div>
            @for (r of rows; track r.cat.id) { @if(r.q2>0){
              <div class="tbl th-3">
                <span class="cat"><i [style.background]="r.cat.color"></i>{{r.cat.nombre}}</span>
                <span class="num">{{r.q2 | currency:'MXN':'symbol':'1.0-0'}}</span>
                <span class="num bold">{{r.q1+r.q2 | currency:'MXN':'symbol':'1.0-0'}}</span>
              </div>
            } }
            <div class="tbl total th-3"><span>Total</span><span class="num">{{totalQ2 | currency:'MXN':'symbol':'1.0-0'}}</span><span class="num">{{totalQ1+totalQ2 | currency:'MXN':'symbol':'1.0-0'}}</span></div>
          }
        }
      </div>

      <!-- 8. Ingresos: edicion en linea -->
      <div class="section-title">Ingresos</div>
      <div class="grid2">
        @for (q of filteredQs; track q) {
          <div class="card ingreso-table-card" [class.collapsed]="isIngCollapsed(q)">
            <button class="ing-head clickable" (click)="toggleIngCollapse(q)" [attr.aria-expanded]="!isIngCollapsed(q)">
              <span><ion-icon [name]="isIngCollapsed(q) ? 'chevron-down-outline' : 'chevron-up-outline'"></ion-icon> {{ etiquetaQuincena(q) }}</span>
              <b class="money">{{ getIngresoTotal(q) | currency:'MXN':'symbol':'1.0-0' }}</b>
            </button>
            @if(!isIngCollapsed(q)){
            <div class="ing-col">
              @for (ing of getIngresos(q); track ing.id) {
                <div class="ing-list">
                  <span><input class="cell-inp" [(ngModel)]="ing.concepto" (blur)="saveIngresoConcepto(q, ing)" placeholder="Concepto" aria-label="Concepto del ingreso"></span>
                  <span><input class="cell-inp num" type="number" [(ngModel)]="ing.monto" (change)="saveIngresoMonto(q, ing)" (blur)="saveIngresoMonto(q, ing)" aria-label="Monto del ingreso"></span>
                  <span><button class="del" (click)="removeIngreso(q, ing.id)" aria-label="Eliminar ingreso">&times;</button></span>
                </div>
              }
              @if (getIngresos(q).length === 0) {
                <div class="empty">Sin ingresos cargados</div>
              }
              <div class="add-ing">
                <ion-button size="small" fill="outline" (click)="openAddIngresoModal(q)">Agregar ingreso</ion-button>
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
  .title-wrap small{font-size:11px;color:var(--text-muted);font-weight:400}
  .bg{--background:#eef2f7}
  .container{padding:var(--sp-3);max-width:900px;margin:0 auto;display:flex;flex-direction:column;gap:var(--sp-3)}

  /* Segmento de periodo: botones reales, no labels con checkbox.
     El checkbox escondido obligaba a adivinar si estaba activo. */
  .seg{display:flex;gap:2px;background:var(--surface-sunken);padding:3px;border-radius:var(--radius-pill)}
  .seg-btn{
    flex:1;border:none;background:transparent;cursor:pointer;
    font-family:inherit;font-size:13px;font-weight:700;
    color:var(--text-muted);padding:8px 10px;border-radius:var(--radius-pill);
    transition:background .15s ease,color .15s ease;
  }
  .seg-btn.on{background:var(--surface);color:var(--text-strong);box-shadow:var(--shadow)}
  .seg-btn:focus-visible{outline:2px solid var(--accent);outline-offset:2px}

  /* Veredicto: lo primero que se ve, y lo unico con color de fondo fuerte.
     Verde = sobra, rojo = falta, neutro = justo. El color aqui SI significa algo. */
  .verdict{
    background:var(--surface);border-radius:var(--radius-lg);padding:var(--sp-4);
    box-shadow:var(--shadow);border:1px solid var(--border);
    border-left:4px solid var(--text-muted);
  }
  .verdict.estado-sobra{border-left-color:var(--ok);background:linear-gradient(0deg,var(--ok-bg) 0 100%)}
  .verdict.estado-falta{border-left-color:var(--bad);background:linear-gradient(0deg,var(--bad-bg) 0 100%)}
  .verdict.estado-ok{border-left-color:var(--info)}
  .verdict-head{display:flex;justify-content:space-between;align-items:baseline;gap:var(--sp-3);flex-wrap:wrap}
  .verdict-monto{font-size:26px;line-height:1.1;letter-spacing:-.02em}
  .verdict-tag{background:var(--ok-bg);color:var(--ok);font-size:12px;font-weight:800;
    padding:4px 10px;border-radius:var(--radius-pill)}
  .estado-sobra .verdict-monto{color:var(--ok)}
  .estado-falta .verdict-monto{color:var(--bad)}
  .verdict-txt{margin:6px 0 0;font-size:14px;color:var(--text-body)}
  .verdict-txt b{color:var(--text-strong)}
  .verdict-split{display:flex;gap:var(--sp-5);margin-top:var(--sp-3);padding-top:var(--sp-3);border-top:1px solid var(--border)}
  .verdict-split > div{display:flex;flex-direction:column;gap:2px}
  .verdict-split b{font-size:15px}

/* Saldo previsto: solo el monto. El color marca el estado:
   rojo = ya no alcanza, amarillo = sobra pero menos del 5% de lo que tenes,
   normal = sobra con holgura. */
.saldo{background:var(--surface);border-radius:var(--radius-lg);padding:var(--sp-4);
    box-shadow:var(--shadow);border:1px solid var(--border)}
.saldo-head{display:flex;justify-content:space-between;align-items:baseline;gap:var(--sp-3);flex-wrap:wrap}
.saldo-monto{font-size:22px;letter-spacing:-.02em}
.saldo-cero{background:var(--warn-bg);border-color:#ffd88a}
.saldo-cero .saldo-monto{color:var(--warn)}
.saldo-neg{background:var(--bad-bg);border-color:#f3b0b0}
.saldo-neg .saldo-monto{color:var(--bad)}

/* Uso del presupuesto */
.usage{background:var(--surface);border-radius:var(--radius-lg);padding:var(--sp-4);box-shadow:var(--shadow);border:1px solid var(--border)}
  .usage-head{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:var(--sp-2)}
  .usage-head b{font-size:15px;color:var(--text-strong)}
  .usage-foot{display:flex;justify-content:space-between;gap:var(--sp-2);margin-top:var(--sp-2);font-size:12px;color:var(--text-muted);flex-wrap:wrap}
  .usage-rest{color:var(--text-muted);font-size:12px}

  /* Resumenes de una linea (deudas / deudores). Clickeable = navegable. */
  .sum{
    display:flex;flex-direction:column;gap:2px;padding:var(--sp-4);cursor:pointer;
    background:var(--surface);border-radius:var(--radius-lg);box-shadow:var(--shadow);
    border:1px solid var(--border);text-decoration:none;
  }
  .sum b{font-size:20px;letter-spacing:-.01em}
  .sum-sub{font-size:12px;color:var(--text-muted)}
  .sum:active{background:var(--surface-sunken)}

  .section-title{font-family:'Comfortaa',cursive;font-size:13px;color:var(--text-muted);padding:0 2px;margin-top:var(--sp-2)}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-3)}
  @media(max-width:700px){.grid2{grid-template-columns:1fr}}

  .card{background:var(--surface);border-radius:var(--radius-lg);box-shadow:var(--shadow);border:1px solid var(--border);overflow:hidden}

  /* Encabezados de tarjeta: sin fondo de color, sin mayusculas.
     El peso y el tamano dan la jerarquia; el color se reserva para el estado. */
  .q-head{
    width:100%;display:flex;justify-content:space-between;align-items:center;gap:var(--sp-3);
    padding:var(--sp-3) var(--sp-4);cursor:pointer;border:none;
    background:var(--surface);font-family:inherit;
  }
  .q-head:focus-visible{outline:2px solid var(--accent);outline-offset:-2px}
  .head-left{display:flex;gap:6px;align-items:center;color:var(--text-muted);font-size:11px}
  .head-right{font-size:16px}
  .q-body{padding:0 var(--sp-4) var(--sp-4)}

  .sep{border:none;border-top:1px solid var(--border-subtle);margin:var(--sp-3) 0}
  .total-row{font-size:16px;font-weight:700}
  .total-row b.pos{color:var(--ok)}
  .total-row b.neg{color:var(--bad)}

  /* Indicador de cierre de la quincena. Es el aviso que faltaba:
     avisa cuando lo gastado no calza con el dinero disponible. */
  .flag{
    display:flex;justify-content:space-between;align-items:center;gap:var(--sp-2);
    margin-top:var(--sp-3);padding:10px var(--sp-3);
    border-radius:var(--radius-sm);font-size:13px;font-weight:700;
    border:1px solid transparent;
  }
  .flag b{font-variant-numeric:tabular-nums;font-weight:800}
  .flag-sobra{background:var(--warn-bg);color:var(--warn);border-color:#ffd88a}
  .flag-falta{background:var(--bad-bg);color:var(--bad);border-color:#f3b0b0}
  .flag-ok{background:var(--ok-bg);color:var(--ok);border-color:#b6e3ca}

  .link{background:none;border:none;padding:0;margin-top:var(--sp-2);cursor:pointer;
    font-family:inherit;font-size:12px;font-weight:700;color:var(--accent);text-decoration:underline}
  .edit-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:var(--sp-2);margin:var(--sp-3) 0}
  @media(max-width:500px){.edit-grid{grid-template-columns:1fr}}
  .edit-grid label{font-size:11px;color:var(--text-muted);font-weight:700;display:flex;flex-direction:column;gap:4px}
  .edit-inp{--background:var(--surface-input);border-radius:var(--radius-sm);--padding-start:8px}
  .edit-actions{display:flex;gap:var(--sp-2);justify-content:flex-end}

  /* Tablas: cifras alineadas a la derecha con tabular-nums */
  .table-card{padding:var(--sp-4)}
  .card-title{
    width:100%;text-align:left;background:none;border:none;cursor:pointer;font-family:inherit;
    font-size:14px;font-weight:700;color:var(--text-strong);margin-bottom:var(--sp-3);
    display:flex;justify-content:space-between;align-items:center;gap:var(--sp-2);
  }
  .card-title:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
  .tbl{display:grid;grid-template-columns:1.3fr .7fr .7fr .8fr;gap:var(--sp-2);padding:8px 0;
    border-bottom:1px solid var(--border-subtle);font-size:13px;align-items:center}
  .tbl .num{text-align:right}
  .tbl.th-3{grid-template-columns:1.3fr .85fr .85fr}
  .tbl.head{font-size:11px;font-weight:700;color:var(--text-muted);background:var(--surface-sunken);
    border-radius:var(--radius-sm);padding:8px;border-bottom:none}
  .tbl.total{font-weight:700;background:var(--surface-sunken);border-radius:var(--radius-sm);
    border-bottom:none;margin-top:var(--sp-2)}
  .cat{display:flex;align-items:center;gap:var(--sp-2);min-width:0}
  .cat i{width:8px;height:8px;border-radius:50%;display:inline-block;flex:none}
  .bold{font-weight:700}

  .ingreso-table-card{padding:var(--sp-4)}
  .ing-head{display:flex;justify-content:space-between;align-items:center;gap:var(--sp-3);
    width:100%;text-align:left;background:none;border:none;padding:0 0 var(--sp-3);
    cursor:pointer;font-family:inherit;font-size:14px;font-weight:700;color:var(--text-strong)}
  .ing-head:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
  .ing-head > span{display:flex;align-items:center;gap:6px}
  .ing-col{background:var(--surface-sunken);border-radius:var(--radius);padding:var(--sp-2)}
  .ing-list{display:grid;grid-template-columns:1fr 96px 32px;gap:var(--sp-2);
    align-items:center;padding:4px 0}
  .cell-inp{width:100%;border:1px solid var(--border);border-radius:var(--radius-sm);
    padding:8px;font-size:13px;background:var(--surface);font-family:inherit;color:var(--text-body)}
  .cell-inp.num{text-align:right;font-variant-numeric:tabular-nums}
  .add-ing{display:flex;justify-content:flex-end;margin-top:var(--sp-2)}
  .del{border:none;background:transparent;color:var(--text-faint);font-size:20px;
    cursor:pointer;line-height:1;width:32px;height:32px;border-radius:var(--radius-sm)}
  .del:hover{background:var(--bad-bg);color:var(--bad)}
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
  rows: any[] = [];
  totalQ1 = 0; totalQ2 = 0;
  quincenaActual: 'Q1'|'Q2'|'TODO' = 'TODO';
  collapsed: Record<string, boolean> = { Q1: false, Q2: false };
  collapsedIng: Record<string, boolean> = { Q1: false, Q2: false };
  gastosCollapsed = true;
  get filteredQs(): string[] { return this.quincenaActual==='TODO' ? ['Q1','Q2'] : [this.quincenaActual]; }
  editing: Record<string, boolean> = { Q1: false, Q2: false };
  editVals: Record<string, any> = { Q1: { efectivo: 0, vales: 0, nomina: 0 }, Q2: { efectivo: 0, vales: 0, nomina: 0 } };
  newIngConcepto: Record<string, string> = { Q1: '', Q2: '' };
  newIngMonto: Record<string, any> = { Q1: null, Q2: null };
  private manualToggle = new Set<string>();
  private manualIngToggle = new Set<string>();

  constructor(private budget: BudgetService, private auth: AuthService, private router: Router, private modalCtrl: ModalController) {
    addIcons({ chevronDownOutline, chevronUpOutline, logOutOutline });
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
    // El 'sobrante' previsto por quincena ya lo calcula saldoGlobal() en el
    // veredicto, asi que no hace falta guardarlo en un campo.
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
    // 'Me deben' se calcula sobre la lista de deudores (los que me deben a mi),
    // no sobre deudores[], que son las deudas que yo debo. Antes se mezclaban.
    this.deudoresTotal = this.deudoresLista
      .filter((d: any) => !(d.pagados > 0 && d.pagados >= d.pagos))
      .reduce((s: any, d: any) => s + (Number(d.saldo) || 0), 0);
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
  go(url: string) { this.router.navigateByUrl(url); }

  /** Etiqueta del periodo activo, usada en el veredicto. */
  get etiquetaPeriodo(): string {
    return this.quincenaActual === 'TODO' ? 'Todo el mes' : this.etiquetaQuincena(this.quincenaActual);
  }
  /** "Q1" -> "Quincena 1". Evita repetir el ternario en cada template. */
  etiquetaQuincena(q: string): string {
    return q === 'Q1' ? 'Quincena 1' : 'Quincena 2';
  }

  /**
   * Agregados del periodo activo. El veredicto de arriba tiene que sumar
   * lo mismo que muestran las tarjetas de abajo, si no el usuario ve dos
   * numeros distintos para la misma pregunta.
   */
  get ingresoTotalGlobal(): number {
    return this.filteredQs.reduce((s, q) => s + this.getIngresoTotal(q), 0);
  }
  get gastoRealGlobal(): number {
    return this.filteredQs.reduce((s, q) => s + this.reales(q), 0);
  }
  get previstoGlobal(): number {
    return this.filteredQs.reduce((s, q) => s + this.previstos(q), 0);
  }
  get pendienteGlobal(): number {
    return this.filteredQs.reduce((s, q) => s + this.pendiente(q), 0);
  }
  /** Efectivo + vales + nomina: el dinero que hay sobre la mesa. */
  get dineroTotalGlobal(): number {
    return this.filteredQs.reduce((s, q) => s + this.ingreso(q), 0);
  }
  /**
   * "Cuanto sobra si gasto lo planeado": dinero que tenes menos lo previsto.
   * Es el numero que vivia en la tarjeta saldo-card del diseño anterior.
   * OJO: no es lo mismo que todoBienGlobal. Este mira lo PREVISTO
   * (ingreso - previstos), el otro mira lo REAL (ingresos - gastadoReal).
   */
  get sobranteGlobal(): number {
    return this.dineroTotalGlobal - this.previstoGlobal;
  }
  /** "Saldo previsto · Todo el mes" / "· Quincena 1" */
  get etiquetaPeriodoPrevisto(): string {
    return this.quincenaActual === 'TODO' ? 'Te sobra el mes' : `Te sobra la ${this.etiquetaQuincena(this.quincenaActual)}`;
  }
  /**
   * Cerca de cero: el saldo es menor al 5% de lo que tenes a mano, o es
   * exactamente cero. Por debajo de ese umbral el saldo es real pero no
   * alcanza para nada, asi que conviene avisarlo antes de que se haga
   * negativo. Solo aplica cuando no es negativo; si ya es negativo va rojo.
   */
  get saldoCercaDeCero(): boolean {
    if (this.sobranteGlobal < 0) return false;
    return this.sobranteGlobal < this.dineroTotalGlobal * 0.05;
  }
  /**
   * Positivo = sobra, negativo = FALTA DINERO. Misma formula que todoBien(q):
   * (ingresos - gastadoReal) - dineroTotal.
   */
  get todoBienGlobal(): number {
    return (this.ingresoTotalGlobal - this.gastoRealGlobal) - this.dineroTotalGlobal;
  }
  get pctGlobal(): number {
    return this.previstoGlobal ? Math.round((this.gastoRealGlobal / this.previstoGlobal) * 100) : 0;
  }
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
