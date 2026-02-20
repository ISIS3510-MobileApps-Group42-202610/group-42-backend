import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsUUID,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { TransactionStatus } from '../../../common/enums';
import { Type } from 'class-transformer';

export class CreateTransactionDto {
  @IsUUID()
  @IsNotEmpty()
  buyerId: string;

  @IsUUID()
  @IsNotEmpty()
  listingId: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @Type(() => Number)
  agreedPrice: number;

  @IsOptional()
  @IsString()
  meetingLocation?: string;

  @IsOptional()
  @IsDateString()
  meetingDateTime?: Date;
}

export class UpdateTransactionDto {
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @IsOptional()
  @IsString()
  meetingLocation?: string;

  @IsOptional()
  @IsDateString()
  meetingDateTime?: Date;
}

export class TransactionResponseDto {
  id: string;
  buyerId: string;
  sellerId: string;
  listingId: string;
  agreedPrice: number;
  status: TransactionStatus;
  meetingLocation: string;
  meetingDateTime: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class TransactionDetailResponseDto extends TransactionResponseDto {
  buyer?: {
    id: string;
    fullName: string;
    universityEmail: string;
  };
  seller?: {
    id: string;
    fullName: string;
    universityEmail: string;
  };
  listing?: {
    id: string;
    title: string;
    sellingPrice: number;
  };
}
