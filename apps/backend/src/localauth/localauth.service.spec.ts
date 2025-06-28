import { Test, TestingModule } from '@nestjs/testing';
import { LocalauthService } from './localauth.service';

describe('LocalauthService', () => {
  let service: LocalauthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LocalauthService],
    }).compile();

    service = module.get<LocalauthService>(LocalauthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
