/* eslint-disable */
import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.entity';
import { Seller } from '../sellers/seller.entity';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  DeleteAccountDto,
} from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Seller)
    private sellersRepository: Repository<Seller>,
    private jwtService: JwtService,
  ) {}

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

    await this.usersRepository.save(user);

    if (dto.is_seller) {
      const seller = this.sellersRepository.create({ user_id: user.id });
      await this.sellersRepository.save(seller);
    }

    return this.signToken(user);
  }

  async login(dto: LoginDto) {
    const user = await this.usersRepository.findOne({
      where: { email: dto.email },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.signToken(user);
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersRepository.findOne({
      where: { email: dto.email },
    });

    if (user) {
      // Generate a short-lived reset token so the flow can be wired to email delivery.
      this.jwtService.sign(
        { sub: user.id, email: user.email, purpose: 'password_reset' },
        {
          expiresIn: parseInt(
            process.env.RESET_PASSWORD_EXPIRES_IN || '900',
            10,
          ),
        },
      );
    }

    // Keep response generic to avoid leaking whether an email exists.
    return {
      message:
        'If that email is registered, password reset instructions were sent.',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    let payload: { sub: number; email: string; purpose?: string };

    try {
      payload = this.jwtService.verify(dto.token, {
        secret: process.env.JWT_SECRET || 'secret',
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    if (payload.purpose !== 'password_reset') {
      throw new BadRequestException('Invalid reset token');
    }

    const user = await this.usersRepository.findOne({
      where: { id: payload.sub, email: payload.email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    user.passwordHash = await bcrypt.hash(dto.new_password, 10);
    await this.usersRepository.save(user);

    return { message: 'Password reset successfully' };
  }

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
      await this.usersRepository.query('DELETE FROM wishlist WHERE user_id = $1', [
        user.id,
      ]);

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

  private signToken(user: User) {
    const payload = { sub: user.id, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        is_seller: user.is_seller,
      },
    };
  }
}
