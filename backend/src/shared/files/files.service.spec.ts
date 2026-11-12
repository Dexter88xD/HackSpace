import { NotFoundException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import { FilesService } from './files.service';
import { StoredFile } from './entities/stored-file.entity';

describe('FilesService', () => {
  const file = {
    originalname: 'original.txt',
    mimetype: 'text/plain',
    buffer: Buffer.from('example'),
  };
  const stored = Object.assign(new StoredFile(), {
    id: '2813bd63-e537-427a-a129-d23f24ab5148',
    name: 'original.txt',
    bucket: 'saved-bucket',
  });
  let upload: jest.Mock;
  let getFile: jest.Mock;
  let service: FilesService;
  let remove: jest.Mock;
  let files: { findOneBy: jest.Mock };

  beforeEach(() => {
    upload = jest.fn().mockResolvedValue(stored);
    getFile = jest.fn().mockResolvedValue('https://storage.example/signed');
    remove = jest.fn().mockResolvedValue(undefined);
    files = { findOneBy: jest.fn().mockResolvedValue(stored) };
    service = new FilesService(
      { upload, getFile, delete: remove },
      files as unknown as Repository<StoredFile>,
    );
  });

  it('looks up the entity and delegates deletion to the manager', async () => {
    await service.delete(stored.id);
    expect(files.findOneBy).toHaveBeenCalledWith({ id: stored.id });
    expect(remove).toHaveBeenCalledWith(stored);
  });

  it('returns not found without calling storage for a missing file', async () => {
    files.findOneBy.mockResolvedValue(null);
    await expect(service.delete(stored.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(remove).not.toHaveBeenCalled();
  });

  it('propagates deletion failures', async () => {
    const error = new Error('Storage unavailable');
    remove.mockRejectedValue(error);
    await expect(service.delete(stored.id)).rejects.toBe(error);
  });

  it('uses the manager to sign the returned stored entity', async () => {
    await expect(service.upload(file)).resolves.toBe(
      'https://storage.example/signed',
    );
    expect(upload).toHaveBeenCalledWith(file);
    expect(getFile).toHaveBeenCalledWith(stored);
  });

  it('propagates upload errors', async () => {
    const error = new Error('Upload failed');
    upload.mockRejectedValue(error);
    await expect(service.upload(file)).rejects.toBe(error);
    expect(getFile).not.toHaveBeenCalled();
  });

  it('leaves the saved entity intact when signing fails', async () => {
    const error = new Error('Credentials unavailable');
    getFile.mockRejectedValue(error);
    await expect(service.upload(file)).rejects.toBe(error);
    expect(upload).toHaveBeenCalledTimes(1);
    expect(stored.id).toBe('2813bd63-e537-427a-a129-d23f24ab5148');
  });
});
