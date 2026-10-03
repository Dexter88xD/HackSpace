import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedUserRoles1791034245963 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO user_roles (role_name) VALUES ('ROLE_USER'), ('ROLE_ADMIN')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM user_roles WHERE role_name IN ('ROLE_USER', 'ROLE_ADMIN')`,
    );
  }
}
