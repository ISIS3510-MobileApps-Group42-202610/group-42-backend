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

    // Recalculate seller avg_rating
    const allReviews = await this.reviewsRepository
      .createQueryBuilder('review')
      .innerJoin('review.transaction', 'transaction')
      .where('transaction.seller_id = :sellerId', {
        sellerId: transaction.seller_id,
      })
      .andWhere('review.rating IS NOT NULL')
      .getMany();

    if (allReviews.length > 0) {
      const avg =
        allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      await this.sellersRepository.update(transaction.seller_id, {
        avg_rating: avg,
      });
    }

    return review;
  }

  async findByTransaction(transactionId: number) {
    return this.reviewsRepository.findOne({
      where: { transaction_id: transactionId },
    });
  }
}
