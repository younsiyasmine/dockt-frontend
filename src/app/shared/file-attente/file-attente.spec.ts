import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileAttente } from './file-attente';

describe('FileAttente', () => {
  let component: FileAttente;
  let fixture: ComponentFixture<FileAttente>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileAttente],
    }).compileComponents();

    fixture = TestBed.createComponent(FileAttente);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
