import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { TransactionsService } from '../../src/transactions/transactions.service';
import { Transaction } from '../../src/transactions/transaction.entity';
import { Listing } from '../../src/listings/listing.entity';
import { Seller } from '../../src/sellers/seller.entity';

const mockSeller: Partial<Seller> = { id: 1, user_id: 99 };

const mockListing: Partial<Listing> = {
  id: 5,
  seller_id: 1,
  selling_price: 65000,
  active: true,
  seller: mockSeller as Seller,
};

const mockTransaction: Partial<Transaction> = {
  id: 1,
  buyer_id: 10,
  seller_id: 1,
  listing_id: 5,
  amount: 65000,
};

const mockTransactionRepo = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
};

const mockListingRepo = {
  findOne: jest.fn(),
  update: jest.fn(),
};

const mockSellerRepo = {
  findOne: jest.fn(),
  increment: jest.fn(),
};

describe('TransactionsService', () => {
  let service: TransactionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: getRepositoryToken(Transaction), useValue: mockTransactionRepo },
        { provide: getRepositoryToken(Listing), useValue: mockListingRepo },
        { provide: getRepositoryToken(Seller), useValue: mockSellerRepo },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    jest.clearAllMocks();
  });

  // ── create ───────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should create a transaction and mark the listing as sold', async () => {
      mockListingRepo.findOne.mockResolvedValue(mockListing);
      mockTransactionRepo.create.mockReturnValue(mockTransaction);
      mockTransactionRepo.save.mockResolvedValue({ ...mockTransaction, id: 1 });
      mockListingRepo.update.mockResolvedValue(undefined);
      mockSellerRepo.increment.mockResolvedValue(undefined);

      const result = await service.create(10, 5);

      expect(mockTransactionRepo.save).toHaveBeenCalled();
      expect(mockListingRepo.update).toHaveBeenCalledWith(5, { active: false, buyer_id: 10 });
      expect(mockSellerRepo.increment).toHaveBeenCalledWith({ id: 1 }, 'total_sales', 1);
    });

    it('should throw NotFoundException if listing does not exist or is inactive', async () => {
      mockListingRepo.findOne.mockResolvedValue(null);

      await expect(service.create(10, 5)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if buyer is the seller', async () => {
      // user_id 99 is the seller, so buying your own listing should fail
      mockListingRepo.findOne.mockResolvedValue(mockListing);

      await expect(service.create(99, 5)).rejects.toThrow(BadRequestException);
    });
  });

  // ── findOne ──────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('should return a transaction for the buyer', async () => {
      mockTransactionRepo.findOne.mockResolvedValue({
        ...mockTransaction,
        seller: mockSeller,
      });

      const result = await service.findOne(1, 10); // userId 10 is the buyer

      expect(result.amount).toBe(65000);
    });

    it('should throw NotFoundException if transaction does not exist', async () => {
      mockTransactionRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(99, 10)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is neither buyer nor seller', async () => {
      mockTransactionRepo.findOne.mockResolvedValue({
        ...mockTransaction,
        buyer_id: 10,
        seller: { user_id: 99 },
      });

      await expect(service.findOne(1, 55)).rejects.toThrow(ForbiddenException);
    });
  });

  // ── findMyTransactions ───────────────────────────────────────────────────────

  describe('findMyTransactions', () => {
    it('should return all transactions for a buyer', async () => {
      mockTransactionRepo.find.mockResolvedValue([mockTransaction]);

      const result = await service.findMyTransactions(10);

      expect(result).toHaveLength(1);
      expect(mockTransactionRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { buyer_id: 10 } }),
      );
    });
  });

  // ── findMySales ──────────────────────────────────────────────────────────────

  describe('findMySales', () => {
    it('should return all sales for a seller', async () => {
      mockSellerRepo.findOne.mockResolvedValue(mockSeller);
      mockTransactionRepo.find.mockResolvedValue([mockTransaction]);

      const result = await service.findMySales(99);

      expect(result).toHaveLength(1);
    });

    it('should throw ForbiddenException if user is not a seller', async () => {
      mockSellerRepo.findOne.mockResolvedValue(null);

      await expect(service.findMySales(10)).rejects.toThrow(ForbiddenException);
    });
  });
});
