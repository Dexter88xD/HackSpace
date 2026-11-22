import { MigrationInterface, QueryRunner } from 'typeorm';

export class StoreFileObjectNames1795000000003 implements MigrationInterface {
  name = 'StoreFileObjectNames1795000000003';

  async up(queryRunner: QueryRunner): Promise<void> {
    const files = (await queryRunner.query(
      'SELECT "id", "bucket", "url" FROM "files"',
    )) as { id: string; bucket: string; url: string }[];
    // Validate every legacy URL before changing the schema. Preserve the actual
    // object key, including escaped characters, rather than rebuilding it.
    const names = files.map((file) => {
      try {
        const url = new URL(file.url);
        const [bucket, ...parts] = url.pathname.slice(1).split('/');
        const storedName = decodeURIComponent(parts.join('/'));
        if (
          !['http:', 'https:'].includes(url.protocol) ||
          decodeURIComponent(bucket) !== file.bucket ||
          !storedName ||
          storedName.includes('\0')
        ) {
          throw new Error('Invalid object path');
        }
        return { id: file.id, storedName };
      } catch {
        throw new Error(
          `Cannot determine stored object name for file ${file.id}`,
        );
      }
    });
    await queryRunner.query('ALTER TABLE "files" ADD "stored_name" text');
    for (const file of names) {
      await queryRunner.query(
        'UPDATE "files" SET "stored_name" = $1 WHERE "id" = $2',
        [file.storedName, file.id],
      );
    }
    await queryRunner.query(
      'ALTER TABLE "files" ALTER COLUMN "stored_name" SET NOT NULL',
    );
    await queryRunner.query('ALTER TABLE "files" DROP COLUMN "url"');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const endpoint = new URL(process.env.MINIO_PUBLIC_ENDPOINT || '');
    if (
      !['http:', 'https:'].includes(endpoint.protocol) ||
      endpoint.search ||
      endpoint.hash
    ) {
      throw new Error('A valid MINIO_PUBLIC_ENDPOINT is required for rollback');
    }
    const files = (await queryRunner.query(
      'SELECT "id", "bucket", "stored_name" FROM "files"',
    )) as { id: string; bucket: string; stored_name: string }[];
    await queryRunner.query('ALTER TABLE "files" ADD "url" text');
    for (const file of files) {
      const url = `${endpoint.href.replace(/\/+$/, '')}/${encodeURIComponent(file.bucket)}/${encodeURIComponent(file.stored_name)}`;
      await queryRunner.query('UPDATE "files" SET "url" = $1 WHERE "id" = $2', [
        url,
        file.id,
      ]);
    }
    await queryRunner.query(
      'ALTER TABLE "files" ALTER COLUMN "url" SET NOT NULL',
    );
    await queryRunner.query('ALTER TABLE "files" DROP COLUMN "stored_name"');
  }
}
