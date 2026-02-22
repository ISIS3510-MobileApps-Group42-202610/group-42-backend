import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Listing } from '../listings/listing.entity';
import { Transaction } from '../transactions/transaction.entity';
import { Message } from '../messages/message.entity';

@Entity('sellers')
export class Seller {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column({ default: 0 })
  total_sales: number;

  @Column({ type: 'float', default: 0 })
  avg_rating: number;

  // Relations
  @OneToOne(() => User, (user) => user.seller)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => Listing, (listing) => listing.seller)
  listings: Listing[];

  @OneToMany(() => Transaction, (transaction) => transaction.seller)
  sales: Transaction[];

  @OneToMany(() => Message, (message) => message.seller)
  messages: Message[];
}
