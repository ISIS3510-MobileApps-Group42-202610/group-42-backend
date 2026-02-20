import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { Listing } from '../../listings/entities/listing.entity';

@Entity('price_histories')
@Index(['listing'])
@Index(['semester'])
export class PriceHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  averageSoldPrice: number;

  @Column({ type: 'int' })
  demandScore: number;

  @Column({ type: 'varchar' })
  semester: string;

  @CreateDateColumn()
  calculatedAt: Date;

  // Relations
  @ManyToOne(() => Listing, (listing) => listing.priceHistories, {
    onDelete: 'CASCADE',
    eager: false,
  })
  listing: Listing;

  @Column({ type: 'uuid' })
  listingId: string;
}
