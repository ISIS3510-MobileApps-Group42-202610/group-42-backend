import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto, UpdateCourseDto, CourseResponseDto } from './dtos/course.dto';

@Controller('api/courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createCourse(@Body() createCourseDto: CreateCourseDto): Promise<CourseResponseDto> {
    const course = await this.coursesService.createCourse(createCourseDto);
    return this.mapCourseToDto(course);
  }

  @Get()
  async getAllCourses(
    @Query('skip') skip: number = 0,
    @Query('take') take: number = 10,
  ): Promise<{ data: CourseResponseDto[]; total: number }> {
    const [courses, total] = await this.coursesService.getAllCourses(skip, take);
    return {
      data: courses.map((course) => this.mapCourseToDto(course)),
      total,
    };
  }

  @Get('by-faculty/:faculty')
  async getCoursesByFaculty(
    @Param('faculty') faculty: string,
    @Query('skip') skip: number = 0,
    @Query('take') take: number = 10,
  ): Promise<{ data: CourseResponseDto[]; total: number }> {
    const [courses, total] = await this.coursesService.getCoursesByFaculty(faculty, skip, take);
    return {
      data: courses.map((course) => this.mapCourseToDto(course)),
      total,
    };
  }

  @Get(':id')
  async getCourseById(@Param('id') id: string): Promise<CourseResponseDto> {
    const course = await this.coursesService.getCourseById(id);
    return this.mapCourseToDto(course);
  }

  @Patch(':id')
  async updateCourse(
    @Param('id') id: string,
    @Body() updateCourseDto: UpdateCourseDto,
  ): Promise<CourseResponseDto> {
    const course = await this.coursesService.updateCourse(id, updateCourseDto);
    return this.mapCourseToDto(course);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCourse(@Param('id') id: string): Promise<void> {
    await this.coursesService.deleteCourse(id);
  }

  private mapCourseToDto(course: any): CourseResponseDto {
    return {
      id: course.id,
      courseCode: course.courseCode,
      courseName: course.courseName,
      faculty: course.faculty,
    };
  }
}
