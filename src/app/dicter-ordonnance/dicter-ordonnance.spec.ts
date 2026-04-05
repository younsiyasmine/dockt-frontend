import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DicterOrdonnance } from './dicter-ordonnance';

describe('DicterOrdonnance', () => {
  let component: DicterOrdonnance;
  let fixture: ComponentFixture<DicterOrdonnance>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DicterOrdonnance],
    }).compileComponents();

    fixture = TestBed.createComponent(DicterOrdonnance);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
