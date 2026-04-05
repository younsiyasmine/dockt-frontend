import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AjouterRdv } from './ajouter-rdv';

describe('AjouterRdv', () => {
  let component: AjouterRdv;
  let fixture: ComponentFixture<AjouterRdv>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AjouterRdv],
    }).compileComponents();

    fixture = TestBed.createComponent(AjouterRdv);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
