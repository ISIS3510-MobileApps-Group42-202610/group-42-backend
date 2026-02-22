import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsInt,
  IsPositive,
} from 'class-validator';
import { ListingCategory, ListingCondition } from './listing.entity';

export class CreateListingDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  product?: string;

  @IsOptional()
  @IsEnum(ListingCategory)
  category?: ListingCategory;

  @IsOptional()
  @IsEnum(ListingCondition)
  condition?: ListingCondition;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  original_price?: number;

  @IsNumber()
  @IsPositive()
  selling_price: number;

  @IsOptional()
  @IsInt()
  course_id?: number;
}

export class UpdateListingDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  product?: string;

  @IsOptional()
  @IsEnum(ListingCategory)
  category?: ListingCategory;

  @IsOptional()
  @IsEnum(ListingCondition)
  condition?: ListingCondition;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  original_price?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  selling_price?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class AddImageDto {
  @IsString()
  url: string;

  @IsOptional()
  @IsBoolean()
  is_primary?: boolean;
}
