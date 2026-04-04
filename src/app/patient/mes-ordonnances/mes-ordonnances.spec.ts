import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MesOrdonnancesComponent } from './mes-ordonnances'; // Import corrigé

describe('MesOrdonnancesComponent', () => {
  let component: MesOrdonnancesComponent;
  let fixture: ComponentFixture<MesOrdonnancesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MesOrdonnancesComponent], // Standalone
    }).compileComponents();

    fixture = TestBed.createComponent(MesOrdonnancesComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
