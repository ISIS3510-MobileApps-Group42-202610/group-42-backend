import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { Listing } from './listing.entity';

@Entity('listing_images')
@Index(['listingId'])
export class ListingImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  imageUrl: string;

  @Column({ type: 'boolean', default: false })
  isPrimary: boolean;

  @CreateDateColumn()
  uploadedAt: Date;

  // Relations
  @ManyToOne(() => Listing, {
    onDelete: 'CASCADE',
    eager: false,
  })
  listing: Listing;

  @Column({ type: 'uuid' })
  listingId: string;
}
