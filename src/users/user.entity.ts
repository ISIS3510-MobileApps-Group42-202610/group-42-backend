import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Seller } from '../sellers/seller.entity';
import { Transaction } from '../transactions/transaction.entity';
import { Message } from '../messages/message.entity';
import { Listing } from '../listings/listing.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  last_name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  passwordHash: string;

  @Column({ nullable: true })
  semester: number;

  @Column({ nullable: true })
  profile_pic: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ default: false })
  is_seller: boolean;

  // Relations
  @OneToOne(() => Seller, (seller) => seller.user)
  seller: Seller;

  @OneToMany(() => Transaction, (transaction) => transaction.buyer)
  purchases: Transaction[];

  @OneToMany(() => Message, (message) => message.buyer)
  sentMessages: Message[];

  @OneToMany(() => Message, (message) => message.seller)
  receivedMessages: Message[];

  @ManyToMany(() => Listing)
  @JoinTable({
    name: 'wishlist',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'listing_id', referencedColumnName: 'id' },
  })
  wishlist: Listing[];
}
