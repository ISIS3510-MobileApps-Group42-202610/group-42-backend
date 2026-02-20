import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  Index,
} from 'typeorm';
import { Listing } from '../../listings/entities/listing.entity';

@Entity('courses')
@Index(['courseCode'])
@Index(['faculty'])
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  courseCode: string;

  @Column({ type: 'varchar' })
  courseName: string;

  @Column({ type: 'varchar' })
  faculty: string;

  // Relations
  @ManyToMany(() => Listing, (listing) => listing.courses, {
    eager: false,
  })
  listings: Listing[];
}
