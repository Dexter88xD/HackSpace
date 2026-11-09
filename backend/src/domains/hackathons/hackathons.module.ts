import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hackathon } from './entities/hackathon.entity';
import { HackathonsService } from './hackathons.service';
import { HackathonPhase } from './entities/hackathon-phase.entity';
import { HackathonSettings } from './entities/hackathon-settings.entity';
import { HackathonsController } from './hackathons.controller';
import { AuthModule } from '../auth/auth.module';
import { User } from '../users/entities/user.entity';
import { HackathonUser } from './entities/hackathon-user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Hackathon,
      HackathonPhase,
      HackathonSettings,
      HackathonUser,
      User,
    ]),
    AuthModule,
  ],
  controllers: [HackathonsController],
  providers: [HackathonsService],
  exports: [HackathonsService],
})
export class HackathonsModule {}
