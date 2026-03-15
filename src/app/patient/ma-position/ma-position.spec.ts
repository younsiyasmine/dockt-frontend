import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MaPosition } from './ma-position';

describe('MaPosition', () => {
  let component: MaPosition;
  let fixture: ComponentFixture<MaPosition>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaPosition],
    }).compileComponents();

    fixture = TestBed.createComponent(MaPosition);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
