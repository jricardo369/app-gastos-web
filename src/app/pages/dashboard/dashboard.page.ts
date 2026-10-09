import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonIcon, IonButton, IonInput, IonItem, IonButtons, ModalController } from '@ionic/angular';
import { CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { BudgetService } from '../../core/services/budget.service';
import { AuthService } from '../../core/services/auth.service';
import { addIcons } from 'ionicons';
import { chevronDownOutline, chevronUpOutline, chevronForwardOutline, logOutOutline, personCircleOutline, createOutline, trashOutline, addOutline } from 'ionicons/icons';
import pkg from '../../../../package.json';

/** Versión desde package.json: una sola fuente, no se desincroniza. */
const APP_VERSION = pkg['version'];

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
      <ion-buttons slot="start">
        <ion-button fill="clear" (click)="go('/tabs/perfil')" aria-label="Ver perfil">
          <ion-icon name="person-circle-outline" aria-hidden="true"></ion-icon>
        </ion-button>
      </ion-buttons>
      <ion-title>
        <div class="title-wrap">
          <span>Dashboard</span><small>{{today}} · v{{version}}</small>
        </div>
      </ion-title>
      <ion-buttons slot="end">
        <ion-button fill="clear" (click)="logout()" aria-label="Cerrar sesión">
          <ion-icon name="log-out-outline" aria-hidden="true"></ion-icon>
        </ion-button>
      </ion-buttons>
    </ion-toolbar>
  </ion-header>

  <ion-content class="bg">
    <div class="container">

      <!-- 1. Selector de quincena: decide que muestra todo lo de abajo -->
      <div class="seg" role="group" aria-label="Periodo">
        <button type="button" class="seg-btn" [class.on]="quincenaActual==='TODO'" [attr.aria-pressed]="quincenaActual==='TODO'" (click)="setActual('TODO')">Todo el mes</button>
        <button type="button" class="seg-btn" [class.on]="quincenaActual==='Q1'" [attr.aria-pressed]="quincenaActual==='Q1'" (click)="setActual('Q1')">Quincena 1</button>
        <button type="button" class="seg-btn" [class.on]="quincenaActual==='Q2'" [attr.aria-pressed]="quincenaActual==='Q2'" (click)="setActual('Q2')">Quincena 2</button>
      </div>

      <!-- 2. Estado general: solo dice si todo está bien. Sin montos: lo que
           importa acá es el aviso, no la cifra.
           Mide cuánto queda (lo que tienes - lo que gastaste); antes media el
           cuadre contra el registro y por eso decía "Falta" siempre. -->
      <div class="card verdict">
        <div class="v-head">
          <span class="lbl">{{etiquetaPeriodo}}</span>
          @if (quedaGlobal === 0) {
            <span class="tag ok">Todo en orden</span>
          } @else {
            <span class="tag" [class.warn]="quedaGlobal > 0" [class.bad]="quedaGlobal < 0">
              {{ quedaGlobal > 0 ? 'Tienes de más' : 'Te falta' }}
            </span>
          }
        </div>
      </div>

      <!-- 3. Cuanto sobra si se gasta lo planeado.
           El monto cambia con el selector de arriba: si esta en "Todo el mes"
           es la suma de Q1+Q2, si esta en una quincena es solo esa.
           El monto va CON su signo: positivo = te sobra, negativo = no alcanza.
           Antes se invertía, así que "te sobra $5,000" se pintaba -$5,000. -->
      <div class="card saldo" [class.saldo-cero]="saldoCercaDeCero" [class.saldo-neg]="sobranteGlobal < 0">
        <div class="s-head">
          <span class="lbl">{{ etiquetaPeriodoPrevisto }}</span>
          <span class="count">si gastás lo previsto</span>
        </div>
        <b class="s-monto">{{ sobranteGlobal | currency:'MXN':'symbol':'1.0-0' }}</b>
      </div>

      <!-- 4. Detalle por quincena -->
      <span class="section-title">Detalle</span>
      <div class="grid2">
        @for (q of filteredQs; track q) {
        <div class="card q-card" [class.collapsed]="isCollapsed(q)">
          <button class="q-head" (click)="toggleCollapse(q)" [attr.aria-expanded]="!isCollapsed(q)">
            <span class="head-left">
              <ion-icon [name]="isCollapsed(q) ? 'chevron-down-outline' : 'chevron-up-outline'" aria-hidden="true"></ion-icon>
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
              <!-- Mismo boton solido con icono que usa el resto de las pestañas -->
              <ion-button size="small" class="edit-btn" (click)="toggleEdit(q)">
                <ion-icon slot="start" name="create-outline" aria-hidden="true"></ion-icon>Editar montos
              </ion-button>
            } @else {
              <div class="edit-grid">
                <label>Efectivo<ion-input type="number" [(ngModel)]="editVals[q].efectivo" class="edit-inp"></ion-input></label>
                <label>Vales<ion-input type="number" [(ngModel)]="editVals[q].vales" class="edit-inp"></ion-input></label>
                <label>Nómina<ion-input type="number" [(ngModel)]="editVals[q].nomina" class="edit-inp"></ion-input></label>
              </div>
              <div class="edit-actions">
                <ion-button size="small" fill="outline" color="medium" (click)="toggleEdit(q)">Cancelar</ion-button>
                <ion-button size="small" (click)="saveEdit(q)">Guardar</ion-button>
              </div>
            }

            <hr class="sep" />
            <div class="row"><span>Previsto en gastos</span><b>{{ previstos(q) | currency:'MXN':'symbol':'1.0-0' }}</b></div>
            <div class="row"><span>Gastado real</span><b>{{ reales(q) | currency:'MXN':'symbol':'1.0-0' }}</b></div>
            <div class="progress" role="progressbar" [attr.aria-valuenow]="pct(q)" aria-valuemin="0" aria-valuemax="100"
                 [attr.aria-label]="'Avance del previsto de la ' + etiquetaQuincena(q)">
              <div [style.width.%]="pct(q)"></div>
            </div>
            <span class="usage-rest">{{ pct(q) }}% del previsto</span>

            @if (pendiente(q) > 0) {
              <div class="row"><span>Falta por gastar</span><b>{{ pendiente(q) | currency:'MXN':'symbol':'1.0-0' }}</b></div>
            }

            <!-- Aviso por quincena, con la misma medida que el veredicto de
                 arriba: cuánto queda de lo que hay en la mesa. -->
            <div class="flag" [class.flag-sobra]="queda(q) > 0" [class.flag-falta]="queda(q) < 0" [class.flag-ok]="queda(q) === 0">
              @if (queda(q) > 0) {
                <span>Tienes de más: te queda dinero</span><b>{{ queda(q) | currency:'MXN':'symbol':'1.0-0' }}</b>
              } @else if (queda(q) < 0) {
                <span>Te falta: gastaste más de lo que tienes</span><b>{{ (queda(q) * -1) | currency:'MXN':'symbol':'1.0-0' }}</b>
              } @else {
                <span>Todo en orden</span><b aria-hidden="true">✓</b>
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
      <span class="section-title">Cuentas pendientes</span>
      <div class="grid2">
        <button type="button" class="card sum" (click)="go('/tabs/deudas')">
          <div class="panel-title">
            <span class="lbl">Cuentas por pagar</span>
            <span class="count">{{ pagosPendientesCount }} pagos de tarjeta</span>
          </div>
          <b class="money">{{ (pagosPendientesMonto + deudaMarinaMensual) | currency:'MXN':'symbol':'1.0-0' }}</b>
          <ion-icon class="sum-chev" name="chevron-forward-outline" aria-hidden="true"></ion-icon>
        </button>
        <button type="button" class="card sum" (click)="go('/tabs/deudores')">
          <div class="panel-title">
            <span class="lbl">Me deben</span>
            <span class="count">{{ deudoresLista.length }} personas</span>
          </div>
          <b class="money">{{ deudoresTotal | currency:'MXN':'symbol':'1.0-0' }}</b>
          <ion-icon class="sum-chev" name="chevron-forward-outline" aria-hidden="true"></ion-icon>
        </button>
      </div>

      <!-- 7. Gastos por categoria -->
      <div class="card pad-card" [class.collapsed]="gastosCollapsed">
        <button class="card-title" (click)="gastosCollapsed=!gastosCollapsed" [attr.aria-expanded]="!gastosCollapsed">
          <span><ion-icon [name]="gastosCollapsed ? 'chevron-down-outline' : 'chevron-up-outline'" aria-hidden="true"></ion-icon> Gastos por categoría</span>
          <span class="money">{{ (totalQ1+totalQ2) | currency:'MXN':'symbol':'1.0-0' }}</span>
        </button>
        @if(!gastosCollapsed){
          @if(quincenaActual==='TODO'){
            <div class="tbl head"><span>Categoría</span><span class="num">Q1</span><span class="num">Q2</span><span class="num">Total</span></div>
            @for (r of rows; track r.cat.id) {
              <div class="tbl">
                <span class="cat"><i [style.background]="r.cat.color" aria-hidden="true"></i>{{r.cat.nombre}}</span>
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
                <span class="cat"><i [style.background]="r.cat.color" aria-hidden="true"></i>{{r.cat.nombre}}</span>
                <span class="num">{{r.q1 | currency:'MXN':'symbol':'1.0-0'}}</span>
                <span class="num bold">{{r.q1+r.q2 | currency:'MXN':'symbol':'1.0-0'}}</span>
              </div>
            } }
            <div class="tbl total th-3"><span>Total</span><span class="num">{{totalQ1 | currency:'MXN':'symbol':'1.0-0'}}</span><span class="num">{{totalQ1+totalQ2 | currency:'MXN':'symbol':'1.0-0'}}</span></div>
          } @else {
            <div class="tbl head th-3"><span>Categoría</span><span class="num">Previsto</span><span class="num">Total mes</span></div>
            @for (r of rows; track r.cat.id) { @if(r.q2>0){
              <div class="tbl th-3">
                <span class="cat"><i [style.background]="r.cat.color" aria-hidden="true"></i>{{r.cat.nombre}}</span>
                <span class="num">{{r.q2 | currency:'MXN':'symbol':'1.0-0'}}</span>
                <span class="num bold">{{r.q1+r.q2 | currency:'MXN':'symbol':'1.0-0'}}</span>
              </div>
            } }
            <div class="tbl total th-3"><span>Total</span><span class="num">{{totalQ2 | currency:'MXN':'symbol':'1.0-0'}}</span><span class="num">{{totalQ1+totalQ2 | currency:'MXN':'symbol':'1.0-0'}}</span></div>
          }
        }
      </div>

      <!-- 8. Ingresos: oculta por defecto. Solo se entra a tocar cuando hay que
           cargar o corregir algo, asi que arranca cerrada y se abre con un
           clic en el encabezado. -->
      <div class="ing-section">
        <button class="ing-toggle" (click)="toggleIngresos()"
                [attr.aria-expanded]="!ingresosHidden" [attr.aria-controls]="'ingresosPanel'">
          <span class="t-left">
            <ion-icon [name]="ingresosHidden ? 'chevron-down-outline' : 'chevron-up-outline'" aria-hidden="true"></ion-icon>
            <span class="lbl">Ingresos</span>
          </span>
          @if (ingresosHidden) { <span class="count">tocar para cargar o editar</span> }
        </button>
        <div class="grid2" id="ingresosPanel" [hidden]="ingresosHidden">
          @for (q of filteredQs; track q) {
          <div class="card ing-card" [class.collapsed]="isIngCollapsed(q)">
            <button class="ing-head" (click)="toggleIngCollapse(q)" [attr.aria-expanded]="!isIngCollapsed(q)">
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
                <div class="empty sm">Sin ingresos cargados</div>
              }
              <div class="add-ing">
                <ion-button size="small" (click)="openAddIngresoModal(q)">
                  <ion-icon slot="start" name="add-outline" aria-hidden="true"></ion-icon>Agregar ingreso
                </ion-button>
              </div>
            </div>
            }
          </div>
          }
        </div>
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

  .card{background:var(--surface);border-radius:var(--radius-lg);box-shadow:var(--shadow);
    border:1px solid var(--border);overflow:hidden}
  .panel-title{display:flex;flex-direction:column;gap:1px;min-width:0}
  .count{font-family:'Nunito', sans-serif;font-size:11px;font-weight:700;color:var(--text-faint)}
  .pad-card{padding:var(--sp-4)}
  ion-button{margin:0;min-height:34px}

  /* Segmento de periodo: botones reales, no labels con checkbox.
     El checkbox escondido obligaba a adivinar si estaba activo. */
  .seg{display:flex;gap:var(--sp-1);background:var(--surface-sunken);padding:4px;
    border-radius:var(--radius-pill);border:1px solid var(--border-subtle)}
  .seg-btn{
    flex:1;border:none;background:transparent;cursor:pointer;
    font-family:'Nunito', sans-serif;font-size:13px;font-weight:700;
    color:var(--text-muted);padding:8px 10px;border-radius:var(--radius-pill);
    min-height:44px;transition:background .15s ease,color .15s ease;
  }
  .seg-btn.on{background:var(--surface);color:var(--text-strong);box-shadow:var(--shadow)}
  .seg-btn:focus-visible{outline:2px solid var(--accent);outline-offset:2px}

  /* Estado general: una franja con el periodo y el aviso. Sin cifras: lo que
     importa es saber si todo está bien o no. */
  .verdict{padding:var(--sp-3) var(--sp-4)}
  .v-head{display:flex;justify-content:space-between;align-items:center;gap:var(--sp-3);
    min-height:44px;flex-wrap:wrap}
  .tag{font-family:'Nunito',sans-serif;font-size:12px;font-weight:800;padding:5px 12px;
    border-radius:var(--radius-pill);flex:none}
  .tag.ok{background:var(--ok-bg);color:var(--ok)}
  /* "Tienes de más" va en ambar y "Te falta" en rojo: verde queda para cuando
     los números calzan. */
  .tag.warn{background:var(--warn-bg);color:var(--warn)}
  .tag.bad{background:var(--bad-bg);color:var(--bad)}

  /* Saldo previsto: solo el monto. El color marca el estado:
     rojo = ya no alcanza, amarillo = sobra pero menos del 5% de lo que tenes,
     normal = sobra con holgura. */
  .saldo{padding:var(--sp-4)}
  .s-head{display:flex;justify-content:space-between;align-items:center;gap:var(--sp-3);flex-wrap:wrap}
  .s-monto{display:block;margin-top:var(--sp-2);font-size:26px;line-height:1.1;
    color:var(--text-strong);font-variant-numeric:tabular-nums;letter-spacing:-.01em}
  .saldo-cero .s-monto{color:var(--warn)}
  .saldo-neg .s-monto{color:var(--bad)}

  /* El porcentaje del previsto se muestra dentro de cada quincena, asi que
     aca solo queda el texto auxiliar que acompaña a la barra. */
  .usage-rest{color:var(--text-muted);font-size:12px}

  /* Titulos de seccion: misma etiqueta que usan las tarjetas de las otras pestañas */
  .section-title{font-family:'Nunito',sans-serif;font-size:11px;font-weight:700;
    letter-spacing:.02em;color:var(--text-muted);padding:0 2px;margin-top:var(--sp-2)}

  /* Resumenes de una linea (deudas / deudores). Clickeable = navegable. */
  .sum{
    position:relative;display:flex;flex-direction:column;gap:var(--sp-2);
    padding:var(--sp-4) calc(var(--sp-4) + 24px) var(--sp-4) var(--sp-4);
    cursor:pointer;background:var(--surface);border:1px solid var(--border);
    border-radius:var(--radius-lg);box-shadow:var(--shadow);text-align:left;
    font-family:inherit;transition:background .15s ease;
  }
  .sum b{font-size:20px;font-variant-numeric:tabular-nums;letter-spacing:-.01em}
  .sum:hover{background:var(--surface-sunken)}
  .sum:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
  /* Flecha: indica que lleva a otra pestaña */
  .sum-chev{position:absolute;top:50%;right:var(--sp-4);transform:translateY(-50%);
    font-size:16px;color:var(--text-faint)}

  .ing-section{display:flex;flex-direction:column;gap:var(--sp-2)}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-3)}
  @media(max-width:700px){.grid2{grid-template-columns:1fr}}

  /* Encabezados de tarjeta: sin fondo de color, sin mayusculas.
     El peso y el tamano dan la jerarquia; el color se reserva para el estado. */
  .q-head{
    width:100%;display:flex;justify-content:space-between;align-items:center;gap:var(--sp-3);
    min-height:56px;padding:var(--sp-3) var(--sp-4);cursor:pointer;border:none;
    border-bottom:1px solid var(--border-subtle);
    background:var(--surface);font-family:inherit;text-align:left;
  }
  .card.collapsed .q-head{border-bottom:none}
  .q-head:focus-visible{outline:2px solid var(--accent);outline-offset:-2px}
  .head-left{display:flex;gap:6px;align-items:center;color:var(--text-muted);font-size:11px}
  .head-right{font-size:16px}
  .q-body{padding:var(--sp-3) var(--sp-4) var(--sp-4)}
  .edit-btn{margin:var(--sp-2) 0 0}

  .sep{border:none;border-top:1px solid var(--border-subtle);margin:var(--sp-3) 0}

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

  .edit-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:var(--sp-2);margin:var(--sp-3) 0}
  @media(max-width:500px){.edit-grid{grid-template-columns:1fr}}
  .edit-grid label{font-size:11px;color:var(--text-muted);font-weight:700;display:flex;flex-direction:column;gap:4px}
  .edit-inp{--background:var(--surface-input);border-radius:var(--radius-sm);--padding-start:8px}
  .edit-actions{display:flex;gap:var(--sp-2);justify-content:flex-end}

  /* Tablas: cifras alineadas a la derecha con tabular-nums */
  .card-title{
    width:100%;display:flex;justify-content:space-between;align-items:center;gap:var(--sp-2);
    text-align:left;background:none;border:none;cursor:pointer;font-family:inherit;
    font-size:14px;font-weight:700;color:var(--text-strong);margin:0 0 var(--sp-3);padding:0;
  }
  .card-title > span:first-child{display:flex;align-items:center;gap:6px}
  .card-title:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
  .tbl{display:grid;grid-template-columns:1.3fr .7fr .7fr .8fr;gap:var(--sp-2);padding:8px 0;
    border-bottom:1px solid var(--border-subtle);font-size:13px;align-items:center}
  .tbl .num{text-align:right;font-variant-numeric:tabular-nums}
  .tbl.th-3{grid-template-columns:1.3fr .85fr .85fr}
  .tbl.head{font-size:11px;font-weight:700;color:var(--text-muted);background:var(--surface-sunken);
    border-radius:var(--radius-sm);padding:8px;border-bottom:none}
  .tbl.total{font-weight:700;background:var(--surface-sunken);border-radius:var(--radius-sm);
    border-bottom:none;margin-top:var(--sp-2)}
  .cat{display:flex;align-items:center;gap:var(--sp-2);min-width:0}
  .cat i{width:8px;height:8px;border-radius:50%;display:inline-block;flex:none}
  .bold{font-weight:800}

  /* Secciones desplegables: cabecera con la misma forma que las tarjetas */
  .ing-toggle{
    width:100%;display:flex;justify-content:space-between;align-items:center;gap:var(--sp-3);
    min-height:56px;padding:var(--sp-3) var(--sp-4);cursor:pointer;
    background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);
    box-shadow:var(--shadow);font-family:inherit;text-align:left;color:var(--text-strong);
  }
  .ing-toggle:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
  .t-left{display:flex;align-items:center;gap:6px}

  .ing-head{display:flex;justify-content:space-between;align-items:center;gap:var(--sp-3);
    width:100%;min-height:56px;text-align:left;background:none;border:none;
    padding:var(--sp-3) var(--sp-4);cursor:pointer;font-family:inherit;
    font-size:14px;color:var(--text-strong);border-bottom:1px solid var(--border-subtle)}
  .ing-head:focus-visible{outline:2px solid var(--accent);outline-offset:-2px}
  .ing-body{padding:var(--sp-3)}
  .ing-list{display:grid;grid-template-columns:1fr 96px 36px;gap:var(--sp-2);
    align-items:center;min-height:44px;padding:2px 0}
  .cell-inp{width:100%;border:1px solid var(--border);border-radius:var(--radius-sm);
    padding:8px;font-size:13px;background:var(--surface);font-family:inherit;color:var(--text-body)}
  .cell-inp.num{text-align:right;font-variant-numeric:tabular-nums}
  /* Boton de borrar: icono y area de toque, como en el resto de las pestañas */
  .icon-btn{display:flex;align-items:center;justify-content:center;width:36px;height:36px;
    border:none;background:transparent;color:var(--text-faint);cursor:pointer;
    border-radius:var(--radius-sm);transition:background .15s ease,color .15s ease}
  .icon-btn ion-icon{font-size:16px}
  .icon-btn:hover{background:var(--bad-bg);color:var(--bad)}
  .icon-btn:focus-visible{outline:2px solid var(--bad);outline-offset:1px}
  .add-ing{display:flex;justify-content:flex-end;margin-top:var(--sp-2)}

  /* Estado vacio, igual que en las otras pestañas */
  .empty{padding:var(--sp-4);text-align:center;color:var(--text-faint);font-size:13px;
    background:var(--surface-sunken);border-radius:var(--radius-sm)}
  .empty.sm{padding:var(--sp-3);background:transparent}

  @media (prefers-reduced-motion: reduce){
    .seg-btn,.sum,.icon-btn{transition:none}
  }
  `]
})
export class DashboardPage {
  today = new Date().toLocaleDateString('es-MX', { weekday: 'short', day: '2-digit', month: 'short' });
  readonly version = APP_VERSION;
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
  /** La seccion de ingresos arranca oculta: solo se entra a cargar o corregir. */
  ingresosHidden = true;
  toggleIngresos() { this.ingresosHidden = !this.ingresosHidden; }
  gastosCollapsed = true;
  get filteredQs(): string[] { return this.quincenaActual==='TODO' ? ['Q1','Q2'] : [this.quincenaActual]; }
  editing: Record<string, boolean> = { Q1: false, Q2: false };
  editVals: Record<string, any> = { Q1: { efectivo: 0, vales: 0, nomina: 0 }, Q2: { efectivo: 0, vales: 0, nomina: 0 } };
  newIngConcepto: Record<string, string> = { Q1: '', Q2: '' };
  newIngMonto: Record<string, any> = { Q1: null, Q2: null };
  private manualToggle = new Set<string>();
  private manualIngToggle = new Set<string>();

  constructor(private budget: BudgetService, private auth: AuthService, private router: Router, private modalCtrl: ModalController) {
    addIcons({ chevronDownOutline, chevronUpOutline, chevronForwardOutline, logOutOutline, personCircleOutline, createOutline, trashOutline, addOutline });
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
  /**
   * Cuánto queda del dinero que hay en la mesa después de lo ya gastado.
   * Es la pregunta del veredicto: positivo = tienes de más, negativo = te falta.
   * (Antes acá estaba el "cuadre contra el registro", que se ponía negativo
   * en cuanto se marcaba un gasto como pagado y por eso siempre decia "Falta".
   */
  get quedaGlobal(): number {
    return this.dineroTotalGlobal - this.gastoRealGlobal;
  }
  /** Lo mismo, para una quincena: el aviso del detalle usa la misma medida. */
  queda(q: any): number {
    return this.ingreso(q) - this.reales(q);
  }
  /** "Te sobra el mes" / "Te sobra la Quincena 1", o "No te alcanza" si es negativo. */
  get etiquetaPeriodoPrevisto(): string {
    const periodo = this.quincenaActual === 'TODO' ? 'el mes' : `la ${this.etiquetaQuincena(this.quincenaActual)}`;
    return this.sobranteGlobal < 0 ? `No te alcanza ${periodo}` : `Te sobra ${periodo}`;
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
