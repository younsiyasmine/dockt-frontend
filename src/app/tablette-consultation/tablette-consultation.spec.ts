import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TabletteConsultationComponent } from './tablette-consultation';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('TabletteConsultationComponent', () => {
  let component: TabletteConsultationComponent;
  let fixture: ComponentFixture<TabletteConsultationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabletteConsultationComponent, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(TabletteConsultationComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
