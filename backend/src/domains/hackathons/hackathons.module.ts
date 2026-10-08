import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hackathon } from '../../database/entities/hackathon.entity';
import { HackathonsService } from './hackathons.service';
import { HackathonPhase } from '../../database/entities/hackathon-phase.entity';
import { HackathonSettings } from '../../database/entities/hackathon-settings.entity';
import { HackathonsController } from './hackathons.controller';
import { AuthModule } from '../auth/auth.module';
import { User } from '../../database/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Hackathon,
      HackathonPhase,
      HackathonSettings,
      User,
    ]),
    AuthModule,
  ],
  controllers: [HackathonsController],
  providers: [HackathonsService],
  exports: [HackathonsService],
})
export class HackathonsModule {}
