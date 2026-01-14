import { Test, TestingModule } from '@nestjs/testing';
import { LlmService } from './llm.service';

describe('LlmService', () => {
  let provider: LlmService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LlmService],
    }).compile();

    provider = module.get<LlmService>(LlmService);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
