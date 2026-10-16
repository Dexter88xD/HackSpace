import { Test, TestingModule } from '@nestjs/testing';
import { HackathonService } from './hackathon.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Hackathon } from '../../database/entities/hackathon.entity';

describe('HackathonService', () => {
  let service: HackathonService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HackathonService,
        {
          provide: getRepositoryToken(Hackathon),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<HackathonService>(HackathonService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
