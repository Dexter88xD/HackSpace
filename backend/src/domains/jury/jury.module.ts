import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HackathonsModule } from '../hackathons/hackathons.module';
import { HackathonUser } from '../hackathons/entities/hackathon-user.entity';
import { User } from '../users/entities/user.entity';
import { Score } from './entities/score.entity';
import { ScoringCriterion } from './entities/scoring-criterion.entity';
import { JuryController } from './jury.controller';
import { JuryService } from './jury.service';
import { Hackathon } from '../hackathons/entities/hackathon.entity';
import { Team } from '../teams/entities/team.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Score,
      ScoringCriterion,
      Hackathon,
      HackathonUser,
      User,
      Team,
    ]),
    HackathonsModule,
  ],
  controllers: [JuryController],
  providers: [JuryService],
})
export class JuryModule {}
