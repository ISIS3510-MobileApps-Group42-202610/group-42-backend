import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { QueryFailedError } from 'typeorm';
import { AuthService } from '../../src/auth/auth.service';
import { User } from '../../src/users/user.entity';
import { Seller } from '../../src/sellers/seller.entity';
import { EmailService } from '../../src/email/email.service';

// Mock bcrypt so tests don't do real hashing (slow)
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as unknown as {
  hash: jest.Mock;
  compare: jest.Mock;
};
const bcryptHash = mockedBcrypt.hash;
const bcryptCompare = mockedBcrypt.compare;

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
  query: jest.fn(),
  remove: jest.fn(),
};

const mockSellerRepo = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock.jwt.token'),
  verify: jest.fn(),
};

const mockEmailService = {
  sendPasswordReset: jest.fn().mockResolvedValue(undefined),
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
        { provide: EmailService, useValue: mockEmailService },
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
      mockUserRepo.save.mockResolvedValue({
        ...mockUser,
        id: 1,
        is_seller: true,
      });
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

  // ── forgotPassword ─────────────────────────────────────────────────────────

  describe('forgotPassword', () => {
    it('should return a generic message and send email when user exists', async () => {
      mockUserRepo.findOne.mockResolvedValue(mockUser);

      const result = await service.forgotPassword({ email: 'juan@uni.edu' });

      expect(result).toEqual({
        message:
          'If that email is registered, password reset instructions were sent.',
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: mockUser.id,
          email: mockUser.email,
          purpose: 'password_reset',
        }),
        expect.any(Object),
      );
      expect(mockEmailService.sendPasswordReset).toHaveBeenCalledWith(
        'juan@uni.edu',
        'mock.jwt.token',
      );
    });

    it('should return a generic message and not send email when user does not exist', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      const result = await service.forgotPassword({
        email: 'missing@uni.edu',
      });

      expect(result).toEqual({
        message:
          'If that email is registered, password reset instructions were sent.',
      });
      expect(mockJwtService.sign).not.toHaveBeenCalled();
      expect(mockEmailService.sendPasswordReset).not.toHaveBeenCalled();
    });
  });

  // ── resetPassword ──────────────────────────────────────────────────────────

  describe('resetPassword', () => {
    const dto = { token: 'valid-token', new_password: 'newpass123' };

    it('should update password when token is valid', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 1,
        email: 'juan@uni.edu',
        purpose: 'password_reset',
      });
      mockUserRepo.findOne.mockResolvedValue({ ...mockUser });
      bcryptHash.mockResolvedValue('new_hash');

      const result = await service.resetPassword(dto);

      expect(result).toEqual({ message: 'Password reset successfully' });
      expect(bcryptHash).toHaveBeenCalledWith('newpass123', 10);
      expect(mockUserRepo.save).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('invalid');
      });

      await expect(service.resetPassword(dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw BadRequestException for wrong token purpose', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 1,
        email: 'juan@uni.edu',
        purpose: 'login',
      });

      await expect(service.resetPassword(dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ── deleteAccount ──────────────────────────────────────────────────────────

  describe('deleteAccount', () => {
    const dto = { password: 'secret123' };

    it('should delete account when password is valid', async () => {
      mockUserRepo.findOne.mockResolvedValue({ ...mockUser });
      bcryptCompare.mockResolvedValue(true);
      mockSellerRepo.findOne.mockResolvedValue({ id: 2, user_id: 1 });

      const result = await service.deleteAccount(1, dto);

      expect(mockUserRepo.query).toHaveBeenCalledTimes(2);
      expect(mockSellerRepo.remove).toHaveBeenCalled();
      expect(mockUserRepo.remove).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Account deleted successfully' });
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      mockUserRepo.findOne.mockResolvedValue({ ...mockUser });
      bcryptCompare.mockResolvedValue(false);

      await expect(service.deleteAccount(1, dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw ConflictException on query failed errors', async () => {
      mockUserRepo.findOne.mockResolvedValue({ ...mockUser });
      bcryptCompare.mockResolvedValue(true);
      mockSellerRepo.findOne.mockResolvedValue(null);
      mockUserRepo.remove.mockRejectedValue(
        new QueryFailedError(
          'DELETE FROM users',
          [],
          new Error('fk_violation'),
        ),
      );

      await expect(service.deleteAccount(1, dto)).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
