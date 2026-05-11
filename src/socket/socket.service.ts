import { Injectable } from '@nestjs/common';

@Injectable()
export class SocketService {
  private users = new Map<
    string,
    {
      partnerId?: string;
      userName?: string;
    }
  >();

  addUser(socketId: string, userName?: string) {
    this.users.set(socketId, { userName });
  }

  removeUser(socketId: string) {
    this.users.delete(socketId);
  }

  setPartner(socketId: string, partnerId: string) {
    const user = this.users.get(socketId);
    if (!user) return;
    user.partnerId = partnerId;
  }

  getPartner(socketId: string): string | undefined {
    return this.users.get(socketId)?.partnerId;
  }

  getUserName(socketId: string): string | undefined {
    return this.users.get(socketId)?.userName;
  }

  setUserName(socketId: string, userName: string) {
    const user = this.users.get(socketId);
    if (!user) return;
    user.userName = userName;
  }
}