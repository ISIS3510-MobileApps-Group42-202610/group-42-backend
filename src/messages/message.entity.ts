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
