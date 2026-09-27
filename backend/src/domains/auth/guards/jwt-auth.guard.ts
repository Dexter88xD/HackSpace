import { AuthGuard } from '@nestjs/passport';
// AuthGuard('jwt') is NestJS's Passport guard configured to use the strategy
// registered under the name "jwt". JwtAuthGuard extends it so we have our own
// reusable guard that can be applied with @UseGuards(JwtAuthGuard).

// Flow: Request → JwtAuthGuard → AuthGuard('jwt') → Passport → JwtStrategy
// → verify JWT → validate(payload) → request.user → Controller
export class JwtAuthGuard extends AuthGuard('jwt') {}
