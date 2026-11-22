import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Score } from './entities/score.entity';
import { ScoringCriterion } from './entities/scoring-criterion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Score, ScoringCriterion])],
})
export class JuryModule {}
