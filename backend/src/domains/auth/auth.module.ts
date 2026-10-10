import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { EmailModule } from '../../shared/email/email.module';
import { EmailService } from '../../shared/email/email.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../database/entities/user.entity';
import { UserProfile } from '../../database/entities/user-profile.entity';
import { UserSkill } from '../../database/entities/user-skill.entity';
import { UserRole } from '../../database/entities/user-role.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { StringValue } from 'ms';
import { RolesGuard } from './guards/roles.guard';

// AuthModule wires together the authentication layer: registers JwtModule to sign 7-day access tokens
// using JWT_SECRET, imports EmailModule for verification/password-related emails, registers the User
// and related entities with TypeORM so their repositories can be injected into AuthService, exposes
// AuthController for authentication endpoints, and provides AuthService for the authentication logic.
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {
        expiresIn: process.env.JWT_EXPIRES_IN as StringValue,
      },
    }),
    EmailModule,
    TypeOrmModule.forFeature([User, UserProfile, UserSkill, UserRole]),
  ],
  controllers: [AuthController],
  providers: [AuthService, EmailService, JwtStrategy, RolesGuard],
  exports: [RolesGuard],
})
export class AuthModule {}
