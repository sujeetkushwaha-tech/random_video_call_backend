import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class ChatMessageDto {
  @IsUUID()
  to!: string;

  @IsString()
  @IsNotEmpty()
  message!: string;

  @IsString()
  type?: 'text' | 'image' | 'file';
}