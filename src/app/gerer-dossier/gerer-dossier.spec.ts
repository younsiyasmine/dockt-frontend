import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GererDossier } from './gerer-dossier';

describe('GererDossier', () => {
  let component: GererDossier;
  let fixture: ComponentFixture<GererDossier>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GererDossier],
    }).compileComponents();

    fixture = TestBed.createComponent(GererDossier);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
