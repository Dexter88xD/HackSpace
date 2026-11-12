import { Test, TestingModule } from '@nestjs/testing';
import { FilesService } from './files.service';
import { FileManager } from './file-manager';

describe('FilesService', () => {
  let service: FilesService;
  const fileManager = { upload: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        { provide: FileManager, useValue: fileManager },
      ],
    }).compile();

    service = module.get<FilesService>(FilesService);
  });

  it('delegates the file to the configured strategy and returns its result', async () => {
    const file = {
      originalname: 'example.txt',
      mimetype: 'text/plain',
      buffer: Buffer.from('example'),
      bucket: 'uploads',
    };
    fileManager.upload.mockResolvedValue('strategy confirmation');

    await expect(service.upload(file)).resolves.toBe('strategy confirmation');
    expect(fileManager.upload).toHaveBeenCalledWith(file);
  });
});
