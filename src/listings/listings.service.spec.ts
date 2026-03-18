import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ListingsService } from '../../src/listings/listings.service';
import { Listing } from '../../src/listings/listing.entity';
import { ListingImage } from '../../src/listings/listing-image.entity';
import { HistoricPrice } from '../../src/listings/historic-price.entity';
import { Seller } from '../../src/sellers/seller.entity';

const mockSeller: Partial<Seller> = { id: 1, user_id: 10 };

const mockListing: Partial<Listing> = {
  id: 1,
  seller_id: 1,
  title: 'Calculus Stewart',
  selling_price: 65000,
  active: true,
};

const mockTransactionManager = {
  getRepository: jest.fn(),
};

const mockListingRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(),
  manager: {
    transaction: jest.fn(async (cb) => cb(mockTransactionManager)),
  },
};

const mockImageRepo = {
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  find: jest.fn(),
  delete: jest.fn(),
  findOne: jest.fn(),
  manager: {
    transaction: jest.fn(async (cb) => cb(mockTransactionManager)),
  },
};

const mockPriceRepo = {
  save: jest.fn(),
  update: jest.fn(),
  find: jest.fn(),
};

const mockSellerRepo = {
  findOne: jest.fn(),
};

describe('ListingsService', () => {
  let service: ListingsService;

  beforeEach(async () => {
    mockTransactionManager.getRepository.mockImplementation((entity) => {
      if (entity === Listing) return mockListingRepo;
      if (entity === ListingImage) return mockImageRepo;
      if (entity === HistoricPrice) return mockPriceRepo;
      if (entity === Seller) return mockSellerRepo;
      return null;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListingsService,
        { provide: getRepositoryToken(Listing), useValue: mockListingRepo },
        { provide: getRepositoryToken(ListingImage), useValue: mockImageRepo },
        { provide: getRepositoryToken(HistoricPrice), useValue: mockPriceRepo },
        { provide: getRepositoryToken(Seller), useValue: mockSellerRepo },
      ],
    }).compile();

    service = module.get<ListingsService>(ListingsService);
    jest.clearAllMocks();
    mockImageRepo.find.mockResolvedValue([]);
    mockImageRepo.delete.mockResolvedValue(undefined);
  });

  // ── findAll ──────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return active listings', async () => {
      mockListingRepo.find.mockResolvedValue([mockListing]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(mockListingRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { active: true } }),
      );
    });

    it('should filter by category when provided', async () => {
      mockListingRepo.find.mockResolvedValue([]);

      await service.findAll('textbook');

      expect(mockListingRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { active: true, category: 'textbook' } }),
      );
    });
  });

  // ── findOne ──────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('should return a listing by id', async () => {
      mockListingRepo.findOne.mockResolvedValue(mockListing);

      const result = await service.findOne(1);

      expect(result.title).toBe('Calculus Stewart');
    });

    it('should throw NotFoundException if listing does not exist', async () => {
      mockListingRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  // ── create ───────────────────────────────────────────────────────────────────

  describe('create', () => {
    const dto = {
      title: 'New Book',
      selling_price: 50000,
      images: [{ url: 'http://img.com/new-book.jpg' }],
    };

    it('should create a listing and record initial price history', async () => {
      mockSellerRepo.findOne.mockResolvedValue(mockSeller);
      mockListingRepo.create.mockReturnValue({ ...mockListing });
      mockListingRepo.save.mockResolvedValue({ ...mockListing, id: 1 });
      mockListingRepo.findOne.mockResolvedValue({
        ...mockListing,
        images: [{ id: 1, url: 'http://img.com/new-book.jpg', sort_order: 0 }],
      });
      mockPriceRepo.save.mockResolvedValue({});
      mockImageRepo.create.mockImplementation((input) => input);
      mockImageRepo.save.mockResolvedValue([{ id: 1 }]);

      await service.create(10, dto);

      expect(mockListingRepo.save).toHaveBeenCalled();
      expect(mockPriceRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ listing_id: 1 }),
      );
    });

    it('should throw ForbiddenException if user is not a seller', async () => {
      mockSellerRepo.findOne.mockResolvedValue(null);

      await expect(service.create(10, dto)).rejects.toThrow(ForbiddenException);
    });
  });

  // ── update ───────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('should update the listing', async () => {
      mockListingRepo.findOne.mockResolvedValue(mockListing);
      mockSellerRepo.findOne.mockResolvedValue(mockSeller);
      mockListingRepo.update.mockResolvedValue(undefined);

      await service.update(1, 10, { title: 'Updated Title' });

      expect(mockListingRepo.update).toHaveBeenCalledWith(1, { title: 'Updated Title' });
    });

    it('should record a new price history entry when price changes', async () => {
      mockListingRepo.findOne.mockResolvedValue({ ...mockListing, selling_price: 65000 });
      mockSellerRepo.findOne.mockResolvedValue(mockSeller);
      mockListingRepo.update.mockResolvedValue(undefined);
      mockPriceRepo.update.mockResolvedValue(undefined);
      mockPriceRepo.save.mockResolvedValue({});

      await service.update(1, 10, { selling_price: 50000 });

      expect(mockPriceRepo.update).toHaveBeenCalled();
      expect(mockPriceRepo.save).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user does not own the listing', async () => {
      mockListingRepo.findOne.mockResolvedValue({ ...mockListing, seller_id: 99 });
      mockSellerRepo.findOne.mockResolvedValue(mockSeller); // seller.id = 1, listing.seller_id = 99

      await expect(service.update(1, 10, { title: 'X' })).rejects.toThrow(ForbiddenException);
    });
  });

  // ── remove ───────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('should delete the listing', async () => {
      mockListingRepo.findOne.mockResolvedValue(mockListing);
      mockSellerRepo.findOne.mockResolvedValue(mockSeller);
      mockListingRepo.remove.mockResolvedValue(undefined);

      const result = await service.remove(1, 10);

      expect(mockListingRepo.remove).toHaveBeenCalledWith(mockListing);
      expect(result.message).toBe('Listing deleted');
    });

    it('should throw ForbiddenException if user does not own the listing', async () => {
      mockListingRepo.findOne.mockResolvedValue({ ...mockListing, seller_id: 99 });
      mockSellerRepo.findOne.mockResolvedValue(mockSeller);

      await expect(service.remove(1, 10)).rejects.toThrow(ForbiddenException);
    });
  });

  // ── images ───────────────────────────────────────────────────────────────────

  describe('addImage', () => {
    it('should add an image to a listing', async () => {
      mockListingRepo.findOne.mockResolvedValue(mockListing);
      mockSellerRepo.findOne.mockResolvedValue(mockSeller);
      mockImageRepo.find
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          { id: 1, listing_id: 1, url: 'http://img.com/1.jpg', is_primary: true, sort_order: 0 },
        ]);
      mockImageRepo.create.mockReturnValue({ url: 'http://img.com/1.jpg', listing_id: 1 });
      mockImageRepo.save
        .mockResolvedValueOnce({ id: 1, url: 'http://img.com/1.jpg', listing_id: 1 })
        .mockResolvedValueOnce(undefined);

      const result = await service.addImage(1, 10, { url: 'http://img.com/1.jpg' });

      expect(mockImageRepo.save).toHaveBeenCalled();
    });

    it('should reset is_primary on other images when new image is primary', async () => {
      mockListingRepo.findOne.mockResolvedValue(mockListing);
      mockSellerRepo.findOne.mockResolvedValue(mockSeller);
      mockImageRepo.find
        .mockResolvedValueOnce([
          { id: 10, listing_id: 1, url: 'http://img.com/existing.jpg', is_primary: true, sort_order: 0 },
        ])
        .mockResolvedValueOnce([
          { id: 10, listing_id: 1, url: 'http://img.com/existing.jpg', is_primary: false, sort_order: 0 },
          { id: 11, listing_id: 1, url: 'http://img.com/2.jpg', is_primary: true, sort_order: 1 },
        ]);
      mockImageRepo.update.mockResolvedValue(undefined);
      mockImageRepo.create.mockReturnValue({});
      mockImageRepo.save.mockResolvedValue({});

      await service.addImage(1, 10, { url: 'http://img.com/2.jpg', is_primary: true });

      expect(mockImageRepo.update).toHaveBeenCalledWith(
        { listing_id: 1 },
        { is_primary: false },
      );
    });
  });

  // ── getHomeData ──────────────────────────────────────────────────────────────

  describe('getHomeData', () => {
    it('should return home data with recent, trending, and categories', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn(),
        leftJoin: jest.fn(),
        where: jest.fn(),
        andWhere: jest.fn(),
        groupBy: jest.fn(),
        addGroupBy: jest.fn(),
        select: jest.fn(),
        addSelect: jest.fn(),
        orderBy: jest.fn(),
        limit: jest.fn(),
        getMany: jest.fn(),
        getRawMany: jest.fn(),
      };

      const recentListings = [{ id: 1, title: 'Recent Book' }];
      const trendingScores = [{ id: 2, trend_score: 100 }];
      const trendingListings = [{ id: 2, title: 'Trending Book' }];
      const categories = [{ category: 'textbook', count: 10 }];

      // Setup for getRecentListings
      mockListingRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.leftJoinAndSelect.mockReturnThis();
      mockQueryBuilder.where.mockReturnThis();
      mockQueryBuilder.orderBy.mockReturnThis();
      mockQueryBuilder.limit.mockReturnThis();
      mockQueryBuilder.getMany.mockResolvedValueOnce(recentListings);

      // Setup for getTrendingListings - first query
      mockQueryBuilder.leftJoin.mockReturnThis();
      mockQueryBuilder.groupBy.mockReturnThis();
      mockQueryBuilder.addGroupBy.mockReturnThis();
      mockQueryBuilder.select.mockReturnThis();
      mockQueryBuilder.addSelect.mockReturnThis();
      mockQueryBuilder.getRawMany.mockResolvedValueOnce(trendingScores);

      // Setup for getTrendingListings - second query
      mockQueryBuilder.getMany.mockResolvedValueOnce(trendingListings);

      // Setup for getCategories
      mockQueryBuilder.andWhere.mockReturnThis();
      mockQueryBuilder.getRawMany.mockResolvedValueOnce([
        { category: 'textbook', count: '10' },
      ]);

      const result = await service.getHomeData();

      expect(result).toHaveProperty('recent');
      expect(result).toHaveProperty('trending');
      expect(result).toHaveProperty('categories');
      expect(mockListingRepo.createQueryBuilder).toHaveBeenCalled();
    });
  });

  // ── getRecentListings ────────────────────────────────────────────────────────

  describe('getRecentListings', () => {
    it('should return recent listings ordered by creation date', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn(),
        where: jest.fn(),
        orderBy: jest.fn(),
        limit: jest.fn(),
        getMany: jest.fn(),
      };

      const recentListings = [
        { id: 1, title: 'Book 1', created_at: new Date('2025-01-01') },
        { id: 2, title: 'Book 2', created_at: new Date('2024-12-01') },
      ];

      mockListingRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.leftJoinAndSelect.mockReturnThis();
      mockQueryBuilder.where.mockReturnThis();
      mockQueryBuilder.orderBy.mockReturnThis();
      mockQueryBuilder.limit.mockReturnThis();
      mockQueryBuilder.getMany.mockResolvedValue(recentListings);

      const result = await service['getRecentListings']();

      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Book 1');
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(15);
    });

    it('should load related entities (images, seller, user, course)', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn(),
        where: jest.fn(),
        orderBy: jest.fn(),
        limit: jest.fn(),
        getMany: jest.fn(),
      };

      mockListingRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.leftJoinAndSelect.mockReturnThis();
      mockQueryBuilder.where.mockReturnThis();
      mockQueryBuilder.orderBy.mockReturnThis();
      mockQueryBuilder.limit.mockReturnThis();
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await service['getRecentListings']();

      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'listing.images',
        'images',
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'listing.seller',
        'seller',
      );
    });
  });

  // ── getTrendingListings ──────────────────────────────────────────────────────

  describe('getTrendingListings', () => {
    it('should return trending listings based on scoring algorithm', async () => {
      const mockQueryBuilder = {
        leftJoin: jest.fn(),
        where: jest.fn(),
        groupBy: jest.fn(),
        addGroupBy: jest.fn(),
        select: jest.fn(),
        addSelect: jest.fn(),
        orderBy: jest.fn(),
        limit: jest.fn(),
        getRawMany: jest.fn(),
        leftJoinAndSelect: jest.fn(),
        getMany: jest.fn(),
      };

      const trendScores = [
        { id: 1, trend_score: 85.5 },
        { id: 2, trend_score: 72.3 },
      ];

      const trendingListings = [
        { id: 1, title: 'Popular Book', seller: { user: {} } },
        { id: 2, title: 'Trending Book', seller: { user: {} } },
      ];

      mockListingRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.leftJoin.mockReturnThis();
      mockQueryBuilder.where.mockReturnThis();
      mockQueryBuilder.groupBy.mockReturnThis();
      mockQueryBuilder.addGroupBy.mockReturnThis();
      mockQueryBuilder.select.mockReturnThis();
      mockQueryBuilder.addSelect.mockReturnThis();
      mockQueryBuilder.orderBy.mockReturnThis();
      mockQueryBuilder.limit.mockReturnThis();
      mockQueryBuilder.getRawMany.mockResolvedValueOnce(trendScores);

      mockQueryBuilder.leftJoinAndSelect.mockReturnThis();
      mockQueryBuilder.getMany.mockResolvedValueOnce(trendingListings);

      const result = await service['getTrendingListings']();

      expect(result).toHaveLength(2);
      expect(mockQueryBuilder.getRawMany).toHaveBeenCalled();
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(15);
    });

    it('should return empty array when no trending listings found', async () => {
      const mockQueryBuilder = {
        leftJoin: jest.fn(),
        where: jest.fn(),
        groupBy: jest.fn(),
        addGroupBy: jest.fn(),
        select: jest.fn(),
        addSelect: jest.fn(),
        orderBy: jest.fn(),
        limit: jest.fn(),
        getRawMany: jest.fn(),
      };

      mockListingRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.leftJoin.mockReturnThis();
      mockQueryBuilder.where.mockReturnThis();
      mockQueryBuilder.groupBy.mockReturnThis();
      mockQueryBuilder.addGroupBy.mockReturnThis();
      mockQueryBuilder.select.mockReturnThis();
      mockQueryBuilder.addSelect.mockReturnThis();
      mockQueryBuilder.orderBy.mockReturnThis();
      mockQueryBuilder.limit.mockReturnThis();
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      const result = await service['getTrendingListings']();

      expect(result).toHaveLength(0);
    });
  });

  // ── getCategories ───────────────────────────────────────────────────────────

  describe('getCategories', () => {
    it('should return categories with counts', async () => {
      const mockQueryBuilder = {
        select: jest.fn(),
        addSelect: jest.fn(),
        where: jest.fn(),
        andWhere: jest.fn(),
        groupBy: jest.fn(),
        orderBy: jest.fn(),
        getRawMany: jest.fn(),
      };

      const rawCategories = [
        { category: 'textbooks', count: '25' },
        { category: 'notes', count: '15' },
        { category: 'supplies', count: '10' },
      ];

      mockListingRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.select.mockReturnThis();
      mockQueryBuilder.addSelect.mockReturnThis();
      mockQueryBuilder.where.mockReturnThis();
      mockQueryBuilder.andWhere.mockReturnThis();
      mockQueryBuilder.groupBy.mockReturnThis();
      mockQueryBuilder.orderBy.mockReturnThis();
      mockQueryBuilder.getRawMany.mockResolvedValue(rawCategories);

      const result = await service['getCategories']();

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ category: 'textbooks', count: 25 });
      expect(result[1]).toEqual({ category: 'notes', count: 15 });
      expect(result[2]).toEqual({ category: 'supplies', count: 10 });
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('count', 'DESC');
    });

    it('should exclude null categories', async () => {
      const mockQueryBuilder = {
        select: jest.fn(),
        addSelect: jest.fn(),
        where: jest.fn(),
        andWhere: jest.fn(),
        groupBy: jest.fn(),
        orderBy: jest.fn(),
        getRawMany: jest.fn(),
      };

      mockListingRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.select.mockReturnThis();
      mockQueryBuilder.addSelect.mockReturnThis();
      mockQueryBuilder.where.mockReturnThis();
      mockQueryBuilder.andWhere.mockReturnThis();
      mockQueryBuilder.groupBy.mockReturnThis();
      mockQueryBuilder.orderBy.mockReturnThis();
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      await service['getCategories']();

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'listing.category IS NOT NULL',
      );
    });
  });
});

