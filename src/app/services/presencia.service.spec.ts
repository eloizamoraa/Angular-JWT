import { TestBed } from '@angular/core/testing';

import { PresenciaService } from './presencia.service';

describe('PresenciaService', () => {
  let service: PresenciaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PresenciaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
