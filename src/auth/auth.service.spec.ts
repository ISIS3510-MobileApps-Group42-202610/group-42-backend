import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../../src/auth/auth.service';
import { User } from '../../src/users/user.entity';
import { Seller } from '../../src/sellers/seller.entity';

// Mock bcrypt so tests don't do real hashing (slow)
jest.mock('bcrypt');
const bcryptHash = bcrypt.hash as jest.Mock;
const bcryptCompare = bcrypt.compare as jest.Mock;

const mockUser: Partial<User> = {
  id: 1,
  name: 'Juan',
  last_name: 'García',
  email: 'juan@uni.edu',
  passwordHash: 'hashed_password',
  is_seller: false,
};

const mockUserRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const mockSellerRepo = {
  create: jest.fn(),
  save: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock.jwt.token'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: getRepositoryToken(Seller), useValue: mockSellerRepo },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  // ── register ────────────────────────────────────────────────────────────────

  describe('register', () => {
    const dto = {
      name: 'Juan',
      last_name: 'García',
      email: 'juan@uni.edu',
      password: 'secret123',
      is_seller: false,
    };

    it('should hash the password and return a token', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      bcryptHash.mockResolvedValue('hashed_password');
      mockUserRepo.create.mockReturnValue({ ...mockUser });
      mockUserRepo.save.mockResolvedValue({ ...mockUser });

      const result = await service.register(dto);

      expect(bcryptHash).toHaveBeenCalledWith('secret123', 10);
      expect(mockUserRepo.save).toHaveBeenCalled();
      expect(result.access_token).toBe('mock.jwt.token');
    });

    it('should throw ConflictException if email already exists', async () => {
      mockUserRepo.findOne.mockResolvedValue(mockUser);

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });

    it('should create a Seller record when is_seller is true', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      bcryptHash.mockResolvedValue('hashed_password');
      mockUserRepo.create.mockReturnValue({ ...mockUser, is_seller: true });
      mockUserRepo.save.mockResolvedValue({ ...mockUser, id: 1, is_seller: true });
      mockSellerRepo.create.mockReturnValue({ user_id: 1 });
      mockSellerRepo.save.mockResolvedValue({ id: 1, user_id: 1 });

      await service.register({ ...dto, is_seller: true });

      expect(mockSellerRepo.save).toHaveBeenCalled();
    });

    it('should NOT create a Seller record when is_seller is false', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      bcryptHash.mockResolvedValue('hashed_password');
      mockUserRepo.create.mockReturnValue({ ...mockUser });
      mockUserRepo.save.mockResolvedValue({ ...mockUser });

      await service.register(dto);

      expect(mockSellerRepo.save).not.toHaveBeenCalled();
    });
  });

  // ── login ───────────────────────────────────────────────────────────────────

  describe('login', () => {
    const dto = { email: 'juan@uni.edu', password: 'secret123' };

    it('should return a token on valid credentials', async () => {
      mockUserRepo.findOne.mockResolvedValue(mockUser);
      bcryptCompare.mockResolvedValue(true);

      const result = await service.login(dto);

      expect(result.access_token).toBe('mock.jwt.token');
      expect(result.user.email).toBe('juan@uni.edu');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is wrong', async () => {
      mockUserRepo.findOne.mockResolvedValue(mockUser);
      bcryptCompare.mockResolvedValue(false);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });
  });
});
