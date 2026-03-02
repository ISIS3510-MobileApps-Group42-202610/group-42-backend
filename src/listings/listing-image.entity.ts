import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Listing } from './listing.entity';

@Entity('listing_images')
@Index('idx_listing_images_listing_sort', ['listing_id', 'sort_order'])
export class ListingImage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  listing_id: number;

  @Column({ default: false })
  is_primary: boolean;

  @Column({ type: 'int', default: 0 })
  sort_order: number;

  @CreateDateColumn()
  uploaded_at: Date;

  @Column({ type: 'text' })
  url: string;

  @ManyToOne(() => Listing, (listing) => listing.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'listing_id' })
  listing: Listing;
}
