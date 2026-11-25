import { Component, inject, Input, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonInput, IonButtons, IonIcon, IonSelect, IonSelectOption, IonText, ModalController, AlertController, ToastController } from '@ionic/angular';
import { CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { BudgetService } from '../../core/services/budget.service';
import { addIcons } from 'ionicons';
import { checkmarkCircle, cashOutline, addOutline, chevronDownOutline, chevronUpOutline, chevronForwardOutline, walletOutline, cardOutline, alertCircleOutline } from 'ionicons/icons';

type VistaCuentas = 'deudas' | 'deudores';

@Component({
  selector: 'app-tc-modal',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonInput, IonButton, IonButtons, IonText, FormsModule],
  template: `
  <ion-header><ion-toolbar><ion-title>{{ titulo }}</ion-title><ion-buttons slot="end"><ion-button (click)="cancel()">Cerrar</ion-button></ion-buttons></ion-toolbar></ion-header>
  <ion-content class="ion-padding">
    <ion-input label="Fecha" labelPlacement="stacked" type="date" [(ngModel)]="fecha"></ion-input>
    @if(showTipo){ <ion-input label="Tipo" labelPlacement="stacked" [(ngModel)]="tipo" placeholder="Ej. General"></ion-input> }
    <ion-input label="Descripción" labelPlacement="stacked" [(ngModel)]="desc" placeholder="Ej. TV"></ion-input>
    <ion-input label="Monto ($)" labelPlacement="stacked" type="number" [(ngModel)]="monto"></ion-input>
    <ion-input label="Mensualidades (total)" labelPlacement="stacked" type="number" [(ngModel)]="mensualidad"></ion-input>
    @if(isEdit){ <ion-input label="Mensualidades pagadas" labelPlacement="stacked" type="number" [(ngModel)]="pagadas"></ion-input> }
    @if(error){ <ion-text color="danger" class="err">{{ error }}</ion-text> }
    <div style="display:flex;gap:8px;margin-top:20px">
      @if(isEdit){ <ion-button color="danger" fill="outline" (click)="remove()" style="flex:1">Eliminar</ion-button> }
      <ion-button class="btn-add" (click)="save()" style="flex:1">{{isEdit?'Guardar':'Agregar'}}</ion-button>
    </div>
  </ion-content>
  `,
  styles: [`.err{display:block;margin:8px 0 0;font-size:13px}`],
})
export class TcModalComponent {
  private modalCtrl = inject(ModalController);
  @Input() titulo: string = 'Nuevo pago';
  @Input() fecha: string = new Date().toISOString().slice(0,10);
  @Input() desc: string = '';
  @Input() monto: any = null;
  @Input() mensualidad: any = 1;
  @Input() pagadas: any = 0;
  @Input() tipo: string = '';
  @Input() showTipo: boolean = false;
  @Input() isEdit: boolean = false;
  error = '';
  cancel(){ this.modalCtrl.dismiss(null); }
  remove(){ this.modalCtrl.dismiss({ remove: true }); }
  save(){
    if (!this.desc?.trim()) { this.error = 'Escribe una descripción'; return; }
    if (this.monto === null || this.monto === '' || Number(this.monto) <= 0) { this.error = 'Escribe un monto válido'; return; }
    this.error = '';
    this.modalCtrl.dismiss({ fecha:this.fecha, desc:this.desc.trim(), monto:Number(this.monto), mensualidad:Number(this.mensualidad)||1, pagadas:Number(this.pagadas)||0, tipo:this.tipo });
  }
}

