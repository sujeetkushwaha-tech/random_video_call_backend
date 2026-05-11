import { Module } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { SocketService } from './socket.service';
import { MatchmakingModule } from '../matchmaking/matchmaking.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [
    MatchmakingModule,
    ChatModule, 
  ],
  providers: [
    SocketGateway,
    SocketService,
  ],
})
export class SocketModule {}