import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Transaction } from '../transactions/transaction.entity';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  transaction_id: number;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ type: 'int', nullable: true })
  rating: number;

  @CreateDateColumn()
  created_at: Date;

  @OneToOne(() => Transaction, (transaction) => transaction.review)
  @JoinColumn({ name: 'transaction_id' })
  transaction: Transaction;
}
