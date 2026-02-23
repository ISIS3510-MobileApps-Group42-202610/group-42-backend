import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { MessagesService } from '../../src/messages/messages.service';
import { Message } from '../../src/messages/message.entity';
import { Seller } from '../../src/sellers/seller.entity';

const mockSeller: Partial<Seller> = { id: 1, user_id: 99 };

const mockMessage: Partial<Message> = {
  id: 1,
  buyer_id: 10,
  seller_id: 1,
  content: 'Is this still available?',
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

  // ── sendMessage ───────────────────────────────────────────────────────────────

  describe('sendMessage', () => {
    it('should create and save a message', async () => {
      mockSellerRepo.findOne.mockResolvedValue(mockSeller);
      mockMessageRepo.create.mockReturnValue(mockMessage);
      mockMessageRepo.save.mockResolvedValue({ ...mockMessage, id: 1 });

      const result = await service.sendMessage(10, 1, 'Is this still available?');

      expect(mockMessageRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if seller does not exist', async () => {
      mockSellerRepo.findOne.mockResolvedValue(null);

      await expect(service.sendMessage(10, 99, 'Hello')).rejects.toThrow(NotFoundException);
    });
  });

  // ── getConversation ───────────────────────────────────────────────────────────

  describe('getConversation', () => {
    it('should return messages between buyer and seller', async () => {
      mockMessageRepo.find.mockResolvedValue([mockMessage]);

      const result = await service.getConversation(10, 1);

      expect(result).toHaveLength(1);
      expect(mockMessageRepo.find).toHaveBeenCalled();
    });
  });

  // ── getMyConversations ────────────────────────────────────────────────────────

  describe('getMyConversations', () => {
    it('should return all conversations for a user', async () => {
      mockQB.getMany.mockResolvedValue([mockMessage]);

      const result = await service.getMyConversations(10);

      expect(result).toHaveLength(1);
      expect(mockQB.where).toHaveBeenCalledWith(
        'message.buyer_id = :userId',
        { userId: 10 },
      );
    });
  });

  // ── markAsRead ────────────────────────────────────────────────────────────────

  describe('markAsRead', () => {
    it('should mark a message as read if user is the seller', async () => {
      mockMessageRepo.findOne.mockResolvedValue({
        ...mockMessage,
        seller: { user_id: 99 },
      });
      mockMessageRepo.update.mockResolvedValue(undefined);

      const result = await service.markAsRead(1, 99); // 99 is the seller's user_id

      expect(mockMessageRepo.update).toHaveBeenCalledWith(1, { is_read: true });
      expect(result.message).toBe('Marked as read');
    });

    it('should throw NotFoundException if message does not exist', async () => {
      mockMessageRepo.findOne.mockResolvedValue(null);

      await expect(service.markAsRead(99, 10)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not the seller', async () => {
      mockMessageRepo.findOne.mockResolvedValue({
        ...mockMessage,
        seller: { user_id: 99 },
      });

      await expect(service.markAsRead(1, 10)).rejects.toThrow(ForbiddenException); // 10 is the buyer
    });
  });
});
