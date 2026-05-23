import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Version,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { AnalyticsService, SupplyByCourseFilters } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('supply-by-course')
  @Version(VERSION_NEUTRAL)
  getSupplyByCourse(
    @Query('faculty') faculty?: string,
    @Query('department_code') departmentCode?: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
  ) {
    const filters: SupplyByCourseFilters = {
      faculty,
      departmentCode,
      category,
      status,
    };

    if (
      filters.status &&
      !['active', 'inactive', 'true', 'false'].includes(
        filters.status.toLowerCase(),
      )
    ) {
      throw new BadRequestException(
        "Invalid status. Use one of: 'active', 'inactive', 'true', 'false'.",
      );
    }

    return this.analyticsService.getSupplyByCourse(filters);
  }
}
