import { TestBed, ComponentFixture } from '@angular/core/testing';
import { vi } from 'vitest';
import { ModalController } from '@ionic/angular';
import { ResetWizardComponent } from './reset-wizard.component';

describe('ResetWizardComponent', () => {
  let comp: ResetWizardComponent;
  let fixture: ComponentFixture<ResetWizardComponent>;
  let dismiss: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    dismiss = vi.fn();
    TestBed.configureTestingModule({
      imports: [ResetWizardComponent],
      providers: [{ provide: ModalController, useValue: { dismiss } }]
    });
    fixture = TestBed.createComponent(ResetWizardComponent);
    comp = fixture.componentInstance;
  });

  /** Espera el repintado y devuelve el texto de la barra de accion. */
  const barra = async () => {
    await fixture.whenStable();
    return fixture.nativeElement.querySelector('.acciones').textContent.replace(/\s+/g, ' ').trim();
  };

  /** Click real en el boton de la barra: es la via que el usuario usa. */
  const tocarBoton = async () => {
    await fixture.whenStable();
    fixture.nativeElement.querySelector('.acciones button').click();
    await fixture.whenStable();
  };

  const texto = () => fixture.nativeElement.textContent.replace(/\s+/g, ' ');

  it('deja avanzar paso a paso y muestra el boton de cada etapa', async () => {
    expect(await barra()).toContain('Continuar');
    expect(texto()).toContain('¿Cuánto entra al mes?');

    await tocarBoton();
    expect(comp.paso).toBe(1);
    expect(texto()).toContain('¿Cómo te pagan?');
    expect(await barra()).toContain('Continuar');

    await tocarBoton();
    expect(comp.paso).toBe(2);
    expect(texto()).toContain('Todo listo');
    expect(await barra()).toContain('Restablecer con estos datos');
  });

  it('no pregunta por membresia ni por pago', async () => {
    await barra();
    expect(texto()).not.toContain('Tipo de membresía');
    await tocarBoton();
    expect(texto()).not.toContain('Tipo de membresía');
    await tocarBoton();
    expect(texto()).not.toContain('Datos de pago');
    expect(texto()).not.toContain('Pagar');
  });

  it('confirma con rol confirm y devuelve la config elegida', async () => {
    await barra();
    await tocarBoton();          // rango -> tipo de pago
    await tocarBoton();          // tipo de pago -> resumen
    expect(texto()).toContain('Todo listo');

    comp.rango = '15-20';
    comp.tipoPago = 'mensual';
    await tocarBoton();          // Restablecer con estos datos

    expect(dismiss).toHaveBeenCalledWith(
      { rango: '15-20', tipoPago: 'mensual', membresia: comp.membresia },
      'confirm'
    );
  });

  it('cancelar en el primer paso cierra sin datos', () => {
    comp.paso = 0;
    comp.atras();
    expect(dismiss).toHaveBeenCalledWith(null, 'cancel');
  });
});