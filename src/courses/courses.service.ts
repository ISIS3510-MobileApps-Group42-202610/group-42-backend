import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from './course.entity';
import { IsString } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  code: string;
  @IsString()
  name: string;
  @IsString()
  faculty: string;
}

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private coursesRepository: Repository<Course>,
  ) {}

  findAll() {
    return this.coursesRepository.find();
  }

  async findOne(id: number) {
    const course = await this.coursesRepository.findOne({ where: { id } });
    if (!course) throw new NotFoundException(`Course #${id} not found`);
    return course;
  }

  create(dto: CreateCourseDto) {
    return this.coursesRepository.save(this.coursesRepository.create(dto));
  }

  async remove(id: number) {
    const course = await this.findOne(id);
    await this.coursesRepository.remove(course);
    return { message: 'Course deleted' };
  }
}
