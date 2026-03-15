import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { CloudinarySignatureDto } from './cloudinary-signature.dto';

type SignatureParams = Record<string, string>;

@Injectable()
export class UploadsService {
  constructor(private readonly configService: ConfigService) {}

  createCloudinarySignature(dto: CloudinarySignatureDto) {
    const cloudNameFromEnv = this.configService.get<string>(
      'CLOUDINARY_CLOUD_NAME',
    );
    const apiKeyFromEnv = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecretFromEnv = this.configService.get<string>(
      'CLOUDINARY_API_SECRET',
    );
    const cloudinaryUrl = this.configService.get<string>('CLOUDINARY_URL');

    const fromUrl = this.parseCloudinaryUrl(cloudinaryUrl);
    const cloudName = cloudNameFromEnv ?? fromUrl.cloudName;
    const apiKey = apiKeyFromEnv ?? fromUrl.apiKey;
    const apiSecret = apiSecretFromEnv ?? fromUrl.apiSecret;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new InternalServerErrorException(
        'Cloudinary environment variables are not configured',
      );
    }

    const timestamp = dto.timestamp ?? Math.floor(Date.now() / 1000).toString();
    const defaultFolder = this.configService.get<string>('CLOUDINARY_UPLOAD_FOLDER');

    const paramsToSign: SignatureParams = {
      timestamp,
      ...(dto.folder ? { folder: dto.folder } : {}),
      ...(!dto.folder && defaultFolder ? { folder: defaultFolder } : {}),
      ...(dto.public_id ? { public_id: dto.public_id } : {}),
      ...(dto.upload_preset ? { upload_preset: dto.upload_preset } : {}),
      ...(dto.tags ? { tags: dto.tags } : {}),
      ...(dto.context ? { context: dto.context } : {}),
    };

    const serializedParams = Object.entries(paramsToSign)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('&');

    const signature = createHash('sha1')
      .update(`${serializedParams}${apiSecret}`)
      .digest('hex');

    return {
      cloudName,
      cloud_name: cloudName,
      apiKey,
      api_key: apiKey,
      timestamp,
      signature,
      folder: paramsToSign.folder,
    };
  }

  private parseCloudinaryUrl(cloudinaryUrl?: string) {
    if (!cloudinaryUrl) {
      return {};
    }

    const normalizedUrl = cloudinaryUrl.trim().replace(/^['"]|['"]$/g, '');
    const match = normalizedUrl.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
    if (!match) {
      return {};
    }

    return {
      apiKey: decodeURIComponent(match[1]),
      apiSecret: decodeURIComponent(match[2]),
      cloudName: decodeURIComponent(match[3]),
    };
  }
}
