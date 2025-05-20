import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModificarinventariomasivoComponent } from './modificarinventariomasivo.component';

describe('ModificarinventariomasivoComponent', () => {
  let component: ModificarinventariomasivoComponent;
  let fixture: ComponentFixture<ModificarinventariomasivoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModificarinventariomasivoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ModificarinventariomasivoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
