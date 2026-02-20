import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ListingsService } from './listings.service';
import {
  CreateListingDto,
  UpdateListingDto,
  CreateListingImageDto,
  ListingResponseDto,
  ListingDetailResponseDto,
  ListingImageResponseDto,
} from './dtos/listing.dto';

@Controller('api/listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  // Listing endpoints
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createListing(
    @Query('sellerId') sellerId: string,
    @Body() createListingDto: CreateListingDto,
  ): Promise<ListingResponseDto> {
    const listing = await this.listingsService.createListing(sellerId, createListingDto);
    return this.mapListingToDto(listing);
  }

  @Get()
  async getAllListings(
    @Query('skip') skip: number = 0,
    @Query('take') take: number = 10,
  ): Promise<{ data: ListingResponseDto[]; total: number }> {
    const [listings, total] = await this.listingsService.getAllListings(skip, take);
    return {
      data: listings.map((listing) => this.mapListingToDto(listing)),
      total,
    };
  }

  @Get('search')
  async searchListings(
    @Query('category') category?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('skip') skip: number = 0,
    @Query('take') take: number = 10,
  ): Promise<{ data: ListingResponseDto[]; total: number }> {
    const [listings, total] = await this.listingsService.searchListings(
      category,
      minPrice,
      maxPrice,
      skip,
      take,
    );
    return {
      data: listings.map((listing) => this.mapListingToDto(listing)),
      total,
    };
  }

  @Get(':id')
  async getListingById(@Param('id') id: string): Promise<ListingDetailResponseDto> {
    const listing = await this.listingsService.getListingById(id);
    return this.mapListingToDetailDto(listing);
  }

  @Patch(':id')
  async updateListing(
    @Param('id') id: string,
    @Query('sellerId') sellerId: string,
    @Body() updateListingDto: UpdateListingDto,
  ): Promise<ListingResponseDto> {
    const listing = await this.listingsService.updateListing(id, sellerId, updateListingDto);
    return this.mapListingToDto(listing);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteListing(
    @Param('id') id: string,
    @Query('sellerId') sellerId: string,
  ): Promise<void> {
    await this.listingsService.deleteListing(id, sellerId);
  }

  @Get('seller/:sellerId')
  async getListingsBySeller(
    @Param('sellerId') sellerId: string,
    @Query('skip') skip: number = 0,
    @Query('take') take: number = 10,
  ): Promise<{ data: ListingResponseDto[]; total: number }> {
    const [listings, total] = await this.listingsService.getListingsBySeller(sellerId, skip, take);
    return {
      data: listings.map((listing) => this.mapListingToDto(listing)),
      total,
    };
  }

  // Listing Image endpoints
  @Post(':id/images')
  @HttpCode(HttpStatus.CREATED)
  async addImageToListing(
    @Param('id') id: string,
    @Body() createImageDto: CreateListingImageDto,
  ): Promise<ListingImageResponseDto> {
    const image = await this.listingsService.addImageToListing(id, createImageDto);
    return this.mapImageToDto(image);
  }

  @Get(':id/images')
  async getListingImages(@Param('id') id: string): Promise<ListingImageResponseDto[]> {
    const images = await this.listingsService.getListingImages(id);
    return images.map((image) => this.mapImageToDto(image));
  }

  @Delete(':id/images/:imageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeImageFromListing(
    @Param('id') id: string,
    @Param('imageId') imageId: string,
  ): Promise<void> {
    await this.listingsService.removeImageFromListing(id, imageId);
  }

  // Helper methods
  private mapListingToDto(listing: any): ListingResponseDto {
    return {
      id: listing.id,
      title: listing.title,
      description: listing.description,
      category: listing.category,
      condition: listing.condition,
      originalPrice: listing.originalPrice,
      suggestedPrice: listing.suggestedPrice,
      sellingPrice: listing.sellingPrice,
      status: listing.status,
      createdAt: listing.createdAt,
      updatedAt: listing.updatedAt,
      sellerId: listing.sellerId,
      images: listing.images?.map((img) => this.mapImageToDto(img)),
    };
  }

  private mapListingToDetailDto(listing: any): ListingDetailResponseDto {
    return {
      ...this.mapListingToDto(listing),
      sellerInfo: listing.seller
        ? {
            id: listing.seller.id,
            fullName: listing.seller.fullName,
            averageSellerRating: listing.seller.averageSellerRating,
            isTrustedSeller: listing.seller.isTrustedSeller,
          }
        : undefined,
      courses: listing.courses?.map((course) => ({
        id: course.id,
        courseCode: course.courseCode,
        courseName: course.courseName,
      })),
    };
  }

  private mapImageToDto(image: any): ListingImageResponseDto {
    return {
      id: image.id,
      imageUrl: image.imageUrl,
      isPrimary: image.isPrimary,
      uploadedAt: image.uploadedAt,
      listingId: image.listingId,
    };
  }
}
