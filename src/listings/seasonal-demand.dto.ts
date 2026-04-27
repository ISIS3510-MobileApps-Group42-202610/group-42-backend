import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export enum SeasonalDemandGrain {
  DAY = 'day',
  MONTH = 'month',
  WEEK = 'week',
}

export class GetSeasonalDemandQueryDto {
  @IsOptional()
  @IsEnum(SeasonalDemandGrain)
  grain?: SeasonalDemandGrain = SeasonalDemandGrain.MONTH;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsString()
  university_code?: string = 'UNIANDES';
}

export class SeasonalDemandPointDto {
  period_start: string;
  faculty: string;
  calendar_phase: string;
  listings_created: number;
  transactions_completed: number;
  conversion_rate: number;
}

export class SeasonalDemandResponseDto {
  meta: {
    grain: SeasonalDemandGrain;
    from: string;
    to: string;
    university_code: string;
  };
  data: SeasonalDemandPointDto[];
}
