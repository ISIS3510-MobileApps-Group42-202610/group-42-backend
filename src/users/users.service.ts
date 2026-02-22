/* eslint-disable */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
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
    await this.findOne(id);
    await this.usersRepository.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number) {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
    return { message: 'User deleted' };
  }
}
