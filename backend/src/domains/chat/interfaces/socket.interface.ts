import { Socket } from 'socket.io';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

interface AuthenticatedSocketData {
  user?: JwtPayload;
}

export type AuthenticatedSocket = Socket<
  Record<string, never>,
  Record<string, never>,
  Record<string, never>,
  AuthenticatedSocketData
>;
