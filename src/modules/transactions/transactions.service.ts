import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { CreateTransactionDto, UpdateTransactionDto } from './dtos/transaction.dto';
import { TransactionStatus, ListingStatus } from '../../common/enums';
import { Seller, Buyer } from '../users/entities/user.entity';
import { Listing } from '../listings/entities/listing.entity';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Seller)
    private readonly sellerRepository: Repository<Seller>,
    @InjectRepository(Buyer)
    private readonly buyerRepository: Repository<Buyer>,
    @InjectRepository(Listing)
    private readonly listingRepository: Repository<Listing>,
  ) {}

  async createTransaction(createTransactionDto: CreateTransactionDto): Promise<Transaction> {
    const { buyerId, listingId } = createTransactionDto;

    const listing = await this.listingRepository.findOne({ where: { id: listingId } });
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.status !== ListingStatus.AVAILABLE) {
      throw new BadRequestException('Listing is not available for purchase');
    }

    const buyer = await this.buyerRepository.findOne({ where: { id: buyerId } });
    if (!buyer) {
      throw new NotFoundException('Buyer not found');
    }

    const seller = await this.sellerRepository.findOne({ where: { id: listing.sellerId } });
    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    const transaction = this.transactionRepository.create({
      ...createTransactionDto,
      sellerId: listing.sellerId,
      status: TransactionStatus.PENDING,
    });

    return this.transactionRepository.save(transaction);
  }

  async getTransactionById(id: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ['buyer', 'seller', 'listing'],
    });
    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }
    return transaction;
  }

  async getTransactionsByBuyer(
    buyerId: string,
    skip: number = 0,
    take: number = 10,
  ): Promise<[Transaction[], number]> {
    return this.transactionRepository.findAndCount({
      where: { buyerId },
      relations: ['seller', 'listing'],
      skip,
      take,
      order: { createdAt: 'DESC' },
    });
  }

  async getTransactionsBySeller(
    sellerId: string,
    skip: number = 0,
    take: number = 10,
  ): Promise<[Transaction[], number]> {
    return this.transactionRepository.findAndCount({
      where: { sellerId },
      relations: ['buyer', 'listing'],
      skip,
      take,
      order: { createdAt: 'DESC' },
    });
  }

  async updateTransaction(id: string, updateTransactionDto: UpdateTransactionDto): Promise<Transaction> {
    const transaction = await this.getTransactionById(id);

    // If status is being updated to COMPLETED, update listing status
    if (
      updateTransactionDto.status === TransactionStatus.COMPLETED &&
      transaction.status !== TransactionStatus.COMPLETED
    ) {
      transaction.listing.status = ListingStatus.SOLD;
      await this.listingRepository.save(transaction.listing);
    }

    Object.assign(transaction, updateTransactionDto);
    return this.transactionRepository.save(transaction);
  }

  async deleteTransaction(id: string): Promise<void> {
    const result = await this.transactionRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }
  }

  async getTransactionsByListing(
    listingId: string,
    skip: number = 0,
    take: number = 10,
  ): Promise<[Transaction[], number]> {
    return this.transactionRepository.findAndCount({
      where: { listingId },
      relations: ['buyer', 'seller'],
      skip,
      take,
      order: { createdAt: 'DESC' },
    });
  }

  async getCompletedTransactionsBySeller(
    sellerId: string,
    skip: number = 0,
    take: number = 10,
  ): Promise<[Transaction[], number]> {
    return this.transactionRepository.findAndCount({
      where: { sellerId, status: TransactionStatus.COMPLETED },
      relations: ['buyer', 'listing'],
      skip,
      take,
      order: { createdAt: 'DESC' },
    });
  }
}
