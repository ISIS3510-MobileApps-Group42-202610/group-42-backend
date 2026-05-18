/* eslint-disable */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Seller } from './seller.entity';
import { Listing } from '../listings/listing.entity';

@Injectable()
export class SellersService {
  constructor(
    @InjectRepository(Seller)
    private sellersRepository: Repository<Seller>,

    @InjectRepository(Listing)
    private listingsRepository: Repository<Listing>,
  ) {}

  async findAll() {
    return this.sellersRepository.find({ relations: ['user'] });
  }

  async findOne(id: number) {
    const seller = await this.sellersRepository.findOne({
      where: { id },
      relations: ['user', 'listings', 'listings.images'],
    });

    if (!seller) {
      throw new NotFoundException(`Seller #${id} not found`);
    }

    return seller;
  }

  async findByUser(userId: number) {
    const seller = await this.sellersRepository.findOne({
      where: { user_id: userId },
      relations: ['user', 'listings', 'listings.images'],
    });

    if (!seller) {
      throw new NotFoundException('Seller profile not found');
    }

    return seller;
  }

  async getPublicProfile(id: number) {
    const seller = await this.sellersRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!seller) {
      throw new NotFoundException(`Seller #${id} not found`);
    }

    const listings = await this.listingsRepository.find({
      where: { seller_id: id },
      relations: ['seller', 'seller.user', 'images', 'course'],
      order: { created_at: 'DESC' },
    });

    const activeProducts = listings.filter((listing) => listing.active);
    const soldProducts = listings.filter((listing) => !listing.active);

    return {
      seller_id: seller.id,
      seller_name: `${seller.user.name} ${seller.user.last_name}`.trim(),
      photo_url: seller.user.profile_pic ?? null,
      sold_products_count: soldProducts.length,
      active_products_count: activeProducts.length,
      active_products: activeProducts,
    };
  }
}