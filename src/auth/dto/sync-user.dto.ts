import {
  IsEmail,
  IsOptional,
  IsString,
} from 'class-validator';

export class SyncUserDto {
  @IsOptional()
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  image!: string;

  @IsString()
  provider!: string;
}