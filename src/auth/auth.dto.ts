import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsInt,
  IsBoolean,
  IsNotEmpty,
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

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @MinLength(6)
  new_password: string;
}

export class DeleteAccountDto {
  @IsString()
  @MinLength(6)
  password: string;
}

export class UpdateProfilePictureDto {
  @IsString()
  @IsNotEmpty()
  profile_pic: string;
}