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
   .hdr ion-toolbar{--background:#ffffff;border-bottom:1px solid #f1f5f9}
   .title-wrap{display:flex;flex-direction:column;line-height:1.2}
   .title-wrap span{font-size:18px;font-weight:800;letter-spacing:-.02em;color:#0f172a}
   .title-wrap small{font-size:11px;color:#64748b;font-weight:500}
   .bg{--background:#eef2f7}
   .container{padding:var(--sp-3);max-width:920px;margin:0 auto;display:flex;flex-direction:column;gap:var(--sp-4)}

   /* Tarjetas estilo Stark Minimal (Bordes limpios, fondo blanco puro, elevación cero/sutil) */
   .card{background:#ffffff;border-radius:18px;box-shadow:0 1px 3px rgba(0,0,0,.02), 0 1px 2px rgba(0,0,0,.04);
     border:1px solid #e2e8f0;overflow:hidden;transition:border-color .2s ease}
   .card:hover{border-color:#cbd5e1}
   .panel-title{display:flex;flex-direction:column;gap:2px;min-width:0}
   .count{font-family:'Nunito', sans-serif;font-size:11px;font-weight:700;color:#94a3b8;letter-spacing:.02em}
   .pad-card{padding:var(--sp-5)}
   ion-button{margin:0;min-height:36px;font-weight:700;border-radius:var(--radius-pill)}

   /* Segmento tipo pill minimalista */
   .seg{display:flex;gap:4px;background:#f1f5f9;padding:4px;
     border-radius:var(--radius-pill);border:1px solid #e2e8f0}
   .seg-btn{
     flex:1;border:none;background:transparent;cursor:pointer;
     font-family:'Nunito', sans-serif;font-size:13px;font-weight:700;
     color:#64748b;padding:8px 12px;border-radius:var(--radius-pill);
     min-height:40px;transition:all .15s ease;
   }
   .seg-btn.on{background:#ffffff;color:#0f172a;box-shadow:0 1px 3px rgba(0,0,0,.08)}
   .seg-btn:focus-visible{outline:2px solid #0f172a;outline-offset:2px}

   /* Resumen hero minimal */
   .resumen{padding:var(--sp-6);background:#ffffff}
   .res-hero{display:flex;flex-direction:column;gap:4px}
   .res-estado{display:inline-flex;align-items:center;gap:6px;color:#059669;font-size:12px;font-weight:800;background:#ecfdf5;padding:4px 10px;border-radius:var(--radius-pill);width:fit-content}
   .res-estado ion-icon{font-size:15px}
   .res-monto{display:block;margin-top:var(--sp-2);font-size:40px;line-height:1;
     letter-spacing:-.03em;color:#0f172a;font-weight:900;font-family:var(--font-display)}
   .res-cerca .res-monto{color:#d97706}
   .res-cerca .res-estado{color:#d97706;background:#fffbeb}
   .res-neg .res-monto{color:#dc2626}
   .res-neg .res-estado{color:#dc2626;background:#fef2f2}

   /* Medidor minimal */
   .med{position:relative;margin-top:var(--sp-5)}
   .med-track{height:8px;background:#f1f5f9;border-radius:var(--radius-pill);overflow:hidden}
   .med-fill{height:100%;background:#059669;border-radius:var(--radius-pill);
     transition:width .3s ease}
   .med.pasado .med-fill{background:#d97706}
   .med.excedido .med-fill{background:#dc2626}
   .med-mark{position:absolute;top:-3px;left:0;width:2px;height:14px;border-radius:1px;
     background:#0f172a;transform:translateX(-1px)}
   .med-pie{display:flex;justify-content:space-between;align-items:baseline;gap:var(--sp-2);
     flex-wrap:wrap;margin-top:8px;font-size:12px}
   .med-pie .count{display:inline-flex;align-items:center;gap:6px;font-weight:700;color:#475569}
   .med-tick{width:2px;height:10px;background:#0f172a;border-radius:1px;
     display:inline-block;flex:none}

   /* Cifras inferiores clean */
   .res-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:var(--sp-3);margin-top:var(--sp-6);padding-top:var(--sp-5);border-top:1px solid #f1f5f9}
   .res-stats .stat{display:flex;flex-direction:column;gap:3px;min-width:0;padding:var(--sp-2) var(--sp-3);background:#f8fafc;border-radius:12px;border:1px solid #f1f5f9}
   .res-stats .lbl{font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:#64748b}
   .res-stats .money{font-size:15px;font-weight:800;color:#0f172a}

   @media(max-width:600px){
     .res-stats{grid-template-columns:repeat(2,1fr)}
   }

   .usage-rest{color:#64748b;font-size:12px;font-weight:600}

   .section-title{font-family:'Nunito',sans-serif;font-size:11px;font-weight:800;
     letter-spacing:.08em;color:#64748b;text-transform:uppercase;padding:0 4px;margin-top:var(--sp-2)}

   /* Tarjetas de cuentas pendientes */
   .sum{
     position:relative;display:flex;flex-direction:column;gap:var(--sp-2);
     padding:var(--sp-5) calc(var(--sp-4) + 28px) var(--sp-5) var(--sp-5);
     cursor:pointer;background:#ffffff;border:1px solid #e2e8f0;
     border-radius:18px;text-align:left;
     font-family:inherit;transition:all .15s ease;
   }
   .sum b{font-size:22px;font-variant-numeric:tabular-nums;letter-spacing:-.02em;font-weight:900;color:#0f172a}
   .sum:hover{background:#f8fafc;border-color:#cbd5e1}
   .sum:focus-visible{outline:2px solid #0f172a;outline-offset:2px}
   .sum-chev{position:absolute;top:50%;right:var(--sp-4);transform:translateY(-50%);
     font-size:18px;color:#94a3b8}

   .ing-section{display:flex;flex-direction:column;gap:var(--sp-2)}
   .grid2{display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-4)}
   @media(max-width:700px){.grid2{grid-template-columns:1fr}}

   /* Cabeceras de quincena */
   .q-head{
     width:100%;display:flex;justify-content:space-between;align-items:center;gap:var(--sp-3);
     min-height:60px;padding:var(--sp-4) var(--sp-5);cursor:pointer;border:none;
     border-bottom:1px solid #f1f5f9;
     background:#ffffff;font-family:inherit;text-align:left;transition:background .15s ease;
   }
   .q-head:hover{background:#f8fafc}
   .card.collapsed .q-head{border-bottom:none}
   .q-head:focus-visible{outline:2px solid #0f172a;outline-offset:-2px}
   .head-left{display:flex;gap:8px;align-items:center;color:#64748b;font-size:12px;font-weight:700}
   .head-right{font-size:17px;font-weight:900;color:#0f172a}
   .q-body{padding:var(--sp-4) var(--sp-5) var(--sp-5);display:flex;flex-direction:column;gap:var(--sp-3)}

   .sep{border:none;border-top:1px solid #f1f5f9;margin:var(--sp-4) 0}

   .money-edit{display:flex;flex-direction:column;gap:4px}
   .money-edit .cell-inp{
     width:130px;text-align:right;font-size:15px;font-weight:800;
     font-variant-numeric:tabular-nums;color:#0f172a;
     background:#f8fafc;border:1px solid #e2e8f0;
     border-radius:10px;padding:8px 10px;font-family:inherit;
     transition:border-color .15s ease;
   }
   .money-edit .cell-inp:focus-visible{outline:none;border-color:#0f172a;background:#ffffff}
   .money-edit .cell-inp::-webkit-outer-spin-button,
   .money-edit .cell-inp::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
   .money-edit .cell-inp{appearance:textfield;-moz-appearance:textfield}
   .money-total{margin-top:var(--sp-2);padding-top:var(--sp-3);
     border-top:1px solid #e2e8f0}
   .money-total b{font-size:18px;font-variant-numeric:tabular-nums;font-weight:900;color:#0f172a}

   /* Banners minimales */
   .flag{
     display:flex;flex-direction:column;gap:4px;
     margin-top:var(--sp-4);padding:12px var(--sp-4);
     border-radius:12px;font-size:13px;font-weight:700;
     border:1px solid #e2e8f0;background:#f8fafc;
   }
   .flag-linea{display:flex;justify-content:space-between;align-items:center;gap:var(--sp-2)}
   .flag-linea span{font-weight:800;font-size:14px}
   .flag b{font-variant-numeric:tabular-nums;font-weight:800}
   .flag-detalle{font-size:11px;font-weight:600;line-height:1.4;color:#64748b}
   .flag-sobra{background:#fffbeb;color:#d97706;border-color:#fef3c7}
   .flag-falta{background:#fef2f2;color:#dc2626;border-color:#fee2e2}
   .flag-ok{background:#ecfdf5;color:#059669;border-color:#d1fae5}

   /* Tablas y tarjetas de categorías */
   .card-title{
     width:100%;display:flex;justify-content:space-between;align-items:center;gap:var(--sp-2);
     text-align:left;background:none;border:none;cursor:pointer;font-family:inherit;
     font-size:15px;font-weight:900;color:#0f172a;margin:0 0 var(--sp-4);padding:0;
   }
   .card-title > span:first-child{display:flex;align-items:center;gap:8px}
   .card-title:focus-visible{outline:2px solid #0f172a;outline-offset:2px}
   .tbl{display:grid;grid-template-columns:1.3fr .7fr .7fr .8fr;gap:var(--sp-2);padding:10px 4px;
     border-bottom:1px solid #f1f5f9;font-size:13px;align-items:center}
   .tbl .num{text-align:right;font-variant-numeric:tabular-nums;font-weight:700;color:#0f172a}
   .tbl.th-3{grid-template-columns:1.3fr .85fr .85fr}
   .tbl.head{font-size:11px;font-weight:800;color:#64748b;background:#f8fafc;
     border-radius:10px;padding:10px 8px;border-bottom:none;letter-spacing:.02em}
   .tbl.total{font-weight:900;background:#f8fafc;border-radius:10px;
     border-bottom:none;margin-top:var(--sp-3);padding:12px 8px;color:#0f172a}
   .cat{display:flex;align-items:center;gap:var(--sp-3);min-width:0;font-weight:600;color:#334155}
   .cat i{width:9px;height:9px;border-radius:50%;display:inline-block;flex:none}
   .bold{font-weight:900;color:#0f172a}

   .ing-toggle{
     width:100%;display:flex;justify-content:space-between;align-items:center;gap:var(--sp-3);
     min-height:58px;padding:var(--sp-3) var(--sp-5);cursor:pointer;
     background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;
     font-family:inherit;text-align:left;color:#0f172a;
     font-weight:800;transition:all .15s ease;
   }
   .ing-toggle:hover{background:#f8fafc;border-color:#cbd5e1}
   .ing-toggle:focus-visible{outline:2px solid #0f172a;outline-offset:2px}
   .t-left{display:flex;align-items:center;gap:8px}

   .ing-head{display:flex;justify-content:space-between;align-items:center;gap:var(--sp-3);
     width:100%;min-height:54px;text-align:left;background:none;border:none;
     padding:var(--sp-3) var(--sp-4);cursor:pointer;font-family:inherit;
     font-size:14px;color:#0f172a;border-bottom:1px solid #f1f5f9;font-weight:800}
   .ing-head:focus-visible{outline:2px solid #0f172a;outline-offset:-2px}
   .ing-body{padding:var(--sp-4);display:flex;flex-direction:column;gap:var(--sp-3)}
   .ing-list{display:grid;grid-template-columns:1fr 100px 36px;gap:var(--sp-2);
     align-items:center;min-height:46px;padding:2px 0}
   .cell-inp{width:100%;border:1px solid #e2e8f0;border-radius:10px;
     padding:9px 10px;font-size:13px;background:#ffffff;font-family:inherit;color:#0f172a;font-weight:600}
   .cell-inp.num{text-align:right;font-variant-numeric:tabular-nums}
   .cell-inp:focus-visible{outline:none;border-color:#0f172a}
   .icon-btn{display:flex;align-items:center;justify-content:center;width:36px;height:36px;
     border:none;background:transparent;color:#94a3b8;cursor:pointer;
     border-radius:10px;transition:background .15s ease,color .15s ease}
   .icon-btn ion-icon{font-size:16px}
   .icon-btn:hover{background:#fef2f2;color:#dc2626}
   .icon-btn:focus-visible{outline:2px solid #dc2626;outline-offset:1px}
   .add-ing{display:flex;justify-content:flex-end;margin-top:var(--sp-3)}

   .empty{padding:var(--sp-4);text-align:center;color:#94a3b8;font-size:13px;
     background:#f8fafc;border-radius:12px;font-weight:600}
   .empty.sm{padding:var(--sp-3);background:transparent}

   @media (prefers-reduced-motion: reduce){
     .seg-btn,.sum,.icon-btn,.med-fill,.card,.ing-toggle{transition:none}
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
