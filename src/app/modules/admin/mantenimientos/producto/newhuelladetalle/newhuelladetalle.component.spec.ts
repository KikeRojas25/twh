import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewhuelladetalleComponent } from './newhuelladetalle.component';

describe('NewhuelladetalleComponent', () => {
  let component: NewhuelladetalleComponent;
  let fixture: ComponentFixture<NewhuelladetalleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewhuelladetalleComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(NewhuelladetalleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
