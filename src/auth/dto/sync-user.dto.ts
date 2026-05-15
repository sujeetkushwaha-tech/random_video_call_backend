import {
  IsEmail,
  IsOptional,
  IsString,
  IsEnum,
} from 'class-validator';
import { Gender } from 'src/user/entities/user.entity';

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

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;
}