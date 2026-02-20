import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
  Index,
} from 'typeorm';
import { ListingCategory, ListingCondition, ListingStatus } from '../../../common/enums';
import { Seller } from '../../users/entities/user.entity';
import { ListingImage } from './listing-image.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { PriceHistory } from '../../price-history/entities/price-history.entity';
import { Course } from '../../courses/entities/course.entity';

@Entity('listings')
@Index(['seller'])
@Index(['status'])
@Index(['category'])
export class Listing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', enum: ListingCategory })
  category: ListingCategory;

  @Column({ type: 'varchar', enum: ListingCondition })
  condition: ListingCondition;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  originalPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  suggestedPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  sellingPrice: number;

  @Column({ type: 'varchar', enum: ListingStatus, default: ListingStatus.AVAILABLE })
  status: ListingStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Seller, {
    onDelete: 'CASCADE',
    eager: false,
  })
  seller: Seller;

  @Column({ type: 'uuid' })
  sellerId: string;

  @OneToMany(() => ListingImage, (image) => image.listing, {
    cascade: true,
    eager: false,
  })
  images: ListingImage[];

  @ManyToMany(() => Course, (course) => course.listings, {
    eager: false,
  })
  @JoinTable({
    name: 'listing_courses',
    joinColumn: { name: 'listingId' },
    inverseJoinColumn: { name: 'courseId' },
  })
  courses: Course[];

  @OneToMany(() => Transaction, (transaction) => transaction.listing)
  transactions: Transaction[];

  @OneToMany(() => PriceHistory, (priceHistory) => priceHistory.listing)
  priceHistories: PriceHistory[];
}
