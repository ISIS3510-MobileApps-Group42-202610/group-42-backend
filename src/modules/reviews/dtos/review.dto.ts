import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsUUID,
  Min,
  Max,
} from 'class-validator';
import { ReviewType } from '../../../common/enums';
import { Type } from 'class-transformer';

export class CreateReviewDto {
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  rating: number;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsEnum(ReviewType)
  @IsNotEmpty()
  reviewType: ReviewType;

  @IsUUID()
  @IsNotEmpty()
  transactionId: string;
}

export class UpdateReviewDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  rating?: number;

  @IsOptional()
  @IsString()
  comment?: string;
}

export class ReviewResponseDto {
  id: string;
  rating: number;
  comment: string;
  reviewType: ReviewType;
  buyerId: string;
  sellerId: string;
  transactionId: string;
  createdAt: Date;
}

export class ReviewDetailResponseDto extends ReviewResponseDto {
  reviewer?: {
    id: string;
    fullName: string;
    profilePhotoUrl: string;
  };
  reviewed?: {
    id: string;
    fullName: string;
    profilePhotoUrl: string;
  };
}
