import { Injectable } from '@nestjs/common';
import { SocketService } from 'src/socket/socket.service';

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: 'text' | 'image' | 'file';
  timestamp: Date;
}

@Injectable()
export class ChatService {
  private chatHistories = new Map<string, Message[]>(); // key: pairId (sorted userIds)

  getPairKey(user1: string, user2: string): string {
    return [user1, user2].sort().join('-');
  }

  async saveMessage(
    senderId: string,
    receiverId: string,
    content: string,
    type: 'text' | 'image' | 'file' = 'text',
  ): Promise<Message> {
    const pairKey = this.getPairKey(senderId, receiverId);
    const message: Message = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      senderId,
      receiverId,
      content,
      type,
      timestamp: new Date(),
    };

    if (!this.chatHistories.has(pairKey)) {
      this.chatHistories.set(pairKey, []);
    }
    this.chatHistories.get(pairKey)!.push(message);

    return message;
  }

  getChatHistory(user1: string, user2: string, limit = 50): Message[] {
    const pairKey = this.getPairKey(user1, user2);
    const history = this.chatHistories.get(pairKey) || [];
    return history.slice(-limit);
  }
}