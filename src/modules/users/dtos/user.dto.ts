import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUrl,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { UserStatus, UserType } from '../../../common/enums';

export class CreateBuyerDto {
  @IsEmail()
  @IsNotEmpty()
  universityEmail: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  faculty: string;

  @IsString()
  @IsNotEmpty()
  academicYear: string;

  @IsOptional()
  @IsUrl()
  profilePhotoUrl?: string;
}

export class CreateSellerDto {
  @IsEmail()
  @IsNotEmpty()
  universityEmail: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  faculty: string;

  @IsString()
  @IsNotEmpty()
  academicYear: string;

  @IsOptional()
  @IsUrl()
  profilePhotoUrl?: string;
}

export class UpdateBuyerDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  faculty?: string;

  @IsOptional()
  @IsString()
  academicYear?: string;

  @IsOptional()
  @IsUrl()
  profilePhotoUrl?: string;
}

export class UpdateSellerDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  faculty?: string;

  @IsOptional()
  @IsString()
  academicYear?: string;

  @IsOptional()
  @IsUrl()
  profilePhotoUrl?: string;
}

export class UserResponseDto {
  id: string;
  userType: UserType;
  universityEmail: string;
  fullName: string;
  faculty: string;
  academicYear: string;
  profilePhotoUrl: string;
  isVerified: boolean;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class BuyerResponseDto extends UserResponseDto {
  totalPurchases: number;
  averageBuyerRating: number;
}

export class SellerResponseDto extends UserResponseDto {
  totalSales: number;
  averageSellerRating: number;
  isTrustedSeller: boolean;
}
