import { Injectable } from '@nestjs/common';

@Injectable()
export class MatchmakingService {
  private waitingUsers: string[] = [];

  addToQueue(socketId: string) {
    const exists = this.waitingUsers.includes(socketId);
    if (!exists) {
      this.waitingUsers.push(socketId);
    }
  }

  removeFromQueue(socketId: string) {
    this.waitingUsers = this.waitingUsers.filter((id) => id !== socketId);
  }

  getPartner(socketId: string) {
    this.removeFromQueue(socketId);
    const partner = this.waitingUsers.shift();
    return partner || null;
  }
}