import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerubicacionComponent } from './verubicacion.component';

describe('VerubicacionComponent', () => {
  let component: VerubicacionComponent;
  let fixture: ComponentFixture<VerubicacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerubicacionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VerubicacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
