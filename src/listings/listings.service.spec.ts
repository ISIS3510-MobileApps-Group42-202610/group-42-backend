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

const mockListingRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

const mockImageRepo = {
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  findOne: jest.fn(),
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
    const dto = { title: 'New Book', selling_price: 50000 };

    it('should create a listing and record initial price history', async () => {
      mockSellerRepo.findOne.mockResolvedValue(mockSeller);
      mockListingRepo.create.mockReturnValue({ ...mockListing });
      mockListingRepo.save.mockResolvedValue({ ...mockListing, id: 1 });
      mockPriceRepo.save.mockResolvedValue({});

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
      mockImageRepo.create.mockReturnValue({ url: 'http://img.com/1.jpg', listing_id: 1 });
      mockImageRepo.save.mockResolvedValue({ id: 1, url: 'http://img.com/1.jpg' });

      const result = await service.addImage(1, 10, { url: 'http://img.com/1.jpg' });

      expect(mockImageRepo.save).toHaveBeenCalled();
    });

    it('should reset is_primary on other images when new image is primary', async () => {
      mockListingRepo.findOne.mockResolvedValue(mockListing);
      mockSellerRepo.findOne.mockResolvedValue(mockSeller);
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
});
