import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TabletteCheckin } from './tablette-checkin';

describe('TabletteCheckin', () => {
  let component: TabletteCheckin;
  let fixture: ComponentFixture<TabletteCheckin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabletteCheckin],
    }).compileComponents();

    fixture = TestBed.createComponent(TabletteCheckin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
