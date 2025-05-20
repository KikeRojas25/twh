import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NuevoinventarioComponent } from './nuevoinventario.component';

describe('NuevoinventarioComponent', () => {
  let component: NuevoinventarioComponent;
  let fixture: ComponentFixture<NuevoinventarioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NuevoinventarioComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(NuevoinventarioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
