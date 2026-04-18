import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MedecinDashboard } from './medecin-dashboard';

describe('MedecinDashboard', () => {
  let component: MedecinDashboard;
  let fixture: ComponentFixture<MedecinDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MedecinDashboard],
    }).compileComponents();

    fixture = TestBed.createComponent(MedecinDashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
