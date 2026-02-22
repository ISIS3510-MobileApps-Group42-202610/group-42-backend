import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Seller } from '../sellers/seller.entity';
import { Listing } from '../listings/listing.entity';
import { Review } from '../reviews/review.entity';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  buyer_id: number;

  @Column()
  seller_id: number;

  @Column()
  listing_id: number;

  @Column({ type: 'float' })
  amount: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.purchases)
  @JoinColumn({ name: 'buyer_id' })
  buyer: User;

  @ManyToOne(() => Seller, (seller) => seller.sales)
  @JoinColumn({ name: 'seller_id' })
  seller: Seller;

  @ManyToOne(() => Listing, (listing) => listing.transactions)
  @JoinColumn({ name: 'listing_id' })
  listing: Listing;

  @OneToOne(() => Review, (review) => review.transaction)
  review: Review;
}
