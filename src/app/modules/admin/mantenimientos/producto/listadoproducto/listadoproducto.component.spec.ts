import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListadoproductoComponent } from './listadoproducto.component';

describe('ListadoproductoComponent', () => {
  let component: ListadoproductoComponent;
  let fixture: ComponentFixture<ListadoproductoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListadoproductoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ListadoproductoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
