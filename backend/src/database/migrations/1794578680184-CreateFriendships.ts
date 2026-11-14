import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateFriendships1794578680184 implements MigrationInterface {
    name = 'CreateFriendships1794578680184'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "friendships" ("id" SERIAL NOT NULL, "requester_id" integer NOT NULL, "addressee_id" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "accepted_at" TIMESTAMP WITH TIME ZONE, "status" character varying(20) NOT NULL DEFAULT 'PENDING', CONSTRAINT "PK_08af97d0be72942681757f07bc8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "friendships" ADD CONSTRAINT "FK_4cf3c68ed4a5a9fde8d4c2b7319" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "friendships" ADD CONSTRAINT "FK_01b0760fd2402d21f12c6dc5f89" FOREIGN KEY ("addressee_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        // 3. Prevent sending a request to yourself
        await queryRunner.query(`ALTER TABLE "friendships" ADD CONSTRAINT "CHK_friendships_not_self" CHECK ("requester_id" <> "addressee_id")`);

        // 4. Only allow valid friendship statuses
        await queryRunner.query(`ALTER TABLE "friendships" ADD CONSTRAINT "CHK_friendships_status" CHECK ("status" IN ('PENDING', 'ACCEPTED'))`);

        // 5. Prevent duplicate and reversed friendships
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_friendships_pair" ON "friendships" (
            LEAST("requester_id", "addressee_id"),
            GREATEST("requester_id", "addressee_id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {;
        await queryRunner.query(`DROP INDEX "UQ_friendships_pair"`)
        await queryRunner.query(`ALTER TABLE "friendships" DROP CONSTRAINT "CHK_friendships_status"`);
        await queryRunner.query(`ALTER TABLE "friendships" DROP CONSTRAINT "CHK_friendships_not_self"`);
        await queryRunner.query(`ALTER TABLE "friendships" DROP CONSTRAINT "FK_01b0760fd2402d21f12c6dc5f89"`);
        await queryRunner.query(`ALTER TABLE "friendships" DROP CONSTRAINT "FK_4cf3c68ed4a5a9fde8d4c2b7319"`);
        await queryRunner.query(`DROP TABLE "friendships"`);
    }

}
 