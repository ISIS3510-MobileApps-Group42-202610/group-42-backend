import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
} from 'typeorm';
import { TransactionStatus } from '../../../common/enums';
import { Buyer } from '../../users/entities/user.entity';
import { Seller } from '../../users/entities/user.entity';
import { Listing } from '../../listings/entities/listing.entity';
import { Review } from '../../reviews/entities/review.entity';

@Entity('transactions')
@Index(['buyer'])
@Index(['seller'])
@Index(['listing'])
@Index(['status'])
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  agreedPrice: number;

  @Column({ type: 'varchar', enum: TransactionStatus, default: TransactionStatus.PENDING })
  status: TransactionStatus;

  @Column({ type: 'varchar', nullable: true })
  meetingLocation: string;

  @Column({ type: 'timestamp', nullable: true })
  meetingDateTime: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Buyer, {
    onDelete: 'CASCADE',
    eager: false,
  })
  buyer: Buyer;

  @Column({ type: 'uuid' })
  buyerId: string;

  @ManyToOne(() => Seller, {
    onDelete: 'CASCADE',
    eager: false,
  })
  seller: Seller;

  @Column({ type: 'uuid' })
  sellerId: string;

  @ManyToOne(() => Listing, (listing) => listing.transactions, {
    onDelete: 'CASCADE',
    eager: false,
  })
  listing: Listing;

  @Column({ type: 'uuid' })
  listingId: string;

  @OneToMany(() => Review, (review) => review.transaction)
  reviews: Review[];
}
