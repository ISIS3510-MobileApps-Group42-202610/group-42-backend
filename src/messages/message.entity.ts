import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Seller } from '../sellers/seller.entity';

export enum SentBy {
  BUYER = 'buyer',
  SELLER = 'seller',
}

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  seller_id: number;

  @Column()
  buyer_id: number;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'enum', enum: SentBy })
  sent_by: SentBy;

  @CreateDateColumn()
  sent_at: Date;

  @Column({ default: false })
  is_read: boolean;

  // Relations
  @ManyToOne(() => Seller, (seller) => seller.messages)
  @JoinColumn({ name: 'seller_id' })
  seller: Seller;

  @ManyToOne(() => User, (user) => user.sentMessages)
  @JoinColumn({ name: 'buyer_id' })
  buyer: User;
}
