import { IsBoolean } from 'class-validator';

export class ToggleMuteDto {
  @IsBoolean()
  muted!: boolean;
}