import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GetionmermaComponent } from './getionmerma.component';

describe('GetionmermaComponent', () => {
  let component: GetionmermaComponent;
  let fixture: ComponentFixture<GetionmermaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GetionmermaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GetionmermaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
