import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SkillsService } from './skills.service';
import { SkillsController } from './skills.controller';
import { Skill } from './entities/skill.entity';
import { UserProfile } from '../../database/entities/user-profile.entity';
import { User } from '../../database/entities/user.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Skill, UserProfile, User]), AuthModule],
  controllers: [SkillsController],
  providers: [SkillsService],
  exports: [SkillsService],
})
export class SkillsModule {}
