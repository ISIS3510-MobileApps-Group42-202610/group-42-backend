import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from '../../src/users/users.service';
import { User } from '../../src/users/user.entity';

const mockUser: Partial<User> = {
  id: 1,
  name: 'Juan',
  last_name: 'García',
  email: 'juan@uni.edu',
  is_seller: false,
  wishlist: [],
};

const mockUserRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  // ── findAll ─────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return an array of users', async () => {
      mockUserRepo.find.mockResolvedValue([mockUser]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(mockUserRepo.find).toHaveBeenCalledWith({ relations: ['seller'] });
    });
  });

  // ── findOne ─────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('should return a user by id', async () => {
      mockUserRepo.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne(1);

      expect(result.email).toBe('juan@uni.edu');
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  // ── wishlist ─────────────────────────────────────────────────────────────────

  describe('addToWishlist', () => {
    it('should add a listing to the wishlist', async () => {
      mockUserRepo.findOne.mockResolvedValue({ ...mockUser, wishlist: [] });
      mockUserRepo.save.mockResolvedValue(undefined);

      const result = await service.addToWishlist(1, 5);

      expect(mockUserRepo.save).toHaveBeenCalled();
      expect(result.message).toBe('Added to wishlist');
    });

    it('should not duplicate a listing already in wishlist', async () => {
      mockUserRepo.findOne.mockResolvedValue({
        ...mockUser,
        wishlist: [{ id: 5 }],
      });

      await service.addToWishlist(1, 5);

      expect(mockUserRepo.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(service.addToWishlist(99, 5)).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeFromWishlist', () => {
    it('should remove a listing from the wishlist', async () => {
      mockUserRepo.findOne.mockResolvedValue({
        ...mockUser,
        wishlist: [{ id: 5 }, { id: 6 }],
      });
      mockUserRepo.save.mockResolvedValue(undefined);

      await service.removeFromWishlist(1, 5);

      const savedUser = mockUserRepo.save.mock.calls[0][0];
      expect(savedUser.wishlist).toHaveLength(1);
      expect(savedUser.wishlist[0].id).toBe(6);
    });
  });

  // ── update ───────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('should update and return the user', async () => {
      mockUserRepo.findOne.mockResolvedValue(mockUser);
      mockUserRepo.update.mockResolvedValue(undefined);

      const result = await service.update(1, { name: 'Pedro' });

      expect(mockUserRepo.update).toHaveBeenCalledWith(1, { name: 'Pedro' });
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(service.update(99, { name: 'Pedro' })).rejects.toThrow(NotFoundException);
    });
  });

  // ── remove ───────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('should delete the user and return a message', async () => {
      mockUserRepo.findOne.mockResolvedValue(mockUser);
      mockUserRepo.remove.mockResolvedValue(undefined);

      const result = await service.remove(1);

      expect(mockUserRepo.remove).toHaveBeenCalledWith(mockUser);
      expect(result.message).toBe('User deleted');
    });
  });
});
