import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TabletteConsultation } from './tablette-consultation';

describe('TabletteConsultation', () => {
  let component: TabletteConsultation;
  let fixture: ComponentFixture<TabletteConsultation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabletteConsultation],
    }).compileComponents();

    fixture = TestBed.createComponent(TabletteConsultation);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
