import {
  IsString,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  courseCode: string;

  @IsString()
  @IsNotEmpty()
  courseName: string;

  @IsString()
  @IsNotEmpty()
  faculty: string;
}

export class UpdateCourseDto {
  @IsOptional()
  @IsString()
  courseCode?: string;

  @IsOptional()
  @IsString()
  courseName?: string;

  @IsOptional()
  @IsString()
  faculty?: string;
}

export class CourseResponseDto {
  id: string;
  courseCode: string;
  courseName: string;
  faculty: string;
}
