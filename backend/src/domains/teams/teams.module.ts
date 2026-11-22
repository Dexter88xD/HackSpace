import { MulterModule } from '@nestjs/platform-express';
import { FilesModule } from '../../shared/files/files.module';
import { MAX_FILE_UPLOAD_BYTES } from '../../shared/files/file-manager';
import { TeamSubmission } from './entities/team-submission.entity';
import { TeamSubmissionsController } from './team-submissions.controller';
import { TeamSubmissionsService } from './team-submissions.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hackathon } from '../hackathons/entities/hackathon.entity';
import { HackathonUser } from '../hackathons/entities/hackathon-user.entity';
import { Team } from './entities/team.entity';
import { TeamMember } from './entities/team-member.entity';
import { TeamJoinRequest } from './entities/team-join-request.entity';
import { AuthModule } from '../auth/auth.module';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';
import { ChatRoom } from '../chat/entities/chat-room.entity';
import { ChatMember } from '../chat/entities/chat-member.entity';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Team,
      TeamMember,
      TeamSubmission,
      TeamJoinRequest,
      Hackathon,
      HackathonUser,
      ChatRoom,
      ChatMember,
    ]),
    FilesModule,
    MulterModule.registerAsync({
      imports: [FilesModule],
      inject: [MAX_FILE_UPLOAD_BYTES],
      useFactory: (fileSize: number) => ({
        defParamCharset: 'utf8',
        limits: { fileSize: fileSize + 1, files: 1, fields: 0 },
      }),
    }),
    ChatModule,
    AuthModule,
  ],
  controllers: [TeamsController, TeamSubmissionsController],
  providers: [TeamsService, TeamSubmissionsService],
  exports: [TeamsService],
})
export class TeamsModule {}
