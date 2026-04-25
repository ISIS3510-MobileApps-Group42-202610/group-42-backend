import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';
import { Listing } from './listing.entity';
import { ListingImage } from './listing-image.entity';
import { HistoricPrice } from './historic-price.entity';
import { Seller } from '../sellers/seller.entity';
import { AcademicCalendarPhase } from './academic-calendar-phase.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Listing,
      ListingImage,
      HistoricPrice,
      Seller,
      AcademicCalendarPhase,
      User,
    ]),
  ],
  controllers: [ListingsController],
  providers: [ListingsService],
  exports: [ListingsService],
})
export class ListingsModule {}
