import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('messages')
@Index(['sender'])
@Index(['receiver'])
@Index(['sentAt'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn()
  sentAt: Date;

  @Column({ type: 'boolean', default: false })
  isRead: boolean;

  // Relations
  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
    eager: false,
  })
  sender: User;

  @Column({ type: 'uuid' })
  senderId: string;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
    eager: false,
  })
  receiver: User;

  @Column({ type: 'uuid' })
  receiverId: string;
}
