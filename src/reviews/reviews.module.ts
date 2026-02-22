import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { Review } from './review.entity';
import { Transaction } from '../transactions/transaction.entity';
import { Seller } from '../sellers/seller.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Review, Transaction, Seller])],
  controllers: [ReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
