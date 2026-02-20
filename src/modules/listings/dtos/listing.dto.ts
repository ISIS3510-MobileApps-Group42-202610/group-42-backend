import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsUUID,
  IsUrl,
  IsDateString,
  Min,
  IsArray,
} from 'class-validator';
import { ListingCategory, ListingCondition, ListingStatus } from '../../../common/enums';
import { Type } from 'class-transformer';

export class CreateListingDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(ListingCategory)
  @IsNotEmpty()
  category: ListingCategory;

  @IsEnum(ListingCondition)
  @IsNotEmpty()
  condition: ListingCondition;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @Type(() => Number)
  originalPrice: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  suggestedPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  sellingPrice?: number;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  courseIds?: string[];
}

export class UpdateListingDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ListingCategory)
  category?: ListingCategory;

  @IsOptional()
  @IsEnum(ListingCondition)
  condition?: ListingCondition;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  originalPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  suggestedPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  sellingPrice?: number;

  @IsOptional()
  @IsEnum(ListingStatus)
  status?: ListingStatus;
}

export class CreateListingImageDto {
  @IsUrl()
  @IsNotEmpty()
  imageUrl: string;

  @IsOptional()
  isIsPrimary?: boolean;
}

export class UpdateListingImageDto {
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @IsOptional()
  isPrimary?: boolean;
}

export class ListingImageResponseDto {
  id: string;
  imageUrl: string;
  isPrimary: boolean;
  uploadedAt: Date;
  listingId: string;
}

export class ListingResponseDto {
  id: string;
  title: string;
  description: string;
  category: ListingCategory;
  condition: ListingCondition;
  originalPrice: number;
  suggestedPrice: number;
  sellingPrice: number;
  status: ListingStatus;
  createdAt: Date;
  updatedAt: Date;
  sellerId: string;
  images?: ListingImageResponseDto[];
}

export class ListingDetailResponseDto extends ListingResponseDto {
  sellerInfo?: {
    id: string;
    fullName: string;
    averageSellerRating: number;
    isTrustedSeller: boolean;
  };
  courses?: {
    id: string;
    courseCode: string;
    courseName: string;
  }[];
}
