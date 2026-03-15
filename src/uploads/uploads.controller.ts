import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { CloudinarySignatureDto } from './cloudinary-signature.dto';
import { UploadsService } from './uploads.service';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('cloudinary-signature')
  @HttpCode(200)
  createCloudinarySignature(@Body() dto: CloudinarySignatureDto) {
    return this.uploadsService.createCloudinarySignature(dto);
  }
}
