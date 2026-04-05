import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MesCompterenduComponent } from './mes-compterendu';

describe('MesCompterenduComponent', () => {
  let component: MesCompterenduComponent;
  let fixture: ComponentFixture<MesCompterenduComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MesCompterenduComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MesCompterenduComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
