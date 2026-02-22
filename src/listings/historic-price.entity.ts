import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Listing } from './listing.entity';

@Entity('historic_prices')
export class HistoricPrice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  listing_id: number;

  @Column({ type: 'timestamp' })
  start_date: Date;

  @Column({ type: 'timestamp', nullable: true })
  final_date: Date;

  @ManyToOne(() => Listing, (listing) => listing.priceHistory)
  @JoinColumn({ name: 'listing_id' })
  listing: Listing;
}
