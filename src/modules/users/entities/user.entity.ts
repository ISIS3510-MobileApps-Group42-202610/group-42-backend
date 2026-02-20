import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { UserStatus, UserType } from '../../../common/enums';

@Entity('users')
@Index(['universityEmail'], { unique: true })
@Index(['userType'])
export abstract class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', enum: UserType })
  userType: UserType;

  @Column({ type: 'varchar', unique: true })
  universityEmail: string;

  @Column({ type: 'varchar' })
  passwordHash: string;

  @Column({ type: 'varchar' })
  fullName: string;

  @Column({ type: 'varchar' })
  faculty: string;

  @Column({ type: 'varchar' })
  academicYear: string;

  @Column({ type: 'varchar', nullable: true })
  profilePhotoUrl: string;

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ type: 'varchar', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('users')
export class Buyer extends User {
  @Column({ type: 'int', default: 0 })
  totalPurchases: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  averageBuyerRating: number;
}

@Entity('users')
export class Seller extends User {
  @Column({ type: 'int', default: 0 })
  totalSales: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  averageSellerRating: number;

  @Column({ type: 'boolean', default: false })
  isTrustedSeller: boolean;
}
