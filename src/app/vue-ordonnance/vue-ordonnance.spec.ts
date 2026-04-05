import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VueOrdonnance } from './vue-ordonnance';

describe('VueOrdonnance', () => {
  let component: VueOrdonnance;
  let fixture: ComponentFixture<VueOrdonnance>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VueOrdonnance],
    }).compileComponents();

    fixture = TestBed.createComponent(VueOrdonnance);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
