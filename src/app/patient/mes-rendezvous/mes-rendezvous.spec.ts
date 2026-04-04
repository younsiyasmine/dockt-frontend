import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MesRendezvousComponent } from './mes-rendezvous';

describe('MesRendezvousComponent', () => {
  // Nom corrigé ici
  let component: MesRendezvousComponent;
  let fixture: ComponentFixture<MesRendezvousComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MesRendezvousComponent], // Standalone component
    }).compileComponents();

    fixture = TestBed.createComponent(MesRendezvousComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
