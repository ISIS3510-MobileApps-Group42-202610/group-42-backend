import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { CoursesService } from '../../src/courses/courses.service';
import { Course } from '../../src/courses/course.entity';

const mockCourse: Partial<Course> = {
  id: 1,
  code: 'MAT101',
  name: 'Calculus I',
  faculty: 'Engineering',
};

const mockCourseRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
};

describe('CoursesService', () => {
  let service: CoursesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoursesService,
        { provide: getRepositoryToken(Course), useValue: mockCourseRepo },
      ],
    }).compile();

    service = module.get<CoursesService>(CoursesService);
    jest.clearAllMocks();
  });

  // ── findAll ──────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return all courses', async () => {
      mockCourseRepo.find.mockResolvedValue([mockCourse]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].code).toBe('MAT101');
    });
  });

  // ── findOne ──────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('should return a course by id', async () => {
      mockCourseRepo.findOne.mockResolvedValue(mockCourse);

      const result = await service.findOne(1);

      expect(result.name).toBe('Calculus I');
    });

    it('should throw NotFoundException if course does not exist', async () => {
      mockCourseRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  // ── create ───────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should create and return a new course', async () => {
      const dto = { code: 'FIS101', name: 'Physics I', faculty: 'Engineering' };
      mockCourseRepo.create.mockReturnValue(dto);
      mockCourseRepo.save.mockResolvedValue({ ...dto, id: 2 });

      const result = await service.create(dto);

      expect(mockCourseRepo.save).toHaveBeenCalled();
      expect(result.code).toBe('FIS101');
    });
  });

  // ── remove ───────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('should delete a course and return a message', async () => {
      mockCourseRepo.findOne.mockResolvedValue(mockCourse);
      mockCourseRepo.remove.mockResolvedValue(undefined);

      const result = await service.remove(1);

      expect(mockCourseRepo.remove).toHaveBeenCalledWith(mockCourse);
      expect(result.message).toBe('Course deleted');
    });

    it('should throw NotFoundException if course does not exist', async () => {
      mockCourseRepo.findOne.mockResolvedValue(null);

      await expect(service.remove(99)).rejects.toThrow(NotFoundException);
    });
  });
});