@Component({
  selector: 'app-deudor-simple-modal',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonInput, IonButton, IonButtons, IonText, FormsModule],
  template: `
  <ion-header><ion-toolbar><ion-title>{{ isEdit ? 'Editar deudor' : 'Nuevo deudor' }}</ion-title><ion-buttons slot="end"><ion-button (click)="cancel()">Cerrar</ion-button></ion-buttons></ion-toolbar></ion-header>
  <ion-content class="ion-padding">
    <ion-input label="Fecha alta" labelPlacement="stacked" type="date" [(ngModel)]="fecha" [disabled]="true"></ion-input>
    <ion-input label="Fecha vencimiento" labelPlacement="stacked" type="date" [(ngModel)]="fechaVenc"></ion-input>
    <ion-input label="Descripción" labelPlacement="stacked" [(ngModel)]="desc" placeholder="Ej. Préstamo a Juan"></ion-input>
    <ion-input label="Monto ($)" labelPlacement="stacked" type="number" [(ngModel)]="monto"></ion-input>
    @if(error){ <ion-text color="danger" class="err">{{ error }}</ion-text> }
    <div style="display:flex;gap:8px;margin-top:20px">
      @if(isEdit){ <ion-button color="danger" fill="outline" (click)="remove()" style="flex:1">Eliminar</ion-button> }
      <ion-button class="btn-add" (click)="save()" style="flex:1">{{isEdit?'Guardar':'Agregar'}}</ion-button>
    </div>
  </ion-content>
  `,
  styles: [`.err{display:block;margin:8px 0 0;font-size:13px}`],
})
export class DeudorSimpleModalComponent {
  private modalCtrl = inject(ModalController);
  @Input() fecha: string = new Date().toISOString().slice(0,10);
  @Input() fechaVenc: string = '';
  @Input() desc: string = '';
  @Input() monto: any = null;
  @Input() isEdit: boolean = false;
  error = '';
  cancel(){ this.modalCtrl.dismiss(null); }
  remove(){ this.modalCtrl.dismiss({ remove: true }); }
  save(){
    if (!this.desc?.trim()) { this.error = 'Escribe una descripción'; return; }
    if (this.monto === null || this.monto === '' || Number(this.monto) <= 0) { this.error = 'Escribe un monto válido'; return; }
    this.error = '';
    this.modalCtrl.dismiss({ fecha:this.fecha, fechaVenc:this.fechaVenc, desc:this.desc.trim(), monto:Number(this.monto)});
  }
}

