import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';

import { MatchmakingService } from '../matchmaking/matchmaking.service';
import { SocketService } from './socket.service';
import { ChatService } from '../chat/chat.service';

// @WebSocketGateway({
//   cors: {
//     origin: '*',
//   },
// })
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL?.split(',') || [],
    credentials: true,
  },
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly matchmakingService: MatchmakingService,
    private readonly socketService: SocketService,
    private readonly chatService: ChatService,
  ) {}

  handleConnection(client: Socket) {
    console.log('Connected:', client.id);
    this.socketService.addUser(client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('Disconnected:', client.id);
    const partnerId = this.socketService.getPartner(client.id);

    if (partnerId) {
      this.server.to(partnerId).emit('partner-disconnected');
    }

    this.matchmakingService.removeFromQueue(client.id);
    this.socketService.removeUser(client.id);
  }

  @SubscribeMessage('find-partner')
  findPartner(@ConnectedSocket() client: Socket) {
    const partner = this.matchmakingService.getPartner(client.id);

    if (!partner) {
      this.matchmakingService.addToQueue(client.id);
      client.emit('waiting');
      return;
    }

    this.socketService.setPartner(client.id, partner);
    this.socketService.setPartner(partner, client.id);

    this.server.to(partner).emit('matched', {
      partnerId: client.id,
      initiator: true,
    });

    client.emit('matched', {
      partnerId: partner,
      initiator: false,
    });
  }

  @SubscribeMessage('offer')
  handleOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: any,
  ) {
    this.server.to(body.to).emit('offer', {
      offer: body.offer,
      from: client.id,
    });
  }

  @SubscribeMessage('answer')
  handleAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: any,
  ) {
    this.server.to(body.to).emit('answer', {
      answer: body.answer,
      from: client.id,
    });
  }

  @SubscribeMessage('ice-candidate')
  handleIceCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: any,
  ) {
    this.server.to(body.to).emit('ice-candidate', {
      candidate: body.candidate,
      from: client.id,
    });
  }

  @SubscribeMessage('send-message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: any,
  ) {
    const senderId = client.id;
    const { to, message, type = 'text' } = body;

    const savedMessage = await this.chatService.saveMessage(
      senderId,
      to,
      message,
      type,
    );

    const messageWithSender = {
      ...savedMessage,
      senderName: this.socketService.getUserName(senderId) || 'Anonymous',
    };

    this.server.to(to).emit('new-message', messageWithSender);
    client.emit('message-sent', messageWithSender);
  }

  @SubscribeMessage('get-chat-history')
  handleGetHistory(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { with: string },
  ) {
    const history = this.chatService.getChatHistory(client.id, body.with);
    client.emit('chat-history', history);
  }

  @SubscribeMessage('toggle-mute')
  handleMute(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { muted: boolean },
  ) {
    const partnerId = this.socketService.getPartner(client.id);
    if (partnerId) {
      this.server.to(partnerId).emit('partner-muted', { muted: body.muted });
    }
  }

  @SubscribeMessage('toggle-video')
  handleVideo(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { videoOff: boolean },
  ) {
    const partnerId = this.socketService.getPartner(client.id);
    if (partnerId) {
      this.server.to(partnerId).emit('partner-video-off', {
        videoOff: body.videoOff,
      });
    }
  }

  @SubscribeMessage('end-call')
  handleEndCall(@ConnectedSocket() client: Socket) {
    const partnerId = this.socketService.getPartner(client.id);

    if (partnerId) {
      this.server.to(partnerId).emit('call-ended');
    }

    this.socketService.removeUser(client.id);
    this.matchmakingService.removeFromQueue(client.id);
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { to: string; isTyping: boolean },
  ) {
    this.server.to(body.to).emit('partner-typing', {
      userId: client.id,
      isTyping: body.isTyping,
    });
  }
}