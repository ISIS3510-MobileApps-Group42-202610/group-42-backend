import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Listing } from './listing.entity';

@Entity('listing_images')
export class ListingImage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  listing_id: number;

  @Column({ default: false })
  is_primary: boolean;

  @CreateDateColumn()
  uploaded_at: Date;

  @Column()
  url: string;

  @ManyToOne(() => Listing, (listing) => listing.images)
  @JoinColumn({ name: 'listing_id' })
  listing: Listing;
}
