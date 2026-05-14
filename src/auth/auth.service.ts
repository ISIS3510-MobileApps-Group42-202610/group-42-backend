/* eslint-disable */
import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, MoreThan, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../users/user.entity';
import { Seller } from '../sellers/seller.entity';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  DeleteAccountDto,
  UpdateProfilePictureDto,
} from './auth.dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Seller)
    private sellersRepository: Repository<Seller>,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  // ── helpers ────────────────────────────────────────────────────────────────

  /** Generates a random 8-character alphanumeric code (uppercase). */
  private generateResetCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I to avoid confusion
    let code = '';
    const bytes = crypto.randomBytes(8);
    for (let i = 0; i < 8; i++) {
      code += chars[bytes[i] % chars.length];
    }
    return code;
  }

  // ── register ───────────────────────────────────────────────────────────────

  async register(dto: RegisterDto) {
    const existing = await this.usersRepository.findOne({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = this.usersRepository.create({
      name: dto.name,
      last_name: dto.last_name,
      email: dto.email,
      passwordHash,
      semester: dto.semester,
      profile_pic: dto.profile_pic,
      is_seller: dto.is_seller || false,
    });

    const savedUser = await this.usersRepository.save(user);

    if (dto.is_seller) {
      const seller = this.sellersRepository.create({ user_id: savedUser.id });
      await this.sellersRepository.save(seller);
    }

    return this.signToken(savedUser);
  }

  // ── login ──────────────────────────────────────────────────────────────────

  async login(dto: LoginDto) {
    const user = await this.usersRepository.findOne({
      where: { email: dto.email },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.signToken(user);
  }

  async me(userId: number) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['seller'],
    });
    if (!user) throw new UnauthorizedException();

    return {
      user: this.serializeUser(user, user.seller ?? null),
    };
  }

  // ── forgot password ────────────────────────────────────────────────────────

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersRepository.findOne({
      where: { email: dto.email },
    });

    if (user) {
      const code = this.generateResetCode();
      const expiresInSeconds = parseInt(
        process.env.RESET_PASSWORD_EXPIRES_IN || '900',
        10,
      );

      // Store hashed code + expiration on the user row
      user.resetCode = await bcrypt.hash(code, 10);
      user.resetCodeExpiresAt = new Date(Date.now() + expiresInSeconds * 1000);
      await this.usersRepository.save(user);

      // Send the plain-text code via email
      await this.emailService.sendPasswordReset(user.email, code);
    }

    // Generic response to avoid leaking whether the email exists
    return {
      message:
        'If that email is registered, password reset instructions were sent.',
    };
  }

  // ── reset password ─────────────────────────────────────────────────────────

  async resetPassword(dto: ResetPasswordDto) {
    // Only check users with a non-expired reset code
    const candidates = await this.usersRepository.find({
      where: {
        resetCodeExpiresAt: MoreThan(new Date()),
      },
    });

    let matchedUser: User | null = null;
    const normalizedToken = dto.token.toUpperCase().trim();

    for (const user of candidates) {
      if (!user.resetCode) continue;
      const valid = await bcrypt.compare(normalizedToken, user.resetCode);
      if (valid) {
        matchedUser = user;
        break;
      }
    }

    if (!matchedUser) {
      throw new UnauthorizedException('Invalid or expired reset code');
    }

    // Update password and clear the reset fields
    matchedUser.passwordHash = await bcrypt.hash(dto.new_password, 10);
    matchedUser.resetCode = null;
    matchedUser.resetCodeExpiresAt = null;
    await this.usersRepository.save(matchedUser);

    return { message: 'Password reset successfully' };
  }

  async updateProfilePicture(userId: number, dto: UpdateProfilePictureDto) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['seller'],
    });

    if (!user) throw new UnauthorizedException();

    user.profile_pic = dto.profile_pic;

    const savedUser = await this.usersRepository.save(user);

    return {
      user: this.serializeUser(savedUser, savedUser.seller ?? null),
    };
  }

  // ── delete account ─────────────────────────────────────────────────────────

  async deleteAccount(userId: number, dto: DeleteAccountDto) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    try {
      const seller = await this.sellersRepository.findOne({
        where: { user_id: user.id },
      });

      await this.usersRepository.query(
        'DELETE FROM following WHERE user_id = $1 OR following_user_id = $1',
        [user.id],
      );
      await this.usersRepository.query(
        'DELETE FROM wishlist WHERE user_id = $1',
        [user.id],
      );

      if (seller) {
        await this.sellersRepository.remove(seller);
      }

      await this.usersRepository.remove(user);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        throw new ConflictException(
          'Unable to delete account due to related records',
        );
      }
      throw error;
    }

    return { message: 'Account deleted successfully' };
  }

  // ── token ──────────────────────────────────────────────────────────────────

  private async signToken(user: User) {
    const seller =
      user.seller ??
      (await this.sellersRepository.findOne({
        where: { user_id: user.id },
      }));
    const payload = { sub: user.id, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
      user: this.serializeUser(user, seller ?? null),
    };
  }

  private serializeUser(user: User, seller: Seller | null) {
    return {
      id: user.id,
      name: user.name,
      last_name: user.last_name,
      email: user.email,
      semester: user.semester,
      profile_pic: user.profile_pic,
      is_seller: user.is_seller,
      seller: seller
        ? {
            id: seller.id,
            user_id: seller.user_id,
            total_sales: seller.total_sales,
            avg_rating: seller.avg_rating,
          }
        : null,
    };
  }
}
