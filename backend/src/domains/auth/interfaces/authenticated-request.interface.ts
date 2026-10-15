import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  cookies: Record<string, string | undefined>;
  user: {
    userId: number;
  };
}
