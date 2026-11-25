import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Strategy } from 'passport-jwt';
import { IsNull, Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import type { Request } from 'express';

// Passport provides the authentication framework, while passport-jwt provides
// the actual JWT authentication strategy.
// PassportStrategy(Strategy) connects NestJS to Passport's JWT Strategy.
// By extending it, JwtStrategy becomes a NestJS/Passport strategy that knows
// how to extract and verify JWTs. The validate() method is called after the
// token has been successfully verified.
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: (req: Request) => {
        const cookies = req.cookies as Record<string, unknown> | undefined;
        const token = cookies?.accessToken;

        return typeof token === 'string' ? token : null;
      },
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET!,
    });
  }
  // Also rejects tokens of users deleted after the token was issued.
  async validate(payload: JwtPayload) {
    const exists = await this.userRepository.existsBy({
      id: payload.sub,
      deletedAt: IsNull(),
    });
    if (!exists) throw new UnauthorizedException();
    return {
      userId: payload.sub,
    };
  }
}
