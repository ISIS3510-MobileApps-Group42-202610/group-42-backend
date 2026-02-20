import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePriceHistoryDto {
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @Type(() => Number)
  averageSoldPrice: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @Type(() => Number)
  demandScore: number;

  @IsString()
  @IsNotEmpty()
  semester: string;

  @IsUUID()
  @IsNotEmpty()
  listingId: string;
}

export class UpdatePriceHistoryDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  averageSoldPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  demandScore?: number;

  @IsOptional()
  @IsString()
  semester?: string;
}

export class PriceHistoryResponseDto {
  id: string;
  averageSoldPrice: number;
  demandScore: number;
  semester: string;
  listingId: string;
  calculatedAt: Date;
}
