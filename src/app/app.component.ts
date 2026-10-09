import { AfterViewInit, Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements AfterViewInit {
  constructor() {}

  /**
   * La pantalla de carga vive en index.html, fuera de Angular, para que se vea
   * mientras se descargan los bundles (sobre todo al abrir desde un acceso
   * directo). Aca se quita ya con la primera vista Pintada: si tardo muy poco
   * se espera un instante para que no parpadee.
   */
  ngAfterViewInit(): void {
    const splash = document.getElementById('splash');
    if (!splash) return;
    const t0 = Number(splash.dataset['t0'] || 0);
    const espera = Math.max(0, 400 - (Date.now() - t0));
    setTimeout(() => {
      splash.classList.add('hide');
      setTimeout(() => splash.remove(), 350);
    }, espera);
  }
}
