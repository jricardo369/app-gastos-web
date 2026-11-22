import { Component, Input, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonIcon, IonButton, IonItem, IonInput, IonButtons, ModalController } from '@ionic/angular';
import { CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { BudgetService } from '../../core/services/budget.service';
import { AuthService } from '../../core/services/auth.service';
import { FiltroQuincena } from '../../core/models/budget.model';
import { addIcons } from 'ionicons';
import { chevronDownOutline, chevronUpOutline, chevronForwardOutline, logOutOutline, personCircleOutline, trashOutline, addOutline, trendingUpOutline, trendingDownOutline } from 'ionicons/icons';
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
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonIcon, IonButton, IonButtons, FormsModule, CurrencyPipe],
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

      <!-- 1. Selector de periodo: decide que muestra todo lo de abajo.
            En modo mensual no hay quincenas que elegir, asi que solo queda
            "Todo el mes". -->
      <div class="seg" role="group" aria-label="Periodo">
        <button type="button" class="seg-btn" [class.on]="quincenaActual==='TODO'" [attr.aria-pressed]="quincenaActual==='TODO'" (click)="setActual('TODO')">Todo el mes</button>
        @if (!esMensual) {
          <button type="button" class="seg-btn" [class.on]="quincenaActual==='Q1'" [attr.aria-pressed]="quincenaActual==='Q1'" (click)="setActual('Q1')">Quincena 1</button>
          <button type="button" class="seg-btn" [class.on]="quincenaActual==='Q2'" [attr.aria-pressed]="quincenaActual==='Q2'" (click)="setActual('Q2')">Quincena 2</button>
        }
      </div>

      <!-- 2. Resumen del periodo: cuanto recibis, cuanto pensabas gastar,
            cuanto gastaste de verdad y cuanto te queda. Los cuatro numeros
            salen del periodo elegido arriba: en "Todo el mes" es la suma de
            Q1+Q2 (o el mes completo), en una quincena es solo esa. -->
      <div class="card resumen" [class.res-cerca]="saldoCercaDeCero" [class.res-neg]="sobranteGlobal < 0">
        <div class="res-hero">
          <span class="lbl res-estado">
            <ion-icon [name]="sobranteGlobal < 0 ? 'trending-down-outline' : 'trending-up-outline'" aria-hidden="true"></ion-icon>
            {{ etiquetaPeriodoPrevisto }}
          </span>
          <b class="res-monto">{{ sobranteGlobal | currency:'MXN':'symbol':'1.0-0' }}</b>
          <span class="count">ingreso total − previstos − variables</span>
        </div>

        <!-- Medidor: cuanto de lo recibido ya se gasto. La marca dice donde
             deberia estar el gasto si se cumple lo planeado. -->
        <div class="med" [class.pasado]="gastoRealGlobal > planeadoGlobal" [class.excedido]="gastoRealGlobal > ingresoTotalGlobal">
          <div class="med-track" role="img"
               [attr.aria-label]="'Gastaste el ' + pctReal + '% de lo recibido. Lo planeado marca el ' + pctPlaneado + '%'">
            <div class="med-fill" [style.width.%]="anchoReal"></div>
          </div>
          <div class="med-mark" [style.left.%]="posMarca" aria-hidden="true"></div>
          <div class="med-pie">
            <span class="count">Gastaste {{ gastoRealGlobal | currency:'MXN':'symbol':'1.0-0' }} de {{ ingresoTotalGlobal | currency:'MXN':'symbol':'1.0-0' }} que recibiste</span>
            <span class="count"><i class="med-tick" aria-hidden="true"></i> planeado {{ pctPlaneado }}%</span>
          </div>
        </div>

        <!-- Las cuatro cifras del calculo de arriba, en el mismo orden:
             el ingreso menos lo previsto menos los variables es lo que sobra. -->
        <div class="res-stats">
          <div class="stat">
            <span class="lbl">Ingreso</span>
            <b class="money">{{ ingresoTotalGlobal | currency:'MXN':'symbol':'1.0-0' }}</b>
          </div>
          <div class="stat">
            <span class="lbl">Gastos previstos</span>
            <b class="money">{{ previstoGlobal | currency:'MXN':'symbol':'1.0-0' }}</b>
          </div>
          <div class="stat">
            <span class="lbl">Gastos variables</span>
            <b class="money">{{ imprevistosGlobal | currency:'MXN':'symbol':'1.0-0' }}</b>
          </div>
          <div class="stat">
            <span class="lbl">Gastos reales</span>
            <b class="money">{{ gastoRealGlobal | currency:'MXN':'symbol':'1.0-0' }}</b>
          </div>
        </div>
      </div>

      <!-- 3. Detalle por quincena -->
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
            <div class="row"><span>Gastos previstos</span><b>{{ previstos(q) | currency:'MXN':'symbol':'1.0-0' }}</b></div>
            <div class="row"><span>Gastado real</span><b>{{ reales(q) | currency:'MXN':'symbol':'1.0-0' }}</b></div>
            <div class="progress" role="progressbar" [attr.aria-valuenow]="pct(q)" aria-valuemin="0" aria-valuemax="100"
                 [attr.aria-label]="'Avance del previsto de la ' + etiquetaQuincena(q)">
              <div [style.width.%]="pct(q)"></div>
            </div>
            <span class="usage-rest">{{ pct(q) }}% del previsto</span>

            @if (pendiente(q) > 0) {
              <div class="row"><span>Falta por gastar</span><b>{{ pendiente(q) | currency:'MXN':'symbol':'1.0-0' }}</b></div>
            }

            <!-- Letrero de la quincena. Es la formula de la hoja, tal cual:
                 D3  = lo que traes = efectivo + vales + nomina (el bolsillo)
                 D12 = saldo total = ingreso total - gastos reales - imprevistos
                 =SI(D3<D12,"FALTA DINERO",SI(D3>D12,"TENGO DE MAS","TODO BIEN"))
                 Abajo se ven las cifras de la cuenta completa, para poder
                 revisarla sin salir a adivinarla. -->
            <div class="flag" [class.flag-sobra]="cuadre(q)==='sobra'" [class.flag-falta]="cuadre(q)==='falta'" [class.flag-ok]="cuadre(q)==='bien'">
              <div class="flag-linea">
                @if (cuadre(q)==='falta') {
                  <span>Falta dinero</span>
                } @else if (cuadre(q)==='sobra') {
                  <span>Tengo de más</span>
                } @else {
                  <span>Todo bien</span><b aria-hidden="true">✓</b>
                }
              </div>
              <span class="flag-detalle">
                Saldo total {{ saldoTotal(q) | currency:'MXN':'symbol':'1.0-0' }}
                = ingreso {{ getIngresoTotal(q) | currency:'MXN':'symbol':'1.0-0' }} − gastos reales {{ gastosReales(q) | currency:'MXN':'symbol':'1.0-0' }}
                − imprevistos {{ imprevistos(q) | currency:'MXN':'symbol':'1.0-0' }}
              </span>
            </div>

            <!-- El dinero del bolsillo va al final: es el dato que se corrige
                 de vez en cuando, no el que se consulta a diario.
                 Se edita en el lugar, igual que los ingresos: sin boton, se
                 guarda solo al cambiar el valor o al salir del campo. -->
            <hr class="sep" />
            <div class="money-edit">
              <div class="row">
                <span>Efectivo</span>
                <input class="cell-inp num" type="number" [(ngModel)]="editVals[q].efectivo" (change)="saveEdit(q)" (blur)="saveEdit(q)" aria-label="Monto de efectivo">
              </div>
              <div class="row">
                <span>Vales</span>
                <input class="cell-inp num" type="number" [(ngModel)]="editVals[q].vales" (change)="saveEdit(q)" (blur)="saveEdit(q)" aria-label="Monto de vales">
              </div>
              <div class="row">
                <span>Nómina</span>
                <input class="cell-inp num" type="number" [(ngModel)]="editVals[q].nomina" (change)="saveEdit(q)" (blur)="saveEdit(q)" aria-label="Monto de nómina">
              </div>
              <!-- Total de lo que hay en el bolsillo: la suma de los tres
                   campos de arriba, que es la cifra que usa el letrero. -->
              <div class="row money-total">
                <span>Total</span>
                <b>{{ ingreso(q) | currency:'MXN':'symbol':'1.0-0' }}</b>
              </div>
            </div>
          </div>
          }
        </div>
        }
      </div>

      <!-- 4. Deudas y deudores: van despues del detalle porque son otra cosa.
            El detalle es el dinero de la quincena; esto es lo que se debe
            fuera del ciclo, asi que no compite con el aviso de cada quincena. -->
      <span class="section-title">Cuentas pendientes</span>
      <div class="grid2">
        <button type="button" class="card sum sum-deuda" (click)="go('/tabs/deudas')">
          <div class="panel-title">
            <span class="lbl">Cuentas por pagar</span>
            <span class="count">{{ pagosPendientesCount }} pagos de tarjeta</span>
          </div>
          <b class="money">{{ (pagosPendientesMonto + deudaMarinaMensual) | currency:'MXN':'symbol':'1.0-0' }}</b>
          <ion-icon class="sum-chev" name="chevron-forward-outline" aria-hidden="true"></ion-icon>
        </button>
        <button type="button" class="card sum sum-deudor" (click)="go('/tabs/deudores')">
          <div class="panel-title">
            <span class="lbl">Me deben</span>
            <span class="count">{{ deudoresLista.length }} personas</span>
          </div>
          <b class="money">{{ deudoresTotal | currency:'MXN':'symbol':'1.0-0' }}</b>
          <ion-icon class="sum-chev" name="chevron-forward-outline" aria-hidden="true"></ion-icon>
        </button>
      </div>

      <!-- 7. Gastos por categoria -->
      <div class="card pad-card gastos-card" [class.collapsed]="gastosCollapsed">
        <button class="card-title" (click)="gastosCollapsed=!gastosCollapsed" [attr.aria-expanded]="!gastosCollapsed">
          <span><ion-icon [name]="gastosCollapsed ? 'chevron-down-outline' : 'chevron-up-outline'" aria-hidden="true"></ion-icon> Gastos por categoría</span>
          <span class="money">{{ (totalQ1+totalQ2) | currency:'MXN':'symbol':'1.0-0' }}</span>
        </button>
        @if(!gastosCollapsed){
          @if(esMensual){
            <!-- Modo mensual: una sola columna, el mes completo -->
            <div class="tbl head th-3"><span>Categoría</span><span class="num">Previsto</span><span class="num">Mes</span></div>
            @for (r of rows; track r.cat.id) { @if(r.total>0){
              <div class="tbl th-3">
                <span class="cat"><i [style.background]="r.cat.color" aria-hidden="true"></i>{{r.cat.nombre}}</span>
                <span class="num">{{r.total | currency:'MXN':'symbol':'1.0-0'}}</span>
                <span class="num bold">{{r.total | currency:'MXN':'symbol':'1.0-0'}}</span>
              </div>
            } }
            <div class="tbl total th-3"><span>Total</span><span class="num">{{totalQ1+totalQ2 | currency:'MXN':'symbol':'1.0-0'}}</span><span class="num">{{totalQ1+totalQ2 | currency:'MXN':'symbol':'1.0-0'}}</span></div>
          } @else if(quincenaActual==='TODO'){
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

      <!-- 8. Ingresos: oculta por defecto en una sola tarjeta unificada -->
      <div class="card pad-card ing-card-wrap" [class.collapsed]="ingresosHidden">
        <button class="card-title" (click)="toggleIngresos()" [attr.aria-expanded]="!ingresosHidden" [attr.aria-controls]="'ingresosPanel'">
          <span>
            <ion-icon [name]="ingresosHidden ? 'chevron-down-outline' : 'chevron-up-outline'" aria-hidden="true"></ion-icon>
            Ingresos
          </span>
          @if (ingresosHidden) { <span class="count">tocar para cargar o editar</span> }
          @else { <span class="money">{{ ingresoTotalGlobal | currency:'MXN':'symbol':'1.0-0' }}</span> }
        </button>
        @if(!ingresosHidden){
          <div class="sep"></div>
          <div class="grid2" id="ingresosPanel">
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
        }
      </div>
    </div>
  </ion-content>
  `,
    styles: [`
   :host{
     --c-primary:#0064fa; --c-primary-soft:#91beff; --c-primary-bg:#e1f5ff;
     --c-green:#5aa55a; --c-green-dark:#0f4b2d; --c-green-bg:#eef8ee;
     --c-text:#0f2744; --c-muted:#6b7f99; --c-border:#e8eff7;
     --c-shadow:0 10px 30px rgba(15,58,93,.07);
   }
   /* Cabecera clara sobre el degradado, como la referencia */
   .hdr ion-toolbar{--background:#e1f5ff;--color:var(--c-text);--border-width:0;box-shadow:none;padding:6px 4px}
   .hdr ion-button{--color:var(--c-text)}
   .hdr ion-icon{font-size:24px}
   .title-wrap{display:flex;flex-direction:column;line-height:1.2}
   .title-wrap span{font-size:20px;font-weight:800;letter-spacing:-.02em;color:var(--c-text)}
   .title-wrap small{font-size:11px;color:#5f7392;font-weight:600}
   .bg{--background:#eef6fb}
   .container{padding:16px;max-width:920px;margin:0 auto;display:flex;flex-direction:column;gap:16px}

   .card{background:#fff;border-radius:24px;box-shadow:var(--c-shadow);
     border:1px solid var(--c-border);overflow:hidden;transition:transform .2s ease,box-shadow .2s ease}
   .card:hover{box-shadow:0 14px 34px rgba(15,58,93,.1)}
   .panel-title{display:flex;flex-direction:column;gap:2px;min-width:0}
   .count{font-family:'Nunito',sans-serif;font-size:11px;font-weight:700;color:var(--c-muted);letter-spacing:.01em}
   .pad-card{padding:20px}
   ion-button{margin:0;min-height:38px;font-weight:800;--border-radius:999px}

   /* Segmento */
   .seg{display:flex;gap:6px;background:rgba(255,255,255,.8);padding:5px;
     border-radius:999px;border:1px solid #d6e6f7;backdrop-filter:blur(8px);box-shadow:0 4px 14px rgba(15,58,93,.05)}
   .seg-btn{
     flex:1;border:none;background:transparent;cursor:pointer;
     font-family:'Nunito',sans-serif;font-size:13px;font-weight:800;
     color:#5f7392;padding:9px 12px;border-radius:999px;min-height:42px;transition:all .18s ease;
   }
   .seg-btn.on{background:var(--c-primary);color:#fff;box-shadow:0 8px 18px rgba(0,100,250,.28)}
   .seg-btn:focus-visible{outline:2px solid var(--c-primary);outline-offset:2px}

   /* Resumen hero */
   .resumen{padding:24px;background:#fff;border:1px solid #e8eff7;position:relative;overflow:hidden}
   .res-hero{display:flex;flex-direction:column;gap:4px;position:relative}
   .res-estado{display:inline-flex;align-items:center;gap:6px;color:var(--c-green-dark);font-size:12px;font-weight:800;background:var(--c-green-bg);padding:6px 12px;border-radius:999px;width:fit-content}
   .res-estado ion-icon{font-size:15px}
   .res-monto{display:block;margin-top:8px;font-size:42px;line-height:1;
     letter-spacing:-.03em;color:var(--c-green-dark);font-weight:900;font-family:var(--font-display)}
   .res-cerca .res-monto{color:#b45309}
   .res-cerca .res-estado{color:#92400e;background:#fef3c7}
   .res-neg .res-monto{color:#dc2626}
   .res-neg .res-estado{color:#b91c1c;background:#fee2e2}

   /* Medidor */
   .med{position:relative;margin-top:20px}
   .med-track{height:10px;background:#e8f1fb;border-radius:999px;overflow:hidden}
   .med-fill{height:100%;background:var(--c-green);border-radius:999px;transition:width .35s ease}
   .med.pasado .med-fill{background:#f59e0b}
   .med.excedido .med-fill{background:#ef4444}
   .med-mark{position:absolute;top:-3px;left:0;width:3px;height:16px;border-radius:2px;background:var(--c-primary);transform:translateX(-1.5px);box-shadow:0 0 0 2px #fff}
   .med-pie{display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap;margin-top:10px;font-size:12px}
   .med-pie .count{display:inline-flex;align-items:center;gap:6px;font-weight:700;color:#35507a}
   .med-tick{width:3px;height:12px;background:var(--c-primary);border-radius:2px;display:inline-block;flex:none}

   /* Stats resumen */
   .res-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:20px;padding-top:20px;border-top:1px solid #eef3f9}
   .res-stats .stat{display:flex;flex-direction:column;gap:4px;min-width:0;padding:12px;border-radius:16px;border:1px solid transparent}
   .res-stats .stat:nth-child(1){background:#e1f5ff;border-color:#c6e6ff}
   .res-stats .stat:nth-child(2){background:#f2f9ff;border-color:#dcecfa}
   .res-stats .stat:nth-child(3){background:#eef8ee;border-color:#d3ebd3}
   .res-stats .stat:nth-child(4){background:#e3f3e3;border-color:#c6e2c6}
   .res-stats .stat:nth-child(1) .money,.res-stats .stat:nth-child(2) .money{color:#0047b3}
   .res-stats .stat:nth-child(3) .money,.res-stats .stat:nth-child(4) .money{color:var(--c-green-dark)}
   .res-stats .lbl{font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:#5f7392;font-weight:800}
   .res-stats .money{font-size:16px;font-weight:900;color:var(--c-text)}
   @media(max-width:600px){.res-stats{grid-template-columns:repeat(2,1fr)}}

   .usage-rest{color:var(--c-muted);font-size:12px;font-weight:600}
   .section-title{font-family:'Nunito',sans-serif;font-size:11px;font-weight:800;
     letter-spacing:.08em;color:#0064fa;text-transform:uppercase;padding:0 4px;margin-top:4px}

   /* Resumen cuentas / deudores */
   .sum{
     position:relative;display:flex;flex-direction:column;gap:8px;
     padding:20px 52px 20px 20px;
     cursor:pointer;background:#fff;border:1px solid var(--c-border);
     border-radius:24px;box-shadow:var(--c-shadow);text-align:left;font-family:inherit;transition:all .2s ease;
   }
   .sum b{font-size:24px;font-variant-numeric:tabular-nums;letter-spacing:-.02em;font-weight:900;color:var(--c-text)}
   .sum:hover{transform:translateY(-2px);box-shadow:0 14px 34px rgba(15,58,93,.11)}
   .sum:focus-visible{outline:2px solid var(--c-primary);outline-offset:2px}
   .sum-chev{position:absolute;top:50%;right:20px;transform:translateY(-50%);font-size:18px;color:#6b93c7}
   .sum-deuda{background:#eaf5ff;border-color:#cfe6fb}
   .sum-deuda .lbl{color:#0064fa}
   .sum-deuda b{color:#0047b3}
   .sum-deudor{background:#eef8ee;border-color:#cfe8cf}
   .sum-deudor .lbl{color:var(--c-green-dark)}
   .sum-deudor b{color:var(--c-green-dark)}
   .sum .lbl{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:var(--c-muted)}

   .grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
   @media(max-width:700px){.grid2{grid-template-columns:1fr}}

   /* Quincenas */
   .q-head{
     width:100%;display:flex;justify-content:space-between;align-items:center;gap:12px;
     min-height:60px;padding:16px 20px;cursor:pointer;border:none;
     border-bottom:1px solid #e3eefa;background:#eaf5ff;
     font-family:inherit;text-align:left;transition:background .15s ease;
   }
   .q-head:hover{background:#eaf6ff}
   .card.collapsed .q-head{border-bottom:none}
   .q-head:focus-visible{outline:2px solid var(--c-primary);outline-offset:-2px}
   .head-left{display:flex;gap:8px;align-items:center;color:#0064fa;font-size:12px;font-weight:800}
   .head-left ion-icon{color:#0064fa}
   .head-right{font-size:18px;font-weight:900;color:var(--c-text)}
   .q-body{padding:16px 20px 20px;display:flex;flex-direction:column;gap:12px;background:#fff}
   .sep{border:none;border-top:1px solid #eef3f9;margin:16px 0}

   .money-edit{display:flex;flex-direction:column;gap:4px}
   .money-edit .cell-inp{
     width:130px;text-align:right;font-size:15px;font-weight:800;font-variant-numeric:tabular-nums;color:var(--c-text);
     background:#f4faff;border:1px solid #cfe0ff;border-radius:12px;padding:8px 10px;font-family:inherit;transition:border-color .15s ease;
   }
   .money-edit .cell-inp:focus-visible{outline:none;border-color:var(--c-primary);background:#fff;box-shadow:0 0 0 3px rgba(0,100,250,.12)}
   .money-edit .cell-inp::-webkit-outer-spin-button,.money-edit .cell-inp::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
   .money-edit .cell-inp{appearance:textfield;-moz-appearance:textfield}
   .money-total{margin-top:8px;padding-top:12px;border-top:1px dashed #91beff}
   .money-total b{font-size:18px;font-variant-numeric:tabular-nums;font-weight:900;color:var(--c-primary)}

   /* Flags */
   .flag{display:flex;flex-direction:column;gap:4px;margin-top:16px;padding:12px 16px;
     border-radius:16px;font-size:13px;font-weight:700;border:1px solid #dbeafe;background:#f8fbff}
   .flag-linea{display:flex;justify-content:space-between;align-items:center;gap:8px}
   .flag-linea span{font-weight:800;font-size:14px}
   .flag b{font-variant-numeric:tabular-nums;font-weight:800}
   .flag-detalle{font-size:11px;font-weight:600;line-height:1.4;color:#486581}
   .flag-sobra{background:#fff8e6;color:#92400e;border-color:#fde68a}
   .flag-falta{background:#fff1f2;color:#be123c;border-color:#fecdd3}
   .flag-ok{background:#edf8ee;color:var(--c-green-dark);border-color:#b7ddb7}

   /* Gastos por categoría */
   .card-title{
     width:100%;display:flex;justify-content:space-between;align-items:center;gap:8px;
     text-align:left;background:none;border:none;cursor:pointer;font-family:inherit;
     font-size:15px;font-weight:900;color:var(--c-text);margin:0;padding:14px 16px;border-radius:16px;
   }
   .pad-card .card-title{margin:-4px 0 16px;background:#eef8ee;border:1px solid #d8ecd8}
   .card-title > span:first-child{display:flex;align-items:center;gap:8px;color:var(--c-green-dark)}
   .card-title ion-icon{color:var(--c-green-dark)}
   .card-title .money{color:var(--c-green-dark);font-weight:900}
   /* Gastos por categoría: tema azul para separarlo de Ingresos (verde) */
   .gastos-card .card-title{background:#eaf5ff;border-color:#d5e7fb}
   .gastos-card .card-title > span:first-child{color:#0047b3}
   .gastos-card .card-title ion-icon{color:#0064fa}
   .gastos-card .card-title .money{color:#0064fa}
   .gastos-card .tbl.head{background:#e1f5ff;color:#0047b3;border-color:#bcdcff}
   .gastos-card .tbl.total{background:#d6ecff;color:#003f9e;border-color:#a9cff5}
   /* Ingresos: tema verde */
   .ing-card-wrap{border-color:#cfe8cf;box-shadow:0 10px 30px rgba(90,165,90,.08)}
   .ing-card-wrap .card-title{background:#eef8ee;border-color:#d8ecd8}
   .card-title:focus-visible{outline:2px solid var(--c-primary);outline-offset:2px}
   .tbl{display:grid;grid-template-columns:1.3fr .7fr .7fr .8fr;gap:8px;padding:11px 10px;
     border-bottom:1px solid #f0f4f9;font-size:13px;align-items:center;border-radius:10px}
   .tbl:hover:not(.head):not(.total){background:#f8fbff}
   .tbl .num{text-align:right;font-variant-numeric:tabular-nums;font-weight:700;color:#17365d}
   .tbl.th-3{grid-template-columns:1.3fr .85fr .85fr}
   .tbl.head{font-size:11px;font-weight:800;color:var(--c-green-dark);background:#eef8ee;
     border-radius:12px;padding:11px 10px;border:1px solid #d8ecd8;letter-spacing:.02em;text-transform:uppercase}
   .tbl.total{font-weight:900;background:#e1f5ff;border-radius:12px;
     border:1px solid #bcdcff;margin-top:12px;padding:12px 10px;color:#0047b3}
   .cat{display:flex;align-items:center;gap:12px;min-width:0;font-weight:700;color:#243b53}
   .cat i{width:11px;height:11px;border-radius:50%;display:inline-block;flex:none;box-shadow:0 0 0 3px rgba(255,255,255,.9)}
   .bold{font-weight:900;color:#0047b3}

   /* Ingresos panel */
   .ing-card{box-shadow:none;border:1px solid #e3efe3;border-radius:18px}
   .ing-head{display:flex;justify-content:space-between;align-items:center;gap:12px;
     width:100%;min-height:54px;text-align:left;background:#eef8ee;border:none;
     padding:12px 16px;cursor:pointer;font-family:inherit;font-size:14px;color:var(--c-green-dark);border-bottom:1px solid #d8ecd8;font-weight:800}
   .ing-head:focus-visible{outline:2px solid var(--c-green);outline-offset:-2px}
   .ing-body{padding:16px;display:flex;flex-direction:column;gap:12px;background:#fff}
   .ing-list{display:grid;grid-template-columns:1fr 100px 36px;gap:8px;align-items:center;min-height:46px;padding:2px 0}
   .cell-inp{width:100%;border:1px solid #cfe0ff;border-radius:12px;padding:9px 10px;font-size:13px;background:#fbfdff;font-family:inherit;color:var(--c-text);font-weight:600}
   .cell-inp.num{text-align:right;font-variant-numeric:tabular-nums}
   .cell-inp:focus-visible{outline:none;border-color:var(--c-primary);box-shadow:0 0 0 3px rgba(0,100,250,.12)}
   .icon-btn{display:flex;align-items:center;justify-content:center;width:36px;height:36px;border:none;background:#f4f7fb;color:#7a93b5;cursor:pointer;border-radius:12px;transition:all .15s ease}
   .icon-btn ion-icon{font-size:16px}
   .icon-btn:hover{background:#fee2e2;color:#dc2626}
   .icon-btn:focus-visible{outline:2px solid #dc2626;outline-offset:1px}
   .add-ing{display:flex;justify-content:flex-end;margin-top:4px}
   .add-ing ion-button{--background:var(--c-primary);--color:#fff;--box-shadow:0 8px 18px rgba(0,100,250,.25)}

   .empty{padding:16px;text-align:center;color:#6b84a3;font-size:13px;background:#f4f9ff;border-radius:14px;font-weight:600;border:1px dashed #bfd7f5}
   .empty.sm{padding:12px;background:transparent;border:none}
   .lbl{font-size:12px;font-weight:800;color:#486581}
   .money{font-variant-numeric:tabular-nums}

   @media (prefers-reduced-motion: reduce){
     .seg-btn,.sum,.icon-btn,.med-fill,.card{transition:none}
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
  quincenaActual: FiltroQuincena = 'TODO';
  collapsed: Record<string, boolean> = { Q1: false, Q2: false, MEN: false };
  collapsedIng: Record<string, boolean> = { Q1: false, Q2: false, MEN: false };
  /** La seccion de ingresos arranca oculta: solo se entra a cargar o corregir. */
  ingresosHidden = true;
  toggleIngresos() { this.ingresosHidden = !this.ingresosHidden; }
  gastosCollapsed = true;
  /** En modo mensual no hay quincenas: los periodos son el mes completo. */
  get esMensual(): boolean { return this.budget.getConfig().tipoPago === 'mensual'; }
  get filteredQs(): string[] {
    if (this.quincenaActual !== 'TODO') return [this.quincenaActual];
    return this.budget.periodos();
  }
  /** Copia de los montos del bolsillo, para los inputs editables. */
  editVals: Record<string, any> = {};
  newIngConcepto: Record<string, string> = { Q1: '', Q2: '' };
  newIngMonto: Record<string, any> = { Q1: null, Q2: null };
  private manualToggle = new Set<string>();
  private manualIngToggle = new Set<string>();

  constructor(private budget: BudgetService, private auth: AuthService, private router: Router, private modalCtrl: ModalController, private cdr: ChangeDetectorRef) {
    addIcons({ chevronDownOutline, chevronUpOutline, chevronForwardOutline, logOutOutline, personCircleOutline, trashOutline, addOutline, trendingUpOutline, trendingDownOutline });
    const u = this.auth.currentUser(); if (u) this.userName = u.nombre;
    this.quincenaActual = this.budget.getQuincenaActual();
    this.periodoValido();
    this.applyAutoCollapse();
    this.refresh();
    this.budget.gastos$.subscribe(() => { this.refresh(); this.cdr.markForCheck(); });
    this.budget.imprevistos$.subscribe(() => this.refresh());
    this.budget.presupuesto$.subscribe(p => { this.presupuesto = p; this.refresh(); });
    this.budget.config$.subscribe(() => { this.periodoValido(); this.applyAutoCollapse(); this.refresh(); });
    this.budget.quincenaActual$.subscribe((q: any) => { this.quincenaActual = q; this.applyAutoCollapse(); });
  }
  /**
   * Si el periodo elegido ya no existe (por ejemplo quedo en "Quincena 2" y se
   * restablecio con tipo de pago mensual), se vuelve a "Todo el mes".
   */
  private periodoValido() {
    if (this.quincenaActual !== 'TODO' && !this.budget.periodos().includes(this.quincenaActual as any)) {
      this.quincenaActual = 'TODO';
      this.budget.setQuincenaActual('TODO');
    }
  }
  ionViewWillEnter() { this.refresh(); this.cdr.markForCheck(); }
  refresh() {
    this.presupuesto = this.budget.getPresupuesto();
    // Los inputs editables leen de aca, asi que se recargan con lo guardado:
    // si no, mostrarian 0 hasta tocar el campo. Segun el tipo de pago hay dos
    // quincenas o un solo bloque mensual.
    const montos: Record<string, any> = {};
    for (const q of this.budget.periodos()) {
      montos[q] = { efectivo: Number(this.efectivo(q)) || 0, vales: Number(this.vales(q)) || 0, nomina: Number(this.nomina(q)) || 0 };
    }
    this.editVals = montos;
    const cats = this.budget.categorias;
    // `total` suma todos los gastos del mes de esa categoria: en modo mensual
    // es la unica columna, en quincenas sirve para el "Total mes".
    this.rows = cats.map(c => {
      const q1 = this.budget.getGastos('Q1').filter(g => g.categoriaId === c.id).reduce((s, g) => s + g.previsto, 0);
      const q2 = this.budget.getGastos('Q2').filter(g => g.categoriaId === c.id).reduce((s, g) => s + g.previsto, 0);
      const men = this.budget.getGastos('MEN').filter(g => g.categoriaId === c.id).reduce((s, g) => s + g.previsto, 0);
      return { cat: c, q1, q2, men, total: this.esMensual ? men : q1 + q2 };
    }).filter(r => r.total);
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
  pendiente(q: any) { return this.budget.resumenQuincena(q).pendiente; }
  pct(q: any) { const r = this.budget.resumenQuincena(q); return r.previstos ? Math.round((r.reales / r.previstos) * 100) : 0; }
  isCollapsed(q: string) { return !!this.collapsed[q]; }
  isIngCollapsed(q: string) { return !!this.collapsedIng[q]; }
  go(url: string) { this.router.navigateByUrl(url); }

  /** "Q1" -> "Quincena 1", "Q2" -> "Quincena 2", "MEN" -> "Todo el mes". */
  etiquetaQuincena(q: string): string {
    if (q === 'Q1') return 'Quincena 1';
    if (q === 'Q2') return 'Quincena 2';
    return 'Todo el mes';
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
  /** Los variables (imprevistos) del periodo: pagados o no, tambien salen del bolsillo. */
  get imprevistosGlobal(): number {
    return this.filteredQs.reduce((s, q) => s + this.budget.getImprevistos(q as any).reduce((t, i: any) => t + (Number(i.importe) || 0), 0), 0);
  }
  /**
   * "Cuanto sobra": el INGRESO total del periodo menos lo previsto menos los
   * variables. Es el numero grande de la tarjeta de resumen, y por eso arriba
   * se ven las tres cifras que lo forman, en ese mismo orden.
   */
  get sobranteGlobal(): number {
    return this.ingresoTotalGlobal - this.previstoGlobal - this.imprevistosGlobal;
  }
  /**
   * Letrero de la quincena. Es la formula de la hoja, tal cual:
   *   D3  = lo que traes = efectivo + vales + nomina (el bolsillo)
   *   D12 = saldo total = ingreso total - gastos reales - gastos imprevistos
   *   =SI(D3<D12,"FALTA DINERO",SI(D3>D12,"TENGO DE MAS","TODO BIEN"))
   * Una sola funcion decide los tres casos, asi el mensaje y el color no se
   * pueden desfasar.
   * OJO con los nombres: `ingreso(q)` de este componente es el dinero del
   * bolsillo; el ingreso total sale de getIngresoTotal(q).
   */
  cuadre(q: any): 'falta' | 'sobra' | 'bien' {
    const D3 = this.ingreso(q);
    const D12 = this.saldoTotal(q);
    if (D3 < D12) return 'falta';
    if (D3 > D12) return 'sobra';
    return 'bien';
  }
  /**
   * D12 de la formula: saldo total = ingreso total - gastos reales - gastos
   * imprevistos. O sea, cuanto dinero deberia haber en el bolsillo.
   * "Gastos reales" son SOLO los gastos marcados como pagados: los imprevistos
   * ya pagados no se cuentan aca porque se descuentan completos abajo, y si
   * se restaran en los dos lados se descontarian dos veces.
   */
  saldoTotal(q: any): number {
    return this.getIngresoTotal(q) - this.gastosReales(q) - this.imprevistos(q);
  }
  /** Los gastos reales: lo gastado hasta ahora (importeReal), sin imprevistos. */
  gastosReales(q: any): number {
    return this.budget.getGastos(q).reduce((s: number, g: any) => s + (Number(g.importeReal) || 0), 0);
  }
  /** Los variables (imprevistos) de la quincena: pagados o no, tambien salen del bolsillo. */
  imprevistos(q: any): number {
    return this.budget.getImprevistos(q).reduce((s, i: any) => s + (Number(i.importe) || 0), 0);
  }
  /** "Te sobra el mes" / "Te sobra la Quincena 1", o "No te alcanza" si es negativo. */
  get etiquetaPeriodoPrevisto(): string {
    const periodo = this.quincenaActual === 'TODO'
      ? 'el mes'
      : this.etiquetaQuincena(this.quincenaActual) === 'Todo el mes' ? 'el mes' : `${this.etiquetaQuincena(this.quincenaActual)}`;
    const articulo = periodo === 'el mes' ? periodo : `la ${periodo}`;
    return this.sobranteGlobal < 0 ? `No te alcanza ${articulo}` : `Te sobra ${articulo}`;
  }
  /**
   * Cerca de cero: el saldo es menor al 5% del ingreso, o es exactamente
   * cero. Por debajo de ese umbral el saldo es real pero no alcanza para
   * nada, asi que conviene avisarlo antes de que se haga negativo. Solo
   * aplica cuando no es negativo; si ya es negativo va rojo.
   */
  get saldoCercaDeCero(): boolean {
    if (this.sobranteGlobal < 0) return false;
    return this.sobranteGlobal < this.ingresoTotalGlobal * 0.05;
  }
  /** Cuanto de lo recibido ya se gasto, en %: el numero bajo el medidor. */
  get pctReal(): number {
    return this.ingresoTotalGlobal ? Math.round((this.gastoRealGlobal / this.ingresoTotalGlobal) * 100) : 0;
  }
  /** Ancho de la barra: el % real, sin pasarse de 100. */
  get anchoReal(): number { return Math.min(100, this.pctReal); }
  /** Lo planeado: lo previsto mas los variables. Es lo que se deberia gastar. */
  get planeadoGlobal(): number {
    return this.previstoGlobal + this.imprevistosGlobal;
  }
  /** Donde deberia estar el gasto si se cumple lo planeado: la marca. */
  get pctPlaneado(): number {
    return this.ingresoTotalGlobal ? Math.round((this.planeadoGlobal / this.ingresoTotalGlobal) * 100) : 0;
  }
  /** Posicion de la marca, siempre visible dentro de la barra. */
  get posMarca(): number { return Math.min(99, Math.max(1, this.pctPlaneado)); }
  toggleCollapse(q: string) { this.collapsed[q] = !this.collapsed[q]; if (this.collapsed[q]) this.manualToggle.add(q); else this.manualToggle.delete(q); }
  toggleIngCollapse(q: string) { this.collapsedIng[q] = !this.collapsedIng[q]; if (this.collapsedIng[q]) this.manualIngToggle.add(q); else this.manualIngToggle.delete(q); }
  setActual(q: FiltroQuincena) { this.budget.setQuincenaActual(q); this.manualToggle.clear(); this.manualIngToggle.clear(); this.applyAutoCollapse(); }
  /**
   * Colapso automatico: con "Todo el mes" se ven todos los periodos; al elegir
   * uno, el otro se cierra para que no compita. En modo mensual solo hay uno,
   * asi que nunca se cierra.
   */
  private applyAutoCollapse() {
    const periodos = this.budget.periodos();
    const abiertos: Record<string, boolean> = {}; const abiertosIng: Record<string, boolean> = {};
    for (const q of periodos) {
      const otro = this.quincenaActual === 'TODO' ? false : this.quincenaActual !== q;
      abiertos[q] = otro; abiertosIng[q] = otro;
    }
    // Lo que el usuario abrio o cerro a mano se respeta.
    for (const q of periodos) {
      if (this.quincenaActual !== 'TODO') {
        if (this.manualToggle.has(q)) abiertos[q] = !!this.collapsed[q];
        if (this.manualIngToggle.has(q)) abiertosIng[q] = !!this.collapsedIng[q];
      }
    }
    this.collapsed = abiertos; this.collapsedIng = abiertosIng;
  }
  /**
   * Guarda los montos del bolsillo. Se llama solo al cambiar un campo o al
   * salir de el: no hay boton de guardar porque se edita en el lugar.
   */
  saveEdit(q: any) {
    const v = this.editVals[q];
    this.budget.patchPresupuesto(q, { efectivo: Number(v.efectivo) || 0, vales: Number(v.vales) || 0, nomina: Number(v.nomina) || 0 });
    this.refresh();
  }
  async openAddIngresoModal(q: any) {
    const modal = await this.modalCtrl.create({ component: IngresoModalComponent, cssClass: 'dialog-modal' });
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
