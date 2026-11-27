import { Injectable } from '@nestjs/common';

@Injectable()
export class PresenceService {
  private onlineUsers: Map<number | undefined, Set<string>> = new Map();

  addConnection(userId: number | undefined, socketId: string) {
    if (userId && !this.onlineUsers.has(userId)) {
      this.onlineUsers.set(userId, new Set<string>().add(socketId));
      return true;
    }
    const userSet: Set<string> | undefined = this.onlineUsers.get(userId);
    userSet?.add(socketId);
    return false;
  }

  removeConnection(userId: number | undefined, socketId: string) {
    const userSocket = this.onlineUsers.get(userId);

    if (!userSocket) return false;

    userSocket.delete(socketId);

    if (userSocket.size === 0) {
      this.onlineUsers.delete(userId);
      return true;
    }

    return false;
  }

  isOnline(userId: number) {
    const userSocket = this.onlineUsers.get(userId);
    if (!userSocket) return false;
    return true;
  }
}
