import { Injectable } from '@nestjs/common';

export interface QueuedUser {
  socketId: string;
  gender?: string;
}

@Injectable()
export class MatchmakingService {
  private waitingUsers: QueuedUser[] = [];

  addToQueue(socketId: string, gender?: string) {
    const exists = this.waitingUsers.find((u) => u.socketId === socketId);
    if (!exists) {
      this.waitingUsers.push({ socketId, gender });
    } else {
      exists.gender = gender;
    }
  }

  removeFromQueue(socketId: string) {
    this.waitingUsers = this.waitingUsers.filter((u) => u.socketId !== socketId);
  }

  getPartner(socketId: string, preferredGender?: string): string | null {
    this.removeFromQueue(socketId);

    if (preferredGender) {
      const preferredMatch = this.waitingUsers.find(
        (u) => u.gender === preferredGender,
      );
      if (preferredMatch) {
        this.removeFromQueue(preferredMatch.socketId);
        return preferredMatch.socketId;
      }
    }

    if (this.waitingUsers.length === 0) return null;

    const next = this.waitingUsers.shift()!;
    return next.socketId;
  }

  getQueueCount(): number {
    return this.waitingUsers.length;
  }
}