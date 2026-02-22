import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './transaction.entity';
import { Listing } from '../listings/listing.entity';
import { Seller } from '../sellers/seller.entity';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
    @InjectRepository(Listing)
    private listingsRepository: Repository<Listing>,
    @InjectRepository(Seller)
    private sellersRepository: Repository<Seller>,
  ) {}

  async create(buyerId: number, listingId: number) {
    const listing = await this.listingsRepository.findOne({
      where: { id: listingId, active: true },
      relations: ['seller'],
    });

    if (!listing)
      throw new NotFoundException('Listing not found or not available');
    if (listing.seller?.user_id === buyerId) {
      throw new BadRequestException('Cannot buy your own listing');
    }

    const transaction = this.transactionsRepository.create({
      buyer_id: buyerId,
      seller_id: listing.seller_id,
      listing_id: listingId,
      amount: listing.selling_price,
    });

    await this.transactionsRepository.save(transaction);

    // Mark listing as inactive and record buyer
    await this.listingsRepository.update(listingId, {
      active: false,
      buyer_id: buyerId,
    });

    // Increment seller total_sales
    await this.sellersRepository.increment(
      { id: listing.seller_id },
      'total_sales',
      1,
    );

    return transaction;
  }

  async findOne(id: number, userId: number) {
    const transaction = await this.transactionsRepository.findOne({
      where: { id },
      relations: ['buyer', 'seller', 'seller.user', 'listing', 'review'],
    });
    if (!transaction)
      throw new NotFoundException(`Transaction #${id} not found`);

    if (
      transaction.buyer_id !== userId &&
      transaction.seller?.user_id !== userId
    ) {
      throw new ForbiddenException('Access denied');
    }
    return transaction;
  }

  async findMyTransactions(userId: number) {
    return this.transactionsRepository.find({
      where: { buyer_id: userId },
      relations: ['listing', 'seller', 'seller.user', 'review'],
      order: { created_at: 'DESC' },
    });
  }

  async findMySales(userId: number) {
    const seller = await this.sellersRepository.findOne({
      where: { user_id: userId },
    });
    if (!seller) throw new ForbiddenException('User is not a seller');

    return this.transactionsRepository.find({
      where: { seller_id: seller.id },
      relations: ['listing', 'buyer', 'review'],
      order: { created_at: 'DESC' },
    });
  }
}
