import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TraiterDocument } from './traiter-document';

describe('TraiterDocument', () => {
  let component: TraiterDocument;
  let fixture: ComponentFixture<TraiterDocument>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TraiterDocument],
    }).compileComponents();

    fixture = TestBed.createComponent(TraiterDocument);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
