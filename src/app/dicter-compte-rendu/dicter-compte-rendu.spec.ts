import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DicterCompteRendu } from './dicter-compte-rendu';

describe('DicterCompteRendu', () => {
  let component: DicterCompteRendu;
  let fixture: ComponentFixture<DicterCompteRendu>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DicterCompteRendu],
    }).compileComponents();

    fixture = TestBed.createComponent(DicterCompteRendu);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
