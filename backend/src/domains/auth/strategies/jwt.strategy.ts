import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
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
  constructor() {
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
  validate(payload: JwtPayload) {
    return {
      userId: payload.sub,
    };
  }
}
