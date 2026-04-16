import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('academic_calendar_phases')
@Index('uq_calendar_phase_range', [
  'university_code',
  'semester_code',
  'phase_name',
  'start_date',
  'end_date',
], { unique: true })
@Index('idx_calendar_phase_lookup', ['university_code', 'start_date', 'end_date'])
export class AcademicCalendarPhase {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  university_code: string;

  @Column()
  semester_code: string;

  @Column()
  phase_name: string;

  @Column({ type: 'date' })
  start_date: string;

  @Column({ type: 'date' })
  end_date: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
