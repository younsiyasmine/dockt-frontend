import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SecretaireDashboard } from './secretaire-dashboard';

describe('SecretaireDashboard', () => {
  let component: SecretaireDashboard;
  let fixture: ComponentFixture<SecretaireDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SecretaireDashboard],
    }).compileComponents();

    fixture = TestBed.createComponent(SecretaireDashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
