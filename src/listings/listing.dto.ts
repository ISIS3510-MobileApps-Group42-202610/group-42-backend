import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsInt,
  IsPositive,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
  IsUrl,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ListingCategory, ListingCondition } from './listing.entity';

export class CreateListingImageDto {
  @IsUrl({ require_tld: false })
  url: string;

  @IsOptional()
  @IsBoolean()
  is_primary?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sort_order?: number;
}

export class UpdateListingImageDto {
  @IsOptional()
  @IsInt()
  @IsPositive()
  id?: number;

  @IsUrl({ require_tld: false })
  url: string;

  @IsOptional()
  @IsBoolean()
  is_primary?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sort_order?: number;
}

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

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(12)
  @ValidateNested({ each: true })
  @Type(() => CreateListingImageDto)
  images: CreateListingImageDto[];
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

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @ValidateNested({ each: true })
  @Type(() => UpdateListingImageDto)
  images?: UpdateListingImageDto[];

  @IsOptional()
  @IsBoolean()
  replace_images?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @IsInt({ each: true })
  @IsPositive({ each: true })
  removed_image_ids?: number[];
}

export class AddImageDto {
  @IsUrl({ require_tld: false })
  url: string;

  @IsOptional()
  @IsBoolean()
  is_primary?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sort_order?: number;
}
