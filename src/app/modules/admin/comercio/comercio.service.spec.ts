/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { ComercioService } from './comercio.service';

describe('Service: Comercio', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ComercioService]
    });
  });

  it('should ...', inject([ComercioService], (service: ComercioService) => {
    expect(service).toBeTruthy();
  }));
});
