import { Module } from '@nestjs/common';
import { HackathonService } from './hackathon.service';
import { HackathonController } from './hackathon.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hackathon } from '../../database/entities/hackathon.entity';
import { HackathonPhase } from '../../database/entities/hackathon-phase.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Hackathon, HackathonPhase])],
  controllers: [HackathonController],
  providers: [HackathonService],
})
export class HackathonModule {}
