import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

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
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
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
