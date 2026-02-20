import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { ReviewType } from '../../../common/enums';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { Buyer } from '../../users/entities/user.entity';
import { Seller } from '../../users/entities/user.entity';

@Entity('reviews')
@Index(['transaction'])
@Index(['buyer'])
@Index(['seller'])
@Index(['reviewType'])
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int', default: 0 })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ type: 'varchar', enum: ReviewType })
  reviewType: ReviewType;

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => Transaction, (transaction) => transaction.reviews, {
    onDelete: 'CASCADE',
    eager: false,
  })
  transaction: Transaction;

  @Column({ type: 'uuid' })
  transactionId: string;

  @ManyToOne(() => Buyer, {
    onDelete: 'CASCADE',
    eager: false,
  })
  buyer: Buyer;

  @Column({ type: 'uuid', nullable: true })
  buyerId: string;

  @ManyToOne(() => Seller, {
    onDelete: 'CASCADE',
    eager: false,
  })
  seller: Seller;

  @Column({ type: 'uuid', nullable: true })
  sellerId: string;
}
