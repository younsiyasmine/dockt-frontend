import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AjouterPatient } from './ajouter-patient';

describe('AjouterPatient', () => {
  let component: AjouterPatient;
  let fixture: ComponentFixture<AjouterPatient>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AjouterPatient],
    }).compileComponents();

    fixture = TestBed.createComponent(AjouterPatient);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
