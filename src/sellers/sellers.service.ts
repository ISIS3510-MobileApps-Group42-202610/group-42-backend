import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Seller } from './seller.entity';

@Injectable()
export class SellersService {
  constructor(
    @InjectRepository(Seller)
    private sellersRepository: Repository<Seller>,
  ) {}

  async findAll() {
    return this.sellersRepository.find({ relations: ['user'] });
  }

  async findOne(id: number) {
    const seller = await this.sellersRepository.findOne({
      where: { id },
      relations: ['user', 'listings', 'listings.images'],
    });
    if (!seller) throw new NotFoundException(`Seller #${id} not found`);
    return seller;
  }

  async findByUser(userId: number) {
    const seller = await this.sellersRepository.findOne({
      where: { user_id: userId },
      relations: ['listings', 'listings.images'],
    });
    if (!seller) throw new NotFoundException('Seller profile not found');
    return seller;
  }
}
