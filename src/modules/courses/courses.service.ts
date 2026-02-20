import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Course } from './entities/course.entity';
import { CreateCourseDto, UpdateCourseDto } from './dtos/course.dto';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
  ) {}

  async createCourse(createCourseDto: CreateCourseDto): Promise<Course> {
    const existingCourse = await this.courseRepository.findOne({
      where: { courseCode: createCourseDto.courseCode },
    });

    if (existingCourse) {
      throw new ConflictException('Course code already exists');
    }

    const course = this.courseRepository.create(createCourseDto);
    return this.courseRepository.save(course);
  }

  async getCourseById(id: string): Promise<Course> {
    const course = await this.courseRepository.findOne({ where: { id } });
    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }
    return course;
  }

  async getCourseByCode(courseCode: string): Promise<Course> {
    const course = await this.courseRepository.findOne({
      where: { courseCode },
    });
    if (!course) {
      throw new NotFoundException(`Course with code ${courseCode} not found`);
    }
    return course;
  }

  async getCoursesByIds(ids: string[]): Promise<Course[]> {
    return this.courseRepository.find({
      where: { id: In(ids) },
    });
  }

  async getAllCourses(skip: number = 0, take: number = 10): Promise<[Course[], number]> {
    return this.courseRepository.findAndCount({
      skip,
      take,
      order: { courseCode: 'ASC' },
    });
  }

  async getCoursesByFaculty(faculty: string, skip: number = 0, take: number = 10): Promise<[Course[], number]> {
    return this.courseRepository.findAndCount({
      where: { faculty },
      skip,
      take,
      order: { courseCode: 'ASC' },
    });
  }

  async updateCourse(id: string, updateCourseDto: UpdateCourseDto): Promise<Course> {
    const course = await this.getCourseById(id);

    // Check if new course code already exists
    if (updateCourseDto.courseCode && updateCourseDto.courseCode !== course.courseCode) {
      const existing = await this.courseRepository.findOne({
        where: { courseCode: updateCourseDto.courseCode },
      });
      if (existing) {
        throw new ConflictException('Course code already exists');
      }
    }

    Object.assign(course, updateCourseDto);
    return this.courseRepository.save(course);
  }

  async deleteCourse(id: string): Promise<void> {
    const result = await this.courseRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }
  }
}
