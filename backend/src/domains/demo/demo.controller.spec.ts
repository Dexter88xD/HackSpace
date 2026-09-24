import { Test, TestingModule } from '@nestjs/testing';
import { DemoController } from './demo.controller';
import { DemoService } from './demo.service';

describe('DemoController', () => {
  let controller: DemoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DemoController],
      providers: [
        DemoService,
        {
          provide: 'KAFKA_SERVICE',
          useValue: {
            connect: jest.fn(),
            close: jest.fn(),
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<DemoController>(DemoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
