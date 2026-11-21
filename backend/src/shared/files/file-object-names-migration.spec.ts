import type { QueryRunner } from 'typeorm';
import { StoreFileObjectNames1795000000003 } from '../../database/migrations/1795000000003-StoreFileObjectNames';

describe('StoreFileObjectNames migration', () => {
  const migration = new StoreFileObjectNames1795000000003();

  it('preserves the exact key including paths and encoded characters', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([
        {
          id: 'file-id',
          bucket: 'avatar',
          url: 'https://old.example/avatar/nested%2Fphoto%20%C3%A4.PNG?ignored=true',
        },
      ])
      .mockResolvedValue([]);
    await migration.up({ query } as unknown as QueryRunner);
    expect(query).toHaveBeenCalledWith(
      'UPDATE "files" SET "stored_name" = $1 WHERE "id" = $2',
      ['nested/photo ä.PNG', 'file-id'],
    );
  });

  it.each([
    'invalid',
    'https://example.com/default/image.png',
    'https://example.com/avatar/',
    'https://example.com/avatar/%invalid',
    'ftp://example.com/avatar/image.png',
  ])(
    'rejects malformed legacy URL %s before changing the schema',
    async (url) => {
      const query = jest
        .fn()
        .mockResolvedValue([{ id: 'file-id', bucket: 'avatar', url }]);
      await expect(
        migration.up({ query } as unknown as QueryRunner),
      ).rejects.toThrow('file-id');
      expect(query).toHaveBeenCalledTimes(1);
    },
  );

  it('requires an endpoint before rollback changes the schema', async () => {
    const previous = process.env.MINIO_PUBLIC_ENDPOINT;
    delete process.env.MINIO_PUBLIC_ENDPOINT;
    const query = jest.fn();
    try {
      await expect(
        migration.down({ query } as unknown as QueryRunner),
      ).rejects.toThrow();
      expect(query).not.toHaveBeenCalled();
    } finally {
      if (previous !== undefined) process.env.MINIO_PUBLIC_ENDPOINT = previous;
    }
  });
});
