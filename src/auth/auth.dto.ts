import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsInt,
  IsBoolean,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  name: string;

  @IsString()
  last_name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsInt()
  semester?: number;

  @IsOptional()
  @IsString()
  profile_pic?: string;

  @IsOptional()
  @IsBoolean()
  is_seller?: boolean;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
