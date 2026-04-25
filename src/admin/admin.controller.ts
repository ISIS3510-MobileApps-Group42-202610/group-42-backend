import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Headers,
  Post,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { timingSafeEqual } from 'crypto';

const WIPE_CONFIRMATION = 'WIPE_DATABASE_NOW';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  @Post('wipe-db-once')
  async wipeDatabaseOnce(
    @Headers('x-wipe-token') token: string | undefined,
    @Headers('x-wipe-confirm') confirmation: string | undefined,
  ) {
    const enabled = this.configService.get('ENABLE_WIPE_ENDPOINT') === 'true';
    if (!enabled) {
      throw new ServiceUnavailableException('Wipe endpoint disabled');
    }

    const expectedToken = this.configService.get<string>('WIPE_DB_TOKEN');
    if (!expectedToken) {
      throw new ServiceUnavailableException('WIPE_DB_TOKEN not configured');
    }

    if (!token) {
      throw new UnauthorizedException('Missing x-wipe-token');
    }

    const isValidToken = this.safeEqual(token, expectedToken);
    if (!isValidToken) {
      throw new ForbiddenException('Invalid wipe token');
    }

    if (confirmation !== WIPE_CONFIRMATION) {
      throw new BadRequestException('Missing or invalid x-wipe-confirm');
    }

    const tablesResult = await this.dataSource.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);

    const tables = tablesResult.map((row: { tablename: string }) => row.tablename);
    if (tables.length === 0) {
      return { message: 'No public tables found', truncated_tables: 0 };
    }

    const identifiers = tables.map((table) => `public."${table.replace(/"/g, '""')}"`);
    await this.dataSource.query(
      `TRUNCATE TABLE ${identifiers.join(', ')} RESTART IDENTITY CASCADE`,
    );

    return {
      message: 'Database wiped',
      truncated_tables: tables.length,
    };
  }

  private safeEqual(a: string, b: string) {
    const aa = Buffer.from(a);
    const bb = Buffer.from(b);
    if (aa.length !== bb.length) {
      return false;
    }
    return timingSafeEqual(aa, bb);
  }
}
