/* eslint-disable */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Seller } from '../sellers/seller.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Seller)
    private sellersRepository: Repository<Seller>,
  ) {}

  async findAll() {
    return this.usersRepository.find({ relations: ['seller'] });
  }

  async findOne(id: number) {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['seller', 'wishlist'],
    });
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return user;
  }

  async getWishlist(userId: number) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: [
        'wishlist',
        'wishlist.images',
        'wishlist.seller',
        'wishlist.seller.user',
      ],
    });
    if (!user) throw new NotFoundException(`User #${userId} not found`);
    return user.wishlist;
  }

  async getFollowing(userId: number) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['following', 'following.seller'],
    });
    if (!user) throw new NotFoundException(`User ${userId} not found`);
    return user.following;
  }


  async addToWishlist(userId: number, listingId: number) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['wishlist'],
    });
    if (!user) throw new NotFoundException(`User #${userId} not found`);

    const alreadyIn = user.wishlist.some((l) => l.id === listingId);
    if (!alreadyIn) {
      user.wishlist.push({ id: listingId } as any);
      await this.usersRepository.save(user);
    }
    return { message: 'Added to wishlist' };
  }

  async followUser(userId: number, followingUserId: number) {
    if (userId === followingUserId) {
      throw new NotFoundException(`Cannot follow yourself`);
    }
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['following'],
    });
    if (!user) throw new NotFoundException(`User #${userId} not found`);

    const alreadyFollowing = user.following.some((u) => u.id === followingUserId);
    if (!alreadyFollowing) {
      user.following.push({ id: followingUserId } as any);
      await this.usersRepository.save(user);
    }
    return { message: 'User followed' };
  }
  
  async removeFromWishlist(userId: number, listingId: number) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['wishlist'],
    });
    if (!user) throw new NotFoundException(`User #${userId} not found`);

    user.wishlist = user.wishlist.filter((l) => l.id !== listingId);
    await this.usersRepository.save(user);
    return { message: 'Removed from wishlist' };
  }

  async getPurchaseHistory(userId: number) {
    return this.usersRepository.findOne({
      where: { id: userId },
      relations: [
        'purchases',
        'purchases.listing',
        'purchases.seller',
        'purchases.seller.user',
      ],
    });
  }

  async update(id: number, dto: Partial<User>) {
    const user = await this.findOne(id);

    if (dto.is_seller === true && !user.seller) {
      const existingSeller = await this.sellersRepository.findOne({
        where: { user_id: id },
      });

      if (!existingSeller) {
        await this.sellersRepository.save(
          this.sellersRepository.create({ user_id: id }),
        );
      }
    }

    await this.usersRepository.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number) {
    try {
      const user = await this.usersRepository.findOne({
        where: { id },
        relations: ['seller'],
      });

      if (!user) throw new NotFoundException(`User #${id} not found`);

      await this.usersRepository.manager.transaction(async (manager) => {

        await manager.query(`DELETE FROM wishlist WHERE user_id = $1`, [id]);

        await manager.query(`DELETE FROM following WHERE user_id = $1 OR following_user_id = $1`, [id]);

        await manager.delete('transactions', { buyer_id: id });

        if (user.seller) {
          await manager.delete('transactions', { seller_id: user.seller.id });

          await manager.delete('listings', { seller_id: user.seller.id });

          await manager.delete('sellers', { id: user.seller.id });
        }

        await manager.delete(User, id);
      });

      return { message: 'User deleted permanently' };
  }
    catch (error) {
      throw new NotFoundException(`User #${id} not found`);
    }
  }
}
