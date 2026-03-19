import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './review.entity';
import { Transaction } from '../transactions/transaction.entity';
import { Seller } from '../sellers/seller.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private reviewsRepository: Repository<Review>,
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
    @InjectRepository(Seller)
    private sellersRepository: Repository<Seller>,
  ) {}

  async create(
    userId: number,
    transactionId: number,
    content: string,
    rating: number,
  ) {
    const transaction = await this.transactionsRepository.findOne({
      where: { id: transactionId },
      relations: ['review'],
    });
    if (!transaction) throw new NotFoundException('Transaction not found');
    if (transaction.buyer_id !== userId)
      throw new ForbiddenException('Not your transaction');
    if (transaction.review)
      throw new ConflictException('Review already exists');

    const review = this.reviewsRepository.create({
      transaction_id: transactionId,
      content,
      rating,
    });
    await this.reviewsRepository.save(review);

    await this.recalculateSellerAverage(transaction.seller_id);

    return review;
  }

  async findByTransaction(transactionId: number) {
    return this.reviewsRepository.findOne({
      where: { transaction_id: transactionId },
    });
  }

  async findAverageByListing(listingId: number) {
    const result = await this.reviewsRepository
      .createQueryBuilder('review')
      .innerJoin('review.transaction', 'transaction')
      .select('AVG(review.rating)', 'average')
      .addSelect('COUNT(review.id)', 'count')
      .where('transaction.listing_id = :listingId', { listingId })
      .andWhere('review.rating IS NOT NULL')
      .getRawOne<{ average: string | null; count: string }>();

    const reviews_count = Number(result?.count ?? 0);
    const average_rating = result?.average ? Number(result.average) : 0;

    return {
      listing_id: listingId,
      average_rating,
      reviews_count,
    };
  }

  async remove(userId: number, transactionId: number) {
    const transaction = await this.transactionsRepository.findOne({
      where: { id: transactionId },
      relations: ['review'],
    });

    if (!transaction) throw new NotFoundException('Transaction not found');
    if (transaction.buyer_id !== userId)
      throw new ForbiddenException('Not your transaction');
    if (!transaction.review) throw new NotFoundException('Review not found');

    await this.reviewsRepository.delete(transaction.review.id);
    await this.recalculateSellerAverage(transaction.seller_id);

    return { message: 'Review deleted' };
  }

  private async recalculateSellerAverage(sellerId: number) {
    const result = await this.reviewsRepository
      .createQueryBuilder('review')
      .innerJoin('review.transaction', 'transaction')
      .select('AVG(review.rating)', 'average')
      .where('transaction.seller_id = :sellerId', { sellerId })
      .andWhere('review.rating IS NOT NULL')
      .getRawOne<{ average: string | null }>();

    await this.sellersRepository.update(sellerId, {
      avg_rating: result?.average ? Number(result.average) : 0,
    });
  }
}
