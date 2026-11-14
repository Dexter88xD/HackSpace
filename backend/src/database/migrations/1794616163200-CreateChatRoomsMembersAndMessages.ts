import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateChatRoomsMembersAndMessages1794616163200 implements MigrationInterface {
  name = 'CreateChatRoomsMembersAndMessages1794616163200';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "chat_members" ("id" SERIAL NOT NULL, "last_read_at" TIMESTAMP, "user_id" integer NOT NULL, "chat_room_id" integer NOT NULL, CONSTRAINT "UQ_chat_member_user_room" UNIQUE ("user_id", "chat_room_id"), CONSTRAINT "PK_aea646f59c92c47af5804ce73a7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "messages" ("id" SERIAL NOT NULL, "content" character varying(4000) NOT NULL, "sent_at" TIMESTAMP NOT NULL DEFAULT now(), "chat_room_id" integer NOT NULL, "sender_id" integer, CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."chat_room_type_enum" AS ENUM('private', 'team', 'global')`,
    );
    await queryRunner.query(
      `CREATE TABLE "chat_rooms" ("id" SERIAL NOT NULL, "title" character varying(50) NOT NULL, "chat_room_type" "public"."chat_room_type_enum" NOT NULL, "hackathon_id" integer, "team_id" integer, CONSTRAINT "REL_8505eef494be547b47738a83c7" UNIQUE ("team_id"), CONSTRAINT "PK_c69082bd83bffeb71b0f455bd59" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_members" ADD CONSTRAINT "FK_9dc61e92eed1dc151c2b2ef01a0" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_members" ADD CONSTRAINT "FK_cad342d02c6db559add83de3359" FOREIGN KEY ("chat_room_id") REFERENCES "chat_rooms"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_5bb8108b85199f4ae096599917f" FOREIGN KEY ("chat_room_id") REFERENCES "chat_rooms"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_22133395bd13b970ccd0c34ab22" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_rooms" ADD CONSTRAINT "FK_211e33ebd994c83dcc102d89170" FOREIGN KEY ("hackathon_id") REFERENCES "hackathons"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_rooms" ADD CONSTRAINT "FK_8505eef494be547b47738a83c7a" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "chat_rooms" DROP CONSTRAINT "FK_211e33ebd994c83dcc102d89170"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_22133395bd13b970ccd0c34ab22"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_5bb8108b85199f4ae096599917f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_members" DROP CONSTRAINT "FK_cad342d02c6db559add83de3359"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_members" DROP CONSTRAINT "FK_9dc61e92eed1dc151c2b2ef01a0"`,
    );
    await queryRunner.query(`DROP TABLE "chat_rooms"`);
    await queryRunner.query(`DROP TYPE "public"."chat_room_type_enum"`);
    await queryRunner.query(`DROP TABLE "messages"`);
    await queryRunner.query(`DROP TABLE "chat_members"`);
  }
}
