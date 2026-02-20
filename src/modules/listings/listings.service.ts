import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Listing } from './entities/listing.entity';
import { ListingImage } from './entities/listing-image.entity';
import { CreateListingDto, UpdateListingDto, CreateListingImageDto } from './dtos/listing.dto';
import { ListingStatus } from '../../common/enums';
import { UsersService } from '../users/users.service';
import { CoursesService } from '../courses/courses.service';

@Injectable()
export class ListingsService {
  constructor(
    @InjectRepository(Listing)
    private readonly listingRepository: Repository<Listing>,
    @InjectRepository(ListingImage)
    private readonly listingImageRepository: Repository<ListingImage>,
    private readonly usersService: UsersService,
    private readonly coursesService: CoursesService,
  ) {}

  async createListing(sellerId: string, createListingDto: CreateListingDto): Promise<Listing> {
    // Verify seller exists
    await this.usersService.getSellerById(sellerId);

    const listing = this.listingRepository.create({
      ...createListingDto,
      sellerId,
      status: ListingStatus.AVAILABLE,
    });

    const savedListing = await this.listingRepository.save(listing);

    // Add courses if provided
    if (createListingDto.courseIds && createListingDto.courseIds.length > 0) {
      const courses = await this.coursesService.getCoursesByIds(createListingDto.courseIds);
      savedListing.courses = courses;
      await this.listingRepository.save(savedListing);
    }

    return savedListing;
  }

  async getListingById(id: string): Promise<Listing> {
    const listing = await this.listingRepository.findOne({
      where: { id },
      relations: ['seller', 'images', 'courses'],
    });

    if (!listing) {
      throw new NotFoundException(`Listing with ID ${id} not found`);
    }

    return listing;
  }

  async getAllListings(skip: number = 0, take: number = 10): Promise<[Listing[], number]> {
    return this.listingRepository.findAndCount({
      where: { status: ListingStatus.AVAILABLE },
      relations: ['seller', 'images'],
      skip,
      take,
      order: { createdAt: 'DESC' },
    });
  }

  async getListingsBySeller(
    sellerId: string,
    skip: number = 0,
    take: number = 10,
  ): Promise<[Listing[], number]> {
    return this.listingRepository.findAndCount({
      where: { sellerId },
      relations: ['images', 'courses'],
      skip,
      take,
      order: { createdAt: 'DESC' },
    });
  }

  async updateListing(
    id: string,
    sellerId: string,
    updateListingDto: UpdateListingDto,
  ): Promise<Listing> {
    const listing = await this.getListingById(id);

    if (listing.sellerId !== sellerId) {
      throw new ForbiddenException('You can only update your own listings');
    }

    Object.assign(listing, updateListingDto);
    return this.listingRepository.save(listing);
  }

  async deleteListing(id: string, sellerId: string): Promise<void> {
    const listing = await this.getListingById(id);

    if (listing.sellerId !== sellerId) {
      throw new ForbiddenException('You can only delete your own listings');
    }

    await this.listingRepository.remove(listing);
  }

  async addImageToListing(listingId: string, createImageDto: CreateListingImageDto): Promise<ListingImage> {
    const listing = await this.getListingById(listingId);

    // If this is primary, unset other primary images
    if (createImageDto.isIsPrimary) {
      await this.listingImageRepository.update(
        { listingId },
        { isPrimary: false },
      );
    }

    const image = this.listingImageRepository.create({
      ...createImageDto,
      listingId,
    });

    return this.listingImageRepository.save(image);
  }

  async removeImageFromListing(listingId: string, imageId: string): Promise<void> {
    const image = await this.listingImageRepository.findOne({
      where: { id: imageId, listingId },
    });

    if (!image) {
      throw new NotFoundException('Image not found');
    }

    await this.listingImageRepository.remove(image);
  }

  async getListingImages(listingId: string): Promise<ListingImage[]> {
    await this.getListingById(listingId);
    return this.listingImageRepository.find({
      where: { listingId },
      order: { uploadedAt: 'DESC' },
    });
  }

  async searchListings(
    category?: string,
    minPrice?: number,
    maxPrice?: number,
    skip: number = 0,
    take: number = 10,
  ): Promise<[Listing[], number]> {
    let query = this.listingRepository
      .createQueryBuilder('listing')
      .where('listing.status = :status', { status: ListingStatus.AVAILABLE });

    if (category) {
      query = query.andWhere('listing.category = :category', { category });
    }

    if (minPrice !== undefined) {
      query = query.andWhere('listing.sellingPrice >= :minPrice', { minPrice });
    }

    if (maxPrice !== undefined) {
      query = query.andWhere('listing.sellingPrice <= :maxPrice', { maxPrice });
    }

    return query
      .leftJoinAndSelect('listing.seller', 'seller')
      .leftJoinAndSelect('listing.images', 'images')
      .skip(skip)
      .take(take)
      .orderBy('listing.createdAt', 'DESC')
      .getManyAndCount();
  }
}
