import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActeMedicaleComponent } from './acte-medicale';

describe('ActeMedicaleComponent', () => {
  let component: ActeMedicaleComponent;
  let fixture: ComponentFixture<ActeMedicaleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActeMedicaleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ActeMedicaleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