@Component({
  selector: 'app-cuentas',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons, IonIcon, IonSelect, IonSelectOption, CurrencyPipe],
  template: `
  <ion-header class="hdr">
    <ion-toolbar>
      <ion-title>Cuentas</ion-title>
      <ion-buttons slot="end">
        <ion-select aria-label="Tipo de cuenta" interface="popover" [value]="vista" (ionChange)="onVistaChange($event)">
          <ion-select-option value="deudas">Deudas</ion-select-option>
          <ion-select-option value="deudores">Me deben</ion-select-option>
        </ion-select>
      </ion-buttons>
    </ion-toolbar>
  </ion-header>
  <ion-content class="bg">
    <div class="container">
      @if (vista === 'deudas') {
        <div class="card head-card">
          <span class="lbl">Deudas generales</span>
          <b class="money big">{{ totalLa | currency:'MXN':'symbol':'1.0-0' }}</b>
          <div class="stats">
            <div class="stat"><span class="lbl">Activas</span><b class="money">{{ deudasActivas.length }}</b></div>
            <div class="stat"><span class="lbl">Mensual</span><b class="money">{{ deudaMarinaMensual | currency:'MXN':'symbol':'1.0-0' }}</b></div>
            <div class="stat"><span class="lbl">Liquidadas</span><b class="money ok">{{ historialMarina.length }}</b></div>
          </div>
        </div>

        <div class="card">
          <header class="head">
            <div class="panel-title">
              <span class="lbl">Detalle de deudas</span>
              <span class="count">{{ deudasActivas.length }} activas</span>
            </div>
            <ion-button size="small" class="btn-add" (click)="openAddMarinaModal()">
              <ion-icon slot="start" name="add-outline" aria-hidden="true"></ion-icon>Agregar
            </ion-button>
          </header>
          <div class="list">
            @for (d of deudasActivas; track d.id){
              <div class="li row-click" role="button" tabindex="0"
                   [attr.aria-label]="'Editar ' + d.nombre" (click)="editMarina(d)" (keydown.enter)="editMarina(d)">
                <div class="li-body">
                  <span class="li-title">{{ d.nombre }}</span>
                  <span class="li-sub">
                    <span>{{ fechaCorta(d.fechaInicio) }}</span>
                    @if (d.tipo) { <span>· {{ d.tipo }}</span> }
                    <span class="li-steps num">{{ d.pagados }}/{{ d.pagos }} pagos</span>
                  </span>
                  <div class="bar" role="progressbar" [attr.aria-valuenow]="pctPagado(d)" aria-valuemin="0" aria-valuemax="100"
                       [attr.aria-label]="'Pagos de ' + d.nombre">
                    <div class="bar-fill" [style.width.%]="pctPagado(d)"></div>
                  </div>
                </div>
                <div class="li-right">
                  <span class="li-amount num">{{ d.saldo | currency:'MXN':'symbol':'1.0-0' }}</span>
                  <span class="li-sub num">{{ d.mensualidad | currency:'MXN':'symbol':'1.0-0' }}/mes</span>
                </div>
                <button type="button" class="icon-btn" (click)="toMarinaHistorial(d); $event.stopPropagation()"
                        [attr.aria-label]="'Terminar la deuda ' + d.nombre + ' y enviarla al historial'">
                  <ion-icon name="cash-outline" aria-hidden="true"></ion-icon>
                </button>
                <ion-icon class="li-chev" name="chevron-forward-outline" aria-hidden="true"></ion-icon>
              </div>
            }
            @if(deudasActivas.length===0){
              <div class="empty">
                <ion-icon name="wallet-outline" aria-hidden="true"></ion-icon>
                <p>Sin deudas registradas</p>
                <ion-button size="small" class="btn-add" (click)="openAddMarinaModal()">Agregar deuda</ion-button>
              </div>
            }
          </div>
          <div class="card-foot">
            <ion-button size="small" fill="clear" (click)="historialMarinaVisible=!historialMarinaVisible">
              <ion-icon slot="start" [name]="historialMarinaVisible ? 'chevron-up-outline' : 'chevron-down-outline'" aria-hidden="true"></ion-icon>
              {{historialMarinaVisible?'Ocultar historial':'Ver historial de pagos'}}
            </ion-button>
          </div>
          @if(historialMarinaVisible){
          <div class="sublist">
            @for (d of historialMarina; track d.id){
              <div class="li sm">
                <div class="li-body">
                  <span class="li-title">{{ d.nombre }}</span>
                  <span class="li-sub">{{ fechaCorta(d.fechaInicio) }} · {{ d.pagos }} pagos</span>
                </div>
                <span class="li-amount num">{{ d.saldo | currency:'MXN':'symbol':'1.0-0' }}</span>
                <ion-icon name="checkmark-circle" class="ok" aria-hidden="true"></ion-icon>
              </div>
            }
            @if(historialMarina.length===0){ <div class="empty sm">Sin historial</div> }
          </div>
          }
        </div>

        <div class="card">
          <header class="head">
            <div class="panel-title">
              <span class="lbl">Pagos de tarjeta</span>
              <span class="count">{{ pagosActivos.length }} activos</span>
            </div>
            <ion-button size="small" class="btn-add" (click)="openAddTCModal()">
              <ion-icon slot="start" name="add-outline" aria-hidden="true"></ion-icon>Agregar
            </ion-button>
          </header>
          <div class="list">
            @for (p of pagosActivos; track p.id){
              <div class="li row-click" role="button" tabindex="0"
                   [attr.aria-label]="'Editar ' + p.desc" (click)="editTC(p)" (keydown.enter)="editTC(p)">
                <div class="li-body">
                  <span class="li-title">{{ p.desc }}</span>
                  <span class="li-sub">
                    <span>{{ fechaCorta(p.fechaCompra) }}</span>
                    <span class="li-steps num">{{ p.mensualidadPagada }}/{{ p.mensualidad }} pagos</span>
                  </span>
                  <div class="bar" role="progressbar" [attr.aria-valuenow]="pctPagadoP(p)" aria-valuemin="0" aria-valuemax="100"
                       [attr.aria-label]="'Mensualidades de ' + p.desc">
                    <div class="bar-fill" [style.width.%]="pctPagadoP(p)"></div>
                  </div>
                </div>
                <div class="li-right">
                  <span class="li-amount num">{{ p.montoTotal | currency:'MXN':'symbol':'1.0-0' }}</span>
                  <span class="li-sub num">{{ p.monto | currency:'MXN':'symbol':'1.0-0' }}/mes</span>
                </div>
                <button type="button" class="icon-btn" (click)="toHistorial(p); $event.stopPropagation()"
                        [attr.aria-label]="'Terminar el pago ' + p.desc + ' y enviarlo al historial'">
                  <ion-icon name="cash-outline" aria-hidden="true"></ion-icon>
                </button>
                <ion-icon class="li-chev" name="chevron-forward-outline" aria-hidden="true"></ion-icon>
              </div>
            }
            @if(pagosActivos.length===0){
              <div class="empty">
                <ion-icon name="card-outline" aria-hidden="true"></ion-icon>
                <p>Sin pagos de tarjeta registrados</p>
                <ion-button size="small" class="btn-add" (click)="openAddTCModal()">Agregar pago</ion-button>
              </div>
            }
          </div>
          <div class="totals">
            <div class="tot"><span class="lbl">Mensual</span><b class="money">{{deudaMensual | currency:'MXN':'symbol':'1.0-0'}}</b></div>
            <div class="tot"><span class="lbl">Total</span><b class="money">{{deudaGeneral | currency:'MXN':'symbol':'1.0-0'}}</b></div>
            <div class="tot"><span class="lbl">Pagado</span><b class="money ok">{{pagadoTC | currency:'MXN':'symbol':'1.0-0'}}</b></div>
          </div>
          <div class="card-foot">
            <ion-button size="small" fill="clear" (click)="historialVisible=!historialVisible">
              <ion-icon slot="start" [name]="historialVisible ? 'chevron-up-outline' : 'chevron-down-outline'" aria-hidden="true"></ion-icon>
              {{historialVisible?'Ocultar historial':'Ver historial de pagos'}}
            </ion-button>
          </div>
          @if(historialVisible){
          <div class="sublist">
            @for (p of pagosPagados; track p.id){
              <div class="li sm">
                <div class="li-body">
                  <span class="li-title">{{ p.desc }}</span>
                  <span class="li-sub">{{ fechaCorta(p.fechaCompra) }} · {{ p.mensualidad }} mensualidades</span>
                </div>
                <span class="li-amount num">{{ p.montoTotal | currency:'MXN':'symbol':'1.0-0' }}</span>
                <ion-icon name="checkmark-circle" class="ok" aria-hidden="true"></ion-icon>
              </div>
            }
            @if(pagosPagados.length===0){ <div class="empty sm">Sin historial</div> }
          </div>
          }
        </div>
      } @else {
        <div class="card head-card">
          <span class="lbl">Total por cobrar</span>
          <b class="money big">{{ total | currency:'MXN':'symbol':'1.0-0' }}</b>
          <div class="stats">
            <div class="stat"><span class="lbl">Personas</span><b class="money">{{ activos.length }}</b></div>
            <div class="stat"><span class="lbl">Vencidos</span><b class="money" [class.warn]="vencidos.length > 0">{{ vencidos.length }}</b></div>
            <div class="stat"><span class="lbl">Cobrado</span><b class="money ok">{{ cobrado | currency:'MXN':'symbol':'1.0-0' }}</b></div>
          </div>
        </div>

        <div class="card">
          <header class="head">
            <div class="panel-title">
              <span class="lbl">Pendientes</span>
              <span class="count">{{ activos.length }} por cobrar</span>
            </div>
            <ion-button size="small" class="btn-add" (click)="openAdd()">
              <ion-icon slot="start" name="add-outline" aria-hidden="true"></ion-icon>Agregar
            </ion-button>
          </header>
          <div class="list">
            @for (d of activos; track d.id){
              <div class="li row-click" role="button" tabindex="0"
                   [attr.aria-label]="'Editar ' + d.nombre" (click)="edit(d)" (keydown.enter)="edit(d)">
                <div class="li-body">
                  <span class="li-title">{{ d.nombre }}</span>
                  <span class="li-sub" [class.warn-txt]="estaVencido(d)">
                    @if(estaVencido(d)){ <ion-icon name="alert-circle-outline" aria-hidden="true"></ion-icon> }
                    Alta {{ fechaCorta(d.fechaInicio) }}@if (d.fechaFin) { · vence {{ fechaCorta(d.fechaFin) }} }
                  </span>
                </div>
                <span class="li-amount num">{{ d.saldo | currency:'MXN':'symbol':'1.0-0' }}</span>
                <button type="button" class="icon-btn" (click)="toHistorialDeudor(d); $event.stopPropagation()"
                        [attr.aria-label]="'Marcar ' + d.nombre + ' como cobrado'">
                  <ion-icon name="cash-outline" aria-hidden="true"></ion-icon>
                </button>
                <ion-icon class="li-chev" name="chevron-forward-outline" aria-hidden="true"></ion-icon>
              </div>
            }
            @if(activos.length===0){
              <div class="empty">
                <ion-icon name="wallet-outline" aria-hidden="true"></ion-icon>
                <p>Nadie te debe nada</p>
                <ion-button size="small" class="btn-add" (click)="openAdd()">Agregar deudor</ion-button>
              </div>
            }
          </div>
          <div class="card-foot">
            <ion-button size="small" fill="clear" (click)="historialVisible=!historialVisible">
              <ion-icon slot="start" [name]="historialVisible ? 'chevron-up-outline' : 'chevron-down-outline'" aria-hidden="true"></ion-icon>
              {{historialVisible?'Ocultar historial':'Ver historial de cobros'}}
            </ion-button>
          </div>
          @if(historialVisible){
          <div class="sublist">
            @for (d of historial; track d.id){
              <div class="li sm">
                <div class="li-body">
                  <span class="li-title">{{ d.nombre }}</span>
                  <span class="li-sub">{{ fechaCorta(d.fechaInicio) }}</span>
                </div>
                <span class="li-amount num">{{ d.saldo | currency:'MXN':'symbol':'1.0-0' }}</span>
                <ion-icon name="checkmark-circle" class="ok" aria-hidden="true"></ion-icon>
              </div>
            }
            @if(historial.length===0){ <div class="empty sm">Sin historial</div> }
          </div>
          }
        </div>
      }
    </div>
  </ion-content>
  `,
  styles: [`
  .hdr ion-select{--color:#fff;--placeholder-color:rgba(255,255,255,.85);--highlight-color-focused:#fff;max-width:132px;font-size:13px;font-weight:700}
  .hdr ion-select::part(icon){color:#fff;opacity:1}
  .bg{--background:var(--app-bg)}
  .container{padding:var(--sp-3);max-width:900px;margin:0 auto;display:flex;flex-direction:column;gap:var(--sp-3)}
  .card{background:var(--surface);border-radius:var(--radius-lg);box-shadow:var(--shadow);border:1px solid var(--border);overflow:hidden}

  .head-card{display:flex;flex-direction:column;gap:2px;padding:12px 14px!important;
    background:var(--c-primary-bg);border-color:#cfe8ff}
  .head-card > .lbl{color:#3f6ea8;font-size:11px;font-weight:800;letter-spacing:.01em}
  .head-card .money.big{margin-top:1px;font-size:30px;line-height:1.15;letter-spacing:-.03em;color:var(--c-primary);
    font-family:var(--font-display);font-weight:900;font-variant-numeric:tabular-nums}
  .head-card .stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:8px;
    padding-top:8px;border-top:1px solid #cfe8ff}
  .head-card .stat{display:flex;flex-direction:column;gap:1px;min-width:0;padding:3px 0;
    background:transparent;border:0;border-bottom:1px solid #dceeff;border-radius:0;box-shadow:none}
  .head-card .stat .lbl{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:#5f7392;white-space:nowrap}
  .head-card .stat b.money{font-family:var(--font-display);font-size:14px;font-weight:900;color:var(--c-primary-dark);
    font-variant-numeric:tabular-nums;white-space:nowrap}
  .head-card .stat b.money.ok{color:var(--c-green-dark)}
  .head-card .stat b.money.warn{color:var(--warn)}
  .money.warn{color:var(--warn)}
  .money.ok{color:var(--ok)}

  .head{display:flex;justify-content:space-between;align-items:center;gap:var(--sp-2);
    padding:var(--sp-3) var(--sp-4);border-bottom:1px solid var(--border-subtle);flex-wrap:wrap}
  .panel-title{display:flex;flex-direction:column;gap:1px;min-width:0}
  .count{font-family:'Nunito', sans-serif;font-size:11px;font-weight:700;color:var(--text-faint)}
  .head ion-button{margin:0;min-height:34px}

  .list{display:flex;flex-direction:column}
  .sublist{background:var(--surface-sunken);border-top:1px solid var(--border-subtle)}
  .li{display:flex;align-items:center;gap:var(--sp-3);padding:var(--sp-3) var(--sp-4);
    min-height:56px;border-bottom:1px solid var(--border-subtle);text-align:left;width:100%;
    background:transparent;border-left:none;border-right:none;border-top:none;font-family:inherit}
  .li:last-child{border-bottom:none}
  .li.sm{padding:10px var(--sp-4);min-height:48px;background:transparent}
  .li-body{display:flex;flex-direction:column;gap:3px;flex:1;min-width:0}
  .li-title{font-size:14px;font-weight:600;color:var(--text-body);overflow-wrap:anywhere}
  .li-sub{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--text-faint)}
  .li-sub ion-icon{font-size:12px}
  .li-sub.warn-txt{color:var(--warn)}
  .li-steps{margin-left:auto;font-weight:700;color:var(--text-muted)}
  .li-right{display:flex;flex-direction:column;align-items:flex-end;gap:2px;flex:none}
  .li-amount{font-size:14px;font-weight:800;color:var(--text-strong);white-space:nowrap;
    font-variant-numeric:tabular-nums}
  .bar{height:6px;background:var(--surface-sunken);border-radius:var(--radius-pill);overflow:hidden;
    margin-top:3px;border:1px solid var(--border-subtle)}
  .bar-fill{height:100%;background:var(--positive);border-radius:var(--radius-pill);transition:width .25s ease}
  .row-click{cursor:pointer;transition:background .15s ease}
  .row-click:hover{background:var(--surface-sunken)}
  .row-click:focus-visible{outline:2px solid var(--accent);outline-offset:-2px}
  .li-chev{flex:none;font-size:16px;color:var(--text-faint)}
  .icon-btn{display:flex;align-items:center;justify-content:center;flex:none;width:36px;height:36px;
    border:none;background:transparent;color:var(--text-muted);cursor:pointer;
    border-radius:var(--radius-sm);font-size:18px;transition:background .15s ease}
  .icon-btn ion-icon{font-size:18px}
  .icon-btn:hover{background:var(--surface-input);color:var(--text-strong)}
  .icon-btn:focus-visible{outline:2px solid var(--accent);outline-offset:1px}
  .ok{color:var(--positive);font-size:16px;flex:none}

  .totals{display:grid;grid-template-columns:repeat(3,1fr);gap:var(--sp-2);
    padding:var(--sp-3) var(--sp-4);border-top:1px solid var(--border-subtle)}
  .tot{display:flex;flex-direction:column;gap:2px;padding:var(--sp-2) var(--sp-3);
    background:var(--surface-sunken);border-radius:var(--radius)}
  .tot b{font-size:14px;font-weight:800;color:var(--text-strong);font-variant-numeric:tabular-nums}

  .card-foot{display:flex;justify-content:center;padding:0 var(--sp-2) var(--sp-1)}
  .card-foot ion-button{margin:0;min-height:36px}
  .card-foot ion-icon{font-size:14px}

  .empty{display:flex;flex-direction:column;align-items:center;gap:var(--sp-2);
    padding:var(--sp-6) var(--sp-4);text-align:center}
  .empty.sm{padding:var(--sp-4)}
  .empty ion-icon{font-size:26px;color:var(--text-faint)}
  .empty p{margin:0;font-size:13px;color:var(--text-faint)}
  .empty ion-button{margin:var(--sp-1) 0 0;min-height:36px}

  @media (prefers-reduced-motion: reduce){
    .row-click,.icon-btn,.bar-fill{transition:none}
  }
  `]
})
export class CuentasPage {
  private budget = inject(BudgetService);
  private modalCtrl = inject(ModalController);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  vista: VistaCuentas = 'deudas';
  deudas = this.budget.getDeudas();
  pagos = this.budget.getPagosTC();
  totalLa = 0;
  deudaGeneral = 0;
  deudaMensual = 0;
  deudaMarinaMensual = 0;
  pagadoTC = 0;
  historialVisible = false;
  pagosPagados: any[] = [];
  pagosActivos: any[] = [];
  historialMarinaVisible = false;
  deudasActivas: any[] = [];
  historialMarina: any[] = [];
  lista: any[] = [];
  activos: any[] = [];
  historial: any[] = [];
  vencidos: any[] = [];
  cobrado = 0;
  total = 0;
  private readonly fmtFecha = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });

  constructor() {
    addIcons({ checkmarkCircle, cashOutline, addOutline, chevronDownOutline, chevronUpOutline, chevronForwardOutline, walletOutline, cardOutline, alertCircleOutline });
    this.vista = this.leerVista(this.route.snapshot.queryParamMap.get('tab'));
    this.route.queryParamMap.subscribe(params => this.setVista(this.leerVista(params.get('tab')), false));
    this.refresh();
    this.budget.deudas$.subscribe(() => { this.refresh(); this.cdr.markForCheck(); });
    this.budget.pagosTC$.subscribe(() => { this.refresh(); this.cdr.markForCheck(); });
    this.budget.deudoresLista$.subscribe(() => { this.refresh(); this.cdr.markForCheck(); });
  }

  ionViewWillEnter() {
    this.vista = this.leerVista(this.route.snapshot.queryParamMap.get('tab'));
    this.refresh();
    this.cdr.markForCheck();
  }

  private leerVista(tab: string | null): VistaCuentas {
    return tab === 'deudores' ? 'deudores' : 'deudas';
  }

  onVistaChange(event: any) {
    this.setVista(this.leerVista(event?.detail?.value));
  }

  private setVista(vista: VistaCuentas, sincronizarUrl = true) {
    this.vista = vista;
    if (sincronizarUrl) {
      void this.router.navigate([], { relativeTo: this.route, queryParams: { tab: vista }, replaceUrl: true });
    }
  }

  fechaCorta(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    if (isNaN(d.getTime())) return iso;
    return this.fmtFecha.format(d).replace(/\.$/, '');
  }

  estaVencido(d: any): boolean {
    if (!d.fechaFin) return false;
    const v = new Date(d.fechaFin + 'T00:00:00');
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    return v < hoy;
  }

  pctPagado(d: any): number { return d.pagos ? Math.round((d.pagados / d.pagos) * 100) : 0; }
  pctPagadoP(p: any): number { return p.mensualidad ? Math.round((p.mensualidadPagada / p.mensualidad) * 100) : 0; }

  refresh() {
    this.deudas = this.budget.getDeudas();
    this.pagos = this.budget.getPagosTC();
    this.pagosPagados = this.pagos.filter((p:any)=>p.pagado);
    this.pagosActivos = this.pagos.filter((p:any)=>!p.pagado);
    this.deudasActivas = this.deudas.filter((d:any)=> !(d.pagados>0 && d.pagados>=d.pagos));
    this.historialMarina = this.deudas.filter((d:any)=> d.pagados>0 && d.pagados>=d.pagos);
    this.totalLa = this.deudasActivas.reduce((s, d) => s + d.saldo, 0);
    this.deudaMarinaMensual = this.deudasActivas.reduce((s, d) => s + (Number(d.mensualidad)||0), 0);
    this.deudaMensual = this.pagosActivos.reduce((s, p) => s + p.monto, 0);
    this.deudaGeneral = this.pagosActivos.reduce((s, p) => s + p.montoTotal, 0);
    this.pagadoTC = this.pagos.filter(p => p.pagado).reduce((s, p) => s + p.montoTotal, 0);

    this.lista = this.budget.getDeudoresLista();
    this.activos = this.lista.filter((d:any)=> !(d.pagados>0 && d.pagados>=d.pagos));
    this.historial = this.lista.filter((d:any)=> d.pagados>0 && d.pagados>=d.pagos);
    this.vencidos = this.activos.filter((d:any)=> this.estaVencido(d));
    this.cobrado = this.historial.reduce((s,d)=>s+(Number(d.saldo)||0),0);
    this.total = this.activos.reduce((s,d)=>s+d.saldo,0);
  }

  async toHistorial(p: any){
    if(p.pagado) return;
    const alert = await this.alertCtrl.create({
      header: 'Terminar pago',
      message: `¿Realmente deseas terminar "${p.desc}" y enviarlo al historial?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Terminar', handler: async () => {
            this.budget.updatePagoTC(p.id, { pagado: true, mensualidadPagada: p.mensualidad });
            this.refresh();
            this.historialVisible = true;
            const toast = await this.toastCtrl.create({ message: 'Se agregó correctamente a historial de pagos', duration: 2000, color: 'success', position: 'bottom' });
            await toast.present();
          }
        }
      ]
    });
    await alert.present();
  }

  async openAddTCModal() {
    const modal = await this.modalCtrl.create({ component: TcModalComponent, componentProps: { isEdit: false, titulo: 'Nuevo pago de tarjeta' }, cssClass: 'dialog-modal' });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data && data.desc) {
      this.budget.addPagoTC({ fechaCompra: data.fecha || new Date().toISOString().slice(0,10), desc: data.desc, monto: data.monto, mensualidad: data.mensualidad, mensualidadPagada: 0, montoTotal: data.monto * data.mensualidad, pagado: false });
      this.refresh();
    }
  }

  async editTC(p: any) {
    const modal = await this.modalCtrl.create({ component: TcModalComponent, componentProps: { fecha: p.fechaCompra, desc: p.desc, monto: p.monto, mensualidad: p.mensualidad, pagadas: p.mensualidadPagada, isEdit: true, titulo: 'Editar pago de tarjeta' }, cssClass: 'dialog-modal' });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.remove) { this.budget.removePagoTC(p.id); this.refresh(); return; }
    if (data && data.desc) {
      this.budget.updatePagoTC(p.id, { fechaCompra: data.fecha, desc: data.desc, monto: data.monto, mensualidad: data.mensualidad, mensualidadPagada: data.pagadas, montoTotal: data.monto * data.mensualidad });
      this.refresh();
    }
  }

  async openAddMarinaModal() {
    const modal = await this.modalCtrl.create({ component: TcModalComponent, componentProps: { isEdit: false, showTipo: true, tipo: '', titulo: 'Nueva deuda' }, cssClass: 'dialog-modal' });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data && data.desc) {
      this.budget.addDeuda({ nombre: data.desc, fechaInicio: data.fecha || new Date().toISOString().slice(0,10), fechaFin: '', pagado: 0, saldo: data.monto * data.mensualidad, mensualidad: data.monto, desc: data.desc, pagos: data.mensualidad, pagados: 0, estatus: 'Pendiente', tipo: data.tipo || '' });
      this.refresh();
    }
  }

  async editMarina(d: any) {
    const modal = await this.modalCtrl.create({ component: TcModalComponent, componentProps: { fecha: d.fechaInicio, desc: d.nombre, monto: d.mensualidad, mensualidad: d.pagos||1, pagadas: d.pagados||0, tipo: d.tipo||'', showTipo: true, isEdit: true, titulo: 'Editar deuda' }, cssClass: 'dialog-modal' });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.remove) { this.budget.removeDeuda(d.id); this.refresh(); return; }
    if (data && data.desc) {
      this.budget.updateDeuda(d.id, { nombre: data.desc, fechaInicio: data.fecha, mensualidad: data.monto, pagos: data.mensualidad, pagados: data.pagadas, saldo: data.monto * data.mensualidad, desc: data.desc, tipo: data.tipo });
      this.refresh();
    }
  }

  async toMarinaHistorial(d: any){
    if(d.pagados>0 && d.pagados>=d.pagos) return;
    const alert = await this.alertCtrl.create({
      header: 'Terminar pago',
      message: `¿Realmente deseas terminar "${d.nombre}" y enviarlo al historial?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Terminar', handler: async () => {
            this.budget.updateDeuda(d.id, { pagados: d.pagos });
            this.refresh();
            this.historialMarinaVisible = true;
            const toast = await this.toastCtrl.create({ message: 'Se agregó correctamente a historial de pagos', duration: 2000, color: 'success', position: 'bottom' });
            await toast.present();
          }
        }
      ]
    });
    await alert.present();
  }

  async openAdd(){
    const modal = await this.modalCtrl.create({ component: DeudorSimpleModalComponent, cssClass: 'dialog-modal' });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if(data && data.desc){
      this.budget.addDeudorLista({ nombre: data.desc, fechaInicio: data.fecha || new Date().toISOString().slice(0,10), fechaFin: data.fechaVenc || '', pagado: 0, saldo: data.monto, mensualidad: data.monto, desc: data.desc, pagos: 1, pagados: 0, estatus: 'Pendiente', tipo: '' });
      this.refresh();
    }
  }

  async edit(d:any){
    const modal = await this.modalCtrl.create({ component: DeudorSimpleModalComponent, componentProps: { fecha: d.fechaInicio, fechaVenc: d.fechaFin, desc: d.nombre, monto: d.saldo, isEdit: true }, cssClass: 'dialog-modal' });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if(data?.remove){ this.budget.removeDeudorLista(d.id); this.refresh(); return; }
    if(data && data.desc){
      this.budget.updateDeudorLista(d.id, { nombre: data.desc, fechaInicio: data.fecha, fechaFin: data.fechaVenc || '', mensualidad: data.monto, saldo: data.monto, desc: data.desc });
      this.refresh();
    }
  }

  async toHistorialDeudor(d:any){
    if(d.pagados>0 && d.pagados>=d.pagos) return;
    const alert = await this.alertCtrl.create({
      header: 'Terminar cobro',
      message: `¿Realmente deseas terminar "${d.nombre}" y enviarlo al historial?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Terminar', handler: async () => {
            this.budget.updateDeudorLista(d.id, { pagados: 1, pagos: 1 });
            this.refresh();
            this.historialVisible = true;
            const toast = await this.toastCtrl.create({ message: 'Se agregó correctamente a historial de pagos', duration: 2000, color: 'success', position: 'bottom' });
            await toast.present();
          }
        }
      ]
    });
    await alert.present();
  }
}
