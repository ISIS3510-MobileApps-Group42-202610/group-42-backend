import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Listing, ListingCategory } from '../listings/listing.entity';
import { Repository } from 'typeorm';

export interface SupplyByCourseFilters {
  faculty?: string;
  departmentCode?: string;
  category?: string;
  status?: string;
}

export interface SupplyByCourseRow {
  course_id: number;
  course_code: string;
  course_name: string;
  faculty: string;
  department_code: string;
  active_listings: number;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Listing)
    private readonly listingsRepository: Repository<Listing>,
  ) {}

  async getSupplyByCourse(
    filters: SupplyByCourseFilters = {},
  ): Promise<SupplyByCourseRow[]> {
    try {
      const qb = this.listingsRepository
        .createQueryBuilder('listing')
        .innerJoin('listing.course', 'course')
        .select('course.id', 'course_id')
        .addSelect('course.code', 'course_code')
        .addSelect('course.name', 'course_name')
        .addSelect('course.faculty', 'faculty')
        .addSelect('COUNT(listing.id)', 'active_listings')
        .groupBy('course.id')
        .addGroupBy('course.code')
        .addGroupBy('course.name')
        .addGroupBy('course.faculty')
        .orderBy('active_listings', 'DESC')
        .addOrderBy('course.code', 'ASC');

      if (filters.status) {
        qb.andWhere('listing.active = :active', {
          active: this.mapStatusToActive(filters.status),
        });
      } else {
        qb.andWhere('listing.active = :active', { active: true });
      }

      if (filters.faculty) {
        qb.andWhere('course.faculty ILIKE :faculty', {
          faculty: filters.faculty,
        });
      }

      if (filters.departmentCode) {
        qb.andWhere("split_part(course.code, '-', 1) = :departmentCode", {
          departmentCode: filters.departmentCode.toUpperCase(),
        });
      }

      if (filters.category) {
        const category = filters.category.toLowerCase();
        if (!Object.values(ListingCategory).includes(category as ListingCategory)) {
          throw new BadRequestException(
            `Invalid category '${filters.category}'.`,
          );
        }

        qb.andWhere('listing.category = :category', { category });
      }

      const rows = await qb.getRawMany<{
        course_id: string;
        course_code: string;
        course_name: string;
        faculty: string;
        active_listings: string;
      }>();

      return rows.map((row) => ({
        course_id: Number(row.course_id),
        course_code: row.course_code,
        course_name: row.course_name,
        faculty: row.faculty,
        department_code: this.getDepartmentCode(row.course_code),
        active_listings: Number(row.active_listings),
      }));
    } catch (error) {
      if (
        error instanceof InternalServerErrorException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Failed to fetch supply by course analytics data.',
      );
    }
  }

  private getDepartmentCode(courseCode: string): string {
    return courseCode?.split('-')[0] ?? '';
  }

  private mapStatusToActive(status: string): boolean {
    const normalizedStatus = status.toLowerCase();
    return normalizedStatus === 'active' || normalizedStatus === 'true';
  }
}
