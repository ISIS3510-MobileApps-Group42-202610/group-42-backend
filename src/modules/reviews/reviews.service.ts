import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { CreateReviewDto, UpdateReviewDto } from './dtos/review.dto';
import { ReviewType } from '../../common/enums';
import { Transaction } from '../transactions/entities/transaction.entity';
import { Seller, Buyer } from '../users/entities/user.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Seller)
    private readonly sellerRepository: Repository<Seller>,
    @InjectRepository(Buyer)
    private readonly buyerRepository: Repository<Buyer>,
  ) {}

  async createReview(
    userId: string,
    createReviewDto: CreateReviewDto,
  ): Promise<Review> {
    const { transactionId } = createReviewDto;

    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId },
      relations: ['buyer', 'seller'],
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Determine if reviewer is buyer or seller
    let buyerId: string;
    let sellerId: string;

    if (createReviewDto.reviewType === ReviewType.BUYER_TO_SELLER) {
      if (transaction.buyerId !== userId) {
        throw new BadRequestException('Only the buyer can create a buyer-to-seller review');
      }
      buyerId = transaction.buyerId;
      sellerId = transaction.sellerId;
    } else {
      if (transaction.sellerId !== userId) {
        throw new BadRequestException('Only the seller can create a seller-to-buyer review');
      }
      buyerId = transaction.buyerId;
      sellerId = transaction.sellerId;
    }

    // Check if review already exists
    const existingReview = await this.reviewRepository.findOne({
      where: { transactionId, reviewType: createReviewDto.reviewType },
    });

    if (existingReview) {
      throw new BadRequestException('Review for this transaction already exists');
    }

    const review = this.reviewRepository.create({
      ...createReviewDto,
      buyerId,
      sellerId,
    });

    const savedReview = await this.reviewRepository.save(review);

    // Update seller rating if it's a buyer-to-seller review
    if (createReviewDto.reviewType === ReviewType.BUYER_TO_SELLER) {
      await this.updateSellerRating(sellerId);
    } else {
      // Update buyer rating if it's a seller-to-buyer review
      await this.updateBuyerRating(buyerId);
    }

    return savedReview;
  }

  async getReviewById(id: string): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['transaction', 'buyer', 'seller'],
    });
    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }
    return review;
  }

  async getReviewsByTransaction(transactionId: string): Promise<Review[]> {
    return this.reviewRepository.find({
      where: { transactionId },
      relations: ['buyer', 'seller'],
    });
  }

  async getSellerReviews(
    sellerId: string,
    skip: number = 0,
    take: number = 10,
  ): Promise<[Review[], number]> {
    return this.reviewRepository.findAndCount({
      where: { sellerId, reviewType: ReviewType.BUYER_TO_SELLER },
      relations: ['buyer', 'transaction'],
      skip,
      take,
      order: { createdAt: 'DESC' },
    });
  }

  async getBuyerReviews(
    buyerId: string,
    skip: number = 0,
    take: number = 10,
  ): Promise<[Review[], number]> {
    return this.reviewRepository.findAndCount({
      where: { buyerId, reviewType: ReviewType.SELLER_TO_BUYER },
      relations: ['seller', 'transaction'],
      skip,
      take,
      order: { createdAt: 'DESC' },
    });
  }

  async updateReview(id: string, updateReviewDto: UpdateReviewDto): Promise<Review> {
    const review = await this.getReviewById(id);
    Object.assign(review, updateReviewDto);
    const updatedReview = await this.reviewRepository.save(review);

    // Update ratings if rating was changed
    if (updateReviewDto.rating) {
      if (review.reviewType === ReviewType.BUYER_TO_SELLER) {
        await this.updateSellerRating(review.sellerId);
      } else {
        await this.updateBuyerRating(review.buyerId);
      }
    }

    return updatedReview;
  }

  async deleteReview(id: string): Promise<void> {
    const review = await this.getReviewById(id);
    await this.reviewRepository.remove(review);

    // Update ratings after deletion
    if (review.reviewType === ReviewType.BUYER_TO_SELLER) {
      await this.updateSellerRating(review.sellerId);
    } else {
      await this.updateBuyerRating(review.buyerId);
    }
  }

  private async updateSellerRating(sellerId: string): Promise<void> {
    const reviews = await this.reviewRepository.find({
      where: { sellerId, reviewType: ReviewType.BUYER_TO_SELLER },
    });

    if (reviews.length === 0) {
      await this.sellerRepository.update(sellerId, { averageSellerRating: 0 });
      return;
    }

    const avgRating =
      reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
    await this.sellerRepository.update(sellerId, { averageSellerRating: avgRating });
  }

  private async updateBuyerRating(buyerId: string): Promise<void> {
    const reviews = await this.reviewRepository.find({
      where: { buyerId, reviewType: ReviewType.SELLER_TO_BUYER },
    });

    if (reviews.length === 0) {
      await this.buyerRepository.update(buyerId, { averageBuyerRating: 0 });
      return;
    }

    const avgRating =
      reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
    await this.buyerRepository.update(buyerId, { averageBuyerRating: avgRating });
  }

  async getAverageSellerRating(sellerId: string): Promise<number> {
    const result = await this.reviewRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avgRating')
      .where('review.sellerId = :sellerId', { sellerId })
      .andWhere('review.reviewType = :reviewType', { reviewType: ReviewType.BUYER_TO_SELLER })
      .getRawOne();

    return result.avgRating ? parseFloat(result.avgRating) : 0;
  }

  async getAverageBuyerRating(buyerId: string): Promise<number> {
    const result = await this.reviewRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avgRating')
      .where('review.buyerId = :buyerId', { buyerId })
      .andWhere('review.reviewType = :reviewType', { reviewType: ReviewType.SELLER_TO_BUYER })
      .getRawOne();

    return result.avgRating ? parseFloat(result.avgRating) : 0;
  }
}
