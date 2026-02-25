import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';
import { Listing } from './listing.entity';
import { ListingImage } from './listing-image.entity';
import { HistoricPrice } from './historic-price.entity';
import { Seller } from '../sellers/seller.entity';
import { Transaction } from '../transactions/transaction.entity';
import { Review } from '../reviews/review.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Listing,
      ListingImage,
      HistoricPrice,
      Seller,
      Transaction,
      Review,
    ]),
  ],
  controllers: [ListingsController],
  providers: [ListingsService],
  exports: [ListingsService],
})
export class ListingsModule {}
