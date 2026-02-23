/* eslint-disable */
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Listing } from './listing.entity';
import { ListingImage } from './listing-image.entity';
import { HistoricPrice } from './historic-price.entity';
import { Seller } from '../sellers/seller.entity';
import { CreateListingDto, UpdateListingDto, AddImageDto } from './listing.dto';

@Injectable()
export class ListingsService {
  constructor(
    @InjectRepository(Listing)
    private listingsRepository: Repository<Listing>,
    @InjectRepository(ListingImage)
    private imagesRepository: Repository<ListingImage>,
    @InjectRepository(HistoricPrice)
    private pricesRepository: Repository<HistoricPrice>,
    @InjectRepository(Seller)
    private sellersRepository: Repository<Seller>,
  ) {}

  async findAll(category?: string, condition?: string) {
    const where: any = { active: true };
    if (category) where.category = category;
    if (condition) where.condition = condition;

    return this.listingsRepository.find({
      where,
      relations: ['seller', 'seller.user', 'images', 'course'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: number) {
    const listing = await this.listingsRepository.findOne({
      where: { id },
      relations: ['seller', 'seller.user', 'images', 'course', 'priceHistory'],
    });
    if (!listing) throw new NotFoundException(`Listing #${id} not found`);
    return listing;
  }

  async create(userId: number, dto: CreateListingDto) {
    const seller = await this.sellersRepository.findOne({
      where: { user_id: userId },
    });
    if (!seller) throw new ForbiddenException('User is not a seller');

    const listing = this.listingsRepository.create({
      ...dto,
      seller_id: seller.id,
    });

    await this.listingsRepository.save(listing);

    // Record initial price in history
    await this.pricesRepository.save({
      listing_id: listing.id,
      start_date: new Date(),
    });

    return listing;
  }

  async update(id: number, userId: number, dto: UpdateListingDto) {
    const listing = await this.findOne(id);
    const seller = await this.sellersRepository.findOne({
      where: { user_id: userId },
    });

    if (!seller || listing.seller_id !== seller.id) {
      throw new ForbiddenException('Not your listing');
    }

    // If price changed, close old price record and open a new one
    if (dto.selling_price && dto.selling_price !== listing.selling_price) {
      await this.pricesRepository.update(
        { listing_id: id, final_date: null as any },
        { final_date: new Date() },
      );
      await this.pricesRepository.save({
        listing_id: id,
        start_date: new Date(),
      });
    }

    await this.listingsRepository.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number, userId: number) {
    const listing = await this.findOne(id);
    const seller = await this.sellersRepository.findOne({
      where: { user_id: userId },
    });

    if (!seller || listing.seller_id !== seller.id) {
      throw new ForbiddenException('Not your listing');
    }

    await this.listingsRepository.remove(listing);
    return { message: 'Listing deleted' };
  }

  async addImage(listingId: number, userId: number, dto: AddImageDto) {
    const listing = await this.findOne(listingId);
    const seller = await this.sellersRepository.findOne({
      where: { user_id: userId },
    });

    if (!seller || listing.seller_id !== seller.id) {
      throw new ForbiddenException('Not your listing');
    }

    if (dto.is_primary) {
      await this.imagesRepository.update(
        { listing_id: listingId },
        { is_primary: false },
      );
    }

    const image = this.imagesRepository.create({
      ...dto,
      listing_id: listingId,
    });
    return this.imagesRepository.save(image);
  }

  async removeImage(imageId: number, userId: number) {
    const image = await this.imagesRepository.findOne({
      where: { id: imageId },
      relations: ['listing'],
    });
    if (!image) throw new NotFoundException(`Image #${imageId} not found`);

    const seller = await this.sellersRepository.findOne({
      where: { user_id: userId },
    });
    if (!seller || image.listing.seller_id !== seller.id) {
      throw new ForbiddenException('Not your listing');
    }

    await this.imagesRepository.remove(image);
    return { message: 'Image removed' };
  }

  async getPriceHistory(listingId: number) {
    return this.pricesRepository.find({ where: { listing_id: listingId } });
  }
}
