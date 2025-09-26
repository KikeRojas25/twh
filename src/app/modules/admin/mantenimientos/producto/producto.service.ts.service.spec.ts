/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { Producto.service.tsService } from './producto.service.ts.service';

describe('Service: Producto.service.ts', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [Producto.service.tsService]
    });
  });

  it('should ...', inject([Producto.service.tsService], (service: Producto.service.tsService) => {
    expect(service).toBeTruthy();
  }));
});
