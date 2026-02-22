import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { Transaction } from './transaction.entity';
import { Listing } from '../listings/listing.entity';
import { Seller } from '../sellers/seller.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, Listing, Seller])],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
