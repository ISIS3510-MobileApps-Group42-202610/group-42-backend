import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { SellersService } from '../../src/sellers/sellers.service';
import { Seller } from '../../src/sellers/seller.entity';

const mockSeller: Partial<Seller> = {
  id: 1,
  user_id: 1,
  total_sales: 5,
  avg_rating: 4.2,
};

const mockSellerRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
};

describe('SellersService', () => {
  let service: SellersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SellersService,
        { provide: getRepositoryToken(Seller), useValue: mockSellerRepo },
      ],
    }).compile();

    service = module.get<SellersService>(SellersService);
    jest.clearAllMocks();
  });

  // ── findAll ──────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return all sellers with user relation', async () => {
      mockSellerRepo.find.mockResolvedValue([mockSeller]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(mockSellerRepo.find).toHaveBeenCalledWith({ relations: ['user'] });
    });
  });

  // ── findOne ──────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('should return a seller by id', async () => {
      mockSellerRepo.findOne.mockResolvedValue(mockSeller);

      const result = await service.findOne(1);

      expect(result.total_sales).toBe(5);
    });

    it('should throw NotFoundException if seller does not exist', async () => {
      mockSellerRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  // ── findByUser ───────────────────────────────────────────────────────────────

  describe('findByUser', () => {
    it('should return the seller profile for a given user', async () => {
      mockSellerRepo.findOne.mockResolvedValue(mockSeller);

      const result = await service.findByUser(1);

      expect(result.user_id).toBe(1);
    });

    it('should throw NotFoundException if user has no seller profile', async () => {
      mockSellerRepo.findOne.mockResolvedValue(null);

      await expect(service.findByUser(99)).rejects.toThrow(NotFoundException);
    });
  });
});
