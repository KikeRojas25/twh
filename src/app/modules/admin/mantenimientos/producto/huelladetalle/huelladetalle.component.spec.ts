import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HuelladetalleComponent } from './huelladetalle.component';

describe('HuelladetalleComponent', () => {
  let component: HuelladetalleComponent;
  let fixture: ComponentFixture<HuelladetalleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HuelladetalleComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HuelladetalleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
