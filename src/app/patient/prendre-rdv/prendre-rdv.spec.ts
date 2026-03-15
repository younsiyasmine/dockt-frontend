import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrendreRdv } from './prendre-rdv';

describe('PrendreRdv', () => {
  let component: PrendreRdv;
  let fixture: ComponentFixture<PrendreRdv>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrendreRdv],
    }).compileComponents();

    fixture = TestBed.createComponent(PrendreRdv);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
