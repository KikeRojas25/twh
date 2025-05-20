import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExtraerpalletComponent } from './extraerpallet.component';

describe('ExtraerpalletComponent', () => {
  let component: ExtraerpalletComponent;
  let fixture: ComponentFixture<ExtraerpalletComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExtraerpalletComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ExtraerpalletComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
