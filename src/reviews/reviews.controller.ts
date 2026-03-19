/* eslint-disable */
import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsString, IsInt, Min, Max, IsOptional } from 'class-validator';

class CreateReviewDto {
  @IsOptional()
  @IsString()
  content?: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;
}

@Controller('reviews')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post('transaction/:transactionId')
  create(
    @Request() req,
    @Param('transactionId', ParseIntPipe) transactionId: number,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.create(
      req.user.id,
      transactionId,
      dto.content || '',
      dto.rating,
    );
  }

  @Get('transaction/:transactionId')
  findByTransaction(
    @Param('transactionId', ParseIntPipe) transactionId: number,
  ) {
    return this.reviewsService.findByTransaction(transactionId);
  }

  @Get('listing/:listingId/average')
  findAverageByListing(@Param('listingId', ParseIntPipe) listingId: number) {
    return this.reviewsService.findAverageByListing(listingId);
  }

  @Delete('transaction/:transactionId')
  remove(
    @Request() req,
    @Param('transactionId', ParseIntPipe) transactionId: number,
  ) {
    return this.reviewsService.remove(req.user.id, transactionId);
  }
}
