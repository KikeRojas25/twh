import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewedithuellaComponent } from './newedithuella.component';

describe('NewedithuellaComponent', () => {
  let component: NewedithuellaComponent;
  let fixture: ComponentFixture<NewedithuellaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewedithuellaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(NewedithuellaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
