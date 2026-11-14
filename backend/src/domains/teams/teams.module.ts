import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hackathon } from '../hackathons/entities/hackathon.entity';
import { HackathonUser } from '../hackathons/entities/hackathon-user.entity';
import { Team } from './entities/team.entity';
import { TeamMember } from './entities/team-member.entity';
import { AuthModule } from '../auth/auth.module';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';
import { ChatRoom } from '../chat/entities/chat-room.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Team,
      TeamMember,
      Hackathon,
      HackathonUser,
      ChatRoom,
    ]),
    AuthModule,
  ],
  controllers: [TeamsController],
  providers: [TeamsService],
})
export class TeamsModule {}
