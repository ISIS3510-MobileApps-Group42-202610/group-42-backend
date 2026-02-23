import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Seller } from '../sellers/seller.entity';
import { User } from '../users/user.entity';
import { Course } from '../courses/course.entity';
import { ListingImage } from './listing-image.entity';
import { HistoricPrice } from './historic-price.entity';
import { Transaction } from '../transactions/transaction.entity';

export enum ListingCategory {
  TEXTBOOK = 'textbook',
  NOTES = 'notes',
  SUPPLIES = 'supplies',
  ELECTRONICS = 'electronics',
  OTHER = 'other',
}

export enum ListingCondition {
  NEW = 'new',
  LIKE_NEW = 'like_new',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
}

@Entity('listings')
export class Listing {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  seller_id: number;

  @Column({ nullable: true })
  buyer_id: number;

  @Column({ nullable: true })
  course_id: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  product: string;

  @Column({ type: 'enum', enum: ListingCategory, nullable: true })
  category: ListingCategory;

  @Column({ type: 'enum', enum: ListingCondition, nullable: true })
  condition: ListingCondition;

  @Column({ type: 'float', nullable: true })
  original_price: number;

  @Column({ type: 'float' })
  selling_price: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ default: true })
  active: boolean;

  // Relations
  @ManyToOne(() => Seller, (seller) => seller.listings)
  @JoinColumn({ name: 'seller_id' })
  seller: Seller;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'buyer_id' })
  buyer: User;

  @ManyToOne(() => Course, (course) => course.listings)
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @OneToMany(() => ListingImage, (image) => image.listing, { cascade: true })
  images: ListingImage[];

  @OneToMany(() => HistoricPrice, (price) => price.listing, { cascade: true })
  priceHistory: HistoricPrice[];

  @OneToMany(() => Transaction, (transaction) => transaction.listing)
  transactions: Transaction[];
}
