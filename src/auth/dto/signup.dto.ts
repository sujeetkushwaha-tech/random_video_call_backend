import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsString,
} from 'class-validator';

export class SignupDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}