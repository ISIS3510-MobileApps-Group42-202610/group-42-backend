import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { MessagesService } from '../../src/messages/messages.service';
import { Message, SentBy } from '../../src/messages/message.entity';
import { Seller } from '../../src/sellers/seller.entity';

// seller.id = 1, seller's user account = userId 99
const mockSeller: Partial<Seller> = { id: 1, user_id: 99 };

const mockBuyerMessage: Partial<Message> = {
  id: 1,
  buyer_id: 10,
  seller_id: 1,
  content: 'Is this still available?',
  sent_by: SentBy.BUYER,
  is_read: false,
};

const mockSellerMessage: Partial<Message> = {
  id: 2,
  buyer_id: 10,
  seller_id: 1,
  content: 'Yes, still available!',
  sent_by: SentBy.SELLER,
  is_read: false,
};

const mockQB = {
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  getMany: jest.fn(),
};

const mockMessageRepo = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue(mockQB),
};

const mockSellerRepo = {
  findOne: jest.fn(),
};

describe('MessagesService', () => {
  let service: MessagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        { provide: getRepositoryToken(Message), useValue: mockMessageRepo },
        { provide: getRepositoryToken(Seller), useValue: mockSellerRepo },
      ],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
    jest.clearAllMocks();
    mockMessageRepo.createQueryBuilder.mockReturnValue(mockQB);
  });

  // ── sendMessageAsBuyer ────────────────────────────────────────────────────────

  describe('sendMessageAsBuyer', () => {
    it('should create a message with sent_by = BUYER', async () => {
      mockSellerRepo.findOne.mockResolvedValue(mockSeller);
      mockMessageRepo.create.mockReturnValue(mockBuyerMessage);
      mockMessageRepo.save.mockResolvedValue({ ...mockBuyerMessage, id: 1 });

      const result = await service.sendMessageAsBuyer(
        10,
        1,
        'Is this still available?',
      );

      expect(mockMessageRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          sent_by: SentBy.BUYER,
          buyer_id: 10,
          seller_id: 1,
        }),
      );
      expect(mockMessageRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if seller does not exist', async () => {
      mockSellerRepo.findOne.mockResolvedValue(null);

      await expect(service.sendMessageAsBuyer(10, 99, 'Hello')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if the seller tries to message themselves', async () => {
      // userId 99 is the seller's own user account
      mockSellerRepo.findOne.mockResolvedValue(mockSeller);

      await expect(
        service.sendMessageAsBuyer(99, 1, 'Hello me'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ── sendMessageAsSeller ───────────────────────────────────────────────────────

  describe('sendMessageAsSeller', () => {
    it('should create a message with sent_by = SELLER', async () => {
      mockSellerRepo.findOne.mockResolvedValue(mockSeller);
      mockMessageRepo.create.mockReturnValue(mockSellerMessage);
      mockMessageRepo.save.mockResolvedValue({ ...mockSellerMessage, id: 2 });

      const result = await service.sendMessageAsSeller(
        99,
        10,
        'Yes, still available!',
      );

      expect(mockMessageRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          sent_by: SentBy.SELLER,
          buyer_id: 10,
          seller_id: 1,
        }),
      );
      expect(mockMessageRepo.save).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if the user has no seller profile', async () => {
      mockSellerRepo.findOne.mockResolvedValue(null);

      await expect(service.sendMessageAsSeller(10, 5, 'Hello')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException if seller tries to message themselves', async () => {
      // user_id 99 is the seller, buyer_id is also 99
      mockSellerRepo.findOne.mockResolvedValue(mockSeller);

      await expect(
        service.sendMessageAsSeller(99, 99, 'Hello me'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ── getConversation ───────────────────────────────────────────────────────────

  describe('getConversation', () => {
    it('should return the thread for a buyer', async () => {
      mockSellerRepo.findOne.mockResolvedValue(mockSeller);
      mockMessageRepo.find.mockResolvedValue([
        mockBuyerMessage,
        mockSellerMessage,
      ]);

      const result = await service.getConversation(10, 1); // userId 10 = buyer

      expect(result).toHaveLength(2);
    });

    it('should return all threads for the seller', async () => {
      mockSellerRepo.findOne.mockResolvedValue(mockSeller);
      mockMessageRepo.find.mockResolvedValue([mockBuyerMessage]);

      const result = await service.getConversation(99, 1); // userId 99 = seller

      expect(mockMessageRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { seller_id: 1 } }),
      );
    });

    it('should throw NotFoundException if seller does not exist', async () => {
      mockSellerRepo.findOne.mockResolvedValue(null);

      await expect(service.getConversation(10, 99)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── getConversationWithBuyer ──────────────────────────────────────────────────

  describe('getConversationWithBuyer', () => {
    it('should return a specific thread between seller and buyer', async () => {
      mockSellerRepo.findOne.mockResolvedValue(mockSeller);
      mockMessageRepo.find.mockResolvedValue([
        mockBuyerMessage,
        mockSellerMessage,
      ]);

      const result = await service.getConversationWithBuyer(99, 10);

      expect(mockMessageRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { seller_id: 1, buyer_id: 10 } }),
      );
    });

    it('should throw ForbiddenException if user has no seller profile', async () => {
      mockSellerRepo.findOne.mockResolvedValue(null);

      await expect(service.getConversationWithBuyer(10, 5)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ── getMyConversationsAsBuyer ─────────────────────────────────────────────────

  describe('getMyConversationsAsBuyer', () => {
    it('should return all conversations for a buyer', async () => {
      mockQB.getMany.mockResolvedValue([mockBuyerMessage]);

      const result = await service.getMyConversationsAsBuyer(10);

      expect(result).toHaveLength(1);
      expect(mockQB.where).toHaveBeenCalledWith('message.buyer_id = :userId', {
        userId: 10,
      });
    });
  });

  // ── getMyConversationsAsSeller ────────────────────────────────────────────────

  describe('getMyConversationsAsSeller', () => {
    it('should return all conversations for a seller', async () => {
      mockSellerRepo.findOne.mockResolvedValue(mockSeller);
      mockQB.getMany.mockResolvedValue([mockBuyerMessage]);

      const result = await service.getMyConversationsAsSeller(99);

      expect(mockQB.where).toHaveBeenCalledWith(
        'message.seller_id = :sellerId',
        { sellerId: 1 },
      );
    });

    it('should throw ForbiddenException if user has no seller profile', async () => {
      mockSellerRepo.findOne.mockResolvedValue(null);

      await expect(service.getMyConversationsAsSeller(10)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ── markAsRead ────────────────────────────────────────────────────────────────

  describe('markAsRead', () => {
    it('should allow the seller to mark a BUYER message as read', async () => {
      mockMessageRepo.findOne.mockResolvedValue({
        ...mockBuyerMessage, // sent_by: BUYER
        seller: { user_id: 99 },
      });
      mockMessageRepo.update.mockResolvedValue(undefined);

      const result = await service.markAsRead(1, 99); // seller reads buyer's message

      expect(mockMessageRepo.update).toHaveBeenCalledWith(1, { is_read: true });
      expect(result.message).toBe('Marked as read');
    });

    it('should allow the buyer to mark a SELLER message as read', async () => {
      mockMessageRepo.findOne.mockResolvedValue({
        ...mockSellerMessage, // sent_by: SELLER
        buyer_id: 10,
        seller: { user_id: 99 },
      });
      mockMessageRepo.update.mockResolvedValue(undefined);

      const result = await service.markAsRead(2, 10); // buyer reads seller's message

      expect(mockMessageRepo.update).toHaveBeenCalledWith(2, { is_read: true });
    });

    it('should throw ForbiddenException if seller tries to mark their own message as read', async () => {
      mockMessageRepo.findOne.mockResolvedValue({
        ...mockSellerMessage, // sent_by: SELLER
        seller: { user_id: 99 },
      });

      await expect(service.markAsRead(2, 99)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException if buyer tries to mark their own message as read', async () => {
      mockMessageRepo.findOne.mockResolvedValue({
        ...mockBuyerMessage, // sent_by: BUYER
        buyer_id: 10,
        seller: { user_id: 99 },
      });

      await expect(service.markAsRead(1, 10)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException if user is not part of the conversation', async () => {
      mockMessageRepo.findOne.mockResolvedValue({
        ...mockBuyerMessage,
        buyer_id: 10,
        seller: { user_id: 99 },
      });

      await expect(service.markAsRead(1, 55)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException if message does not exist', async () => {
      mockMessageRepo.findOne.mockResolvedValue(null);

      await expect(service.markAsRead(99, 10)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
