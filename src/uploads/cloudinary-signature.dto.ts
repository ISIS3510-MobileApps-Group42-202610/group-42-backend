import { IsOptional, IsString, Matches } from 'class-validator';

export class CloudinarySignatureDto {
  @IsOptional()
  @IsString()
  folder?: string;

  @IsOptional()
  @IsString()
  public_id?: string;

  @IsOptional()
  @IsString()
  upload_preset?: string;

  @IsOptional()
  @IsString()
  tags?: string;

  @IsOptional()
  @IsString()
  context?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d+$/, {
    message: 'timestamp must be a unix timestamp in seconds',
  })
  timestamp?: string;
}
