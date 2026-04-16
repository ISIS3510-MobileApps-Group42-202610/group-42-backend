import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { ReviewsService } from '../../src/reviews/reviews.service';
import { Review } from '../../src/reviews/review.entity';
import { Transaction } from '../../src/transactions/transaction.entity';
import { Seller } from '../../src/sellers/seller.entity';

const mockTransaction: Partial<Transaction> = {
  id: 1,
  buyer_id: 10,
  seller_id: 1,
  review: undefined,
};

const mockReview: Partial<Review> = {
  id: 1,
  transaction_id: 1,
  content: 'Great seller!',
  rating: 5,
};

const mockReviewRepo = {
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  findOne: jest.fn(),
  createQueryBuilder: jest.fn(),
};

const mockTransactionRepo = {
  findOne: jest.fn(),
};

const mockSellerRepo = {
  update: jest.fn(),
};

// Helper to mock the query builder chain used in avg_rating recalculation
const mockQB = {
  innerJoin: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  getRawOne: jest.fn(),
};

describe('ReviewsService', () => {
  let service: ReviewsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: getRepositoryToken(Review), useValue: mockReviewRepo },
        { provide: getRepositoryToken(Transaction), useValue: mockTransactionRepo },
        { provide: getRepositoryToken(Seller), useValue: mockSellerRepo },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
    jest.clearAllMocks();

    mockReviewRepo.createQueryBuilder.mockReturnValue(mockQB);
  });

  // ── create ───────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should create a review and update seller avg_rating', async () => {
      mockTransactionRepo.findOne.mockResolvedValue(mockTransaction);
      mockReviewRepo.create.mockReturnValue(mockReview);
      mockReviewRepo.save.mockResolvedValue(mockReview);
      mockQB.getRawOne.mockResolvedValue({ average: '4' });
      mockSellerRepo.update.mockResolvedValue(undefined);

      const result = await service.create(10, 1, 'Great seller!', 5);

      expect(result).toEqual(mockReview);
      expect(mockReviewRepo.save).toHaveBeenCalled();
      expect(mockSellerRepo.update).toHaveBeenCalledWith(
        mockTransaction.seller_id,
        { avg_rating: 4 },
      );
    });

    it('should throw NotFoundException if transaction does not exist', async () => {
      mockTransactionRepo.findOne.mockResolvedValue(null);

      await expect(service.create(10, 99, 'Good', 4)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not the buyer', async () => {
      mockTransactionRepo.findOne.mockResolvedValue({ ...mockTransaction, buyer_id: 10 });

      await expect(service.create(55, 1, 'Good', 4)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException if review already exists', async () => {
      mockTransactionRepo.findOne.mockResolvedValue({
        ...mockTransaction,
        review: { id: 1 }, // already has a review
      });

      await expect(service.create(10, 1, 'Good', 4)).rejects.toThrow(ConflictException);
    });
  });

  // ── findByTransaction ─────────────────────────────────────────────────────────

  describe('findByTransaction', () => {
    it('should return the review for a transaction', async () => {
      mockReviewRepo.findOne.mockResolvedValue(mockReview);

      const result = await service.findByTransaction(1);

      expect(result).not.toBeNull();
      expect(result?.rating).toBe(5);
      expect(mockReviewRepo.findOne).toHaveBeenCalledWith({
        where: { transaction_id: 1 },
      });
    });

    it('should return null if no review exists', async () => {
      mockReviewRepo.findOne.mockResolvedValue(null);

      const result = await service.findByTransaction(1);

      expect(result).toBeNull();
    });
  });

  // ── findAverageByListing ──────────────────────────────────────────────────────

  describe('findAverageByListing', () => {
    it('should return listing average and count', async () => {
      mockQB.getRawOne.mockResolvedValue({ average: '4.5', count: '2' });

      const result = await service.findAverageByListing(7);

      expect(result).toEqual({
        listing_id: 7,
        average_rating: 4.5,
        reviews_count: 2,
      });
    });

    it('should return zeros when listing has no reviews', async () => {
      mockQB.getRawOne.mockResolvedValue({ average: null, count: '0' });

      const result = await service.findAverageByListing(7);

      expect(result).toEqual({
        listing_id: 7,
        average_rating: 0,
        reviews_count: 0,
      });
    });
  });

  // ── remove ────────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('should delete review and recalculate seller avg_rating', async () => {
      mockTransactionRepo.findOne.mockResolvedValue({
        ...mockTransaction,
        review: { id: 1 },
      });
      mockReviewRepo.delete.mockResolvedValue(undefined);
      mockQB.getRawOne.mockResolvedValue({ average: '3.5' });
      mockSellerRepo.update.mockResolvedValue(undefined);

      const result = await service.remove(10, 1);

      expect(mockReviewRepo.delete).toHaveBeenCalledWith(1);
      expect(mockSellerRepo.update).toHaveBeenCalledWith(
        mockTransaction.seller_id,
        { avg_rating: 3.5 },
      );
      expect(result).toEqual({ message: 'Review deleted' });
    });

    it('should throw NotFoundException if transaction does not exist', async () => {
      mockTransactionRepo.findOne.mockResolvedValue(null);

      await expect(service.remove(10, 99)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not the buyer', async () => {
      mockTransactionRepo.findOne.mockResolvedValue({ ...mockTransaction, buyer_id: 8 });

      await expect(service.remove(10, 1)).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if transaction has no review', async () => {
      mockTransactionRepo.findOne.mockResolvedValue({
        ...mockTransaction,
        review: undefined,
      });

      await expect(service.remove(10, 1)).rejects.toThrow(NotFoundException);
    });
  });
});
