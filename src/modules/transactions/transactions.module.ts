import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { Seller, Buyer } from '../users/entities/user.entity';
import { Listing } from '../listings/entities/listing.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, Seller, Buyer, Listing])],
  providers: [TransactionsService],
  controllers: [TransactionsController],
  exports: [TransactionsService],
})
export class TransactionsModule {}
