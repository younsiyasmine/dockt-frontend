import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VueCompteRendu } from './vue-compte-rendu';

describe('VueCompteRendu', () => {
  let component: VueCompteRendu;
  let fixture: ComponentFixture<VueCompteRendu>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VueCompteRendu],
    }).compileComponents();

    fixture = TestBed.createComponent(VueCompteRendu);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
