import { Test, TestingModule } from '@nestjs/testing';
import { LocalauthController } from './localauth.controller';

describe('LocalauthController', () => {
  let controller: LocalauthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LocalauthController],
    }).compile();

    controller = module.get<LocalauthController>(LocalauthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
