import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import {
  CreateReviewDto,
  UpdateReviewDto,
  ReviewResponseDto,
  ReviewDetailResponseDto,
} from './dtos/review.dto';

@Controller('api/reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createReview(
    @Query('userId') userId: string,
    @Body() createReviewDto: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    const review = await this.reviewsService.createReview(userId, createReviewDto);
    return this.mapReviewToDto(review);
  }

  @Get(':id')
  async getReviewById(@Param('id') id: string): Promise<ReviewDetailResponseDto> {
    const review = await this.reviewsService.getReviewById(id);
    return this.mapReviewToDetailDto(review);
  }

  @Get('transaction/:transactionId')
  async getReviewsByTransaction(
    @Param('transactionId') transactionId: string,
  ): Promise<ReviewResponseDto[]> {
    const reviews = await this.reviewsService.getReviewsByTransaction(transactionId);
    return reviews.map((r) => this.mapReviewToDto(r));
  }

  @Get('seller/:sellerId')
  async getSellerReviews(
    @Param('sellerId') sellerId: string,
    @Query('skip') skip: number = 0,
    @Query('take') take: number = 10,
  ): Promise<{ data: ReviewResponseDto[]; total: number; averageRating: number }> {
    const [reviews, total] = await this.reviewsService.getSellerReviews(sellerId, skip, take);
    const averageRating = await this.reviewsService.getAverageSellerRating(sellerId);

    return {
      data: reviews.map((r) => this.mapReviewToDto(r)),
      total,
      averageRating,
    };
  }

  @Get('buyer/:buyerId')
  async getBuyerReviews(
    @Param('buyerId') buyerId: string,
    @Query('skip') skip: number = 0,
    @Query('take') take: number = 10,
  ): Promise<{ data: ReviewResponseDto[]; total: number; averageRating: number }> {
    const [reviews, total] = await this.reviewsService.getBuyerReviews(buyerId, skip, take);
    const averageRating = await this.reviewsService.getAverageBuyerRating(buyerId);

    return {
      data: reviews.map((r) => this.mapReviewToDto(r)),
      total,
      averageRating,
    };
  }

  @Patch(':id')
  async updateReview(
    @Param('id') id: string,
    @Body() updateReviewDto: UpdateReviewDto,
  ): Promise<ReviewResponseDto> {
    const review = await this.reviewsService.updateReview(id, updateReviewDto);
    return this.mapReviewToDto(review);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteReview(@Param('id') id: string): Promise<void> {
    await this.reviewsService.deleteReview(id);
  }

  private mapReviewToDto(review: any): ReviewResponseDto {
    return {
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      reviewType: review.reviewType,
      buyerId: review.buyerId,
      sellerId: review.sellerId,
      transactionId: review.transactionId,
      createdAt: review.createdAt,
    };
  }

  private mapReviewToDetailDto(review: any): ReviewDetailResponseDto {
    return {
      ...this.mapReviewToDto(review),
      reviewer: review.reviewerType === 'BUYER_TO_SELLER' && review.buyer
        ? {
            id: review.buyer.id,
            fullName: review.buyer.fullName,
            profilePhotoUrl: review.buyer.profilePhotoUrl,
          }
        : review.seller
          ? {
              id: review.seller.id,
              fullName: review.seller.fullName,
              profilePhotoUrl: review.seller.profilePhotoUrl,
            }
          : undefined,
      reviewed: review.reviewerType === 'BUYER_TO_SELLER' && review.seller
        ? {
            id: review.seller.id,
            fullName: review.seller.fullName,
            profilePhotoUrl: review.seller.profilePhotoUrl,
          }
        : review.buyer
          ? {
              id: review.buyer.id,
              fullName: review.buyer.fullName,
              profilePhotoUrl: review.buyer.profilePhotoUrl,
            }
          : undefined,
    };
  }
}
