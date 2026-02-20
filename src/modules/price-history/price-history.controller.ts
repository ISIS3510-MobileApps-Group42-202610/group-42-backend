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
import { PriceHistoryService } from './price-history.service';
import {
  CreatePriceHistoryDto,
  UpdatePriceHistoryDto,
  PriceHistoryResponseDto,
} from './dtos/price-history.dto';

@Controller('api/price-history')
export class PriceHistoryController {
  constructor(private readonly priceHistoryService: PriceHistoryService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createPriceHistory(
    @Body() createPriceHistoryDto: CreatePriceHistoryDto,
  ): Promise<PriceHistoryResponseDto> {
    const priceHistory = await this.priceHistoryService.createPriceHistory(createPriceHistoryDto);
    return this.mapPriceHistoryToDto(priceHistory);
  }

  @Get(':id')
  async getPriceHistoryById(@Param('id') id: string): Promise<PriceHistoryResponseDto> {
    const priceHistory = await this.priceHistoryService.getPriceHistoryById(id);
    return this.mapPriceHistoryToDto(priceHistory);
  }

  @Get()
  async getAllPriceHistories(
    @Query('skip') skip: number = 0,
    @Query('take') take: number = 10,
  ): Promise<{ data: PriceHistoryResponseDto[]; total: number }> {
    const [priceHistories, total] = await this.priceHistoryService.getAllPriceHistories(skip, take);
    return {
      data: priceHistories.map((ph) => this.mapPriceHistoryToDto(ph)),
      total,
    };
  }

  @Get('listing/:listingId')
  async getPriceHistoryByListing(
    @Param('listingId') listingId: string,
    @Query('skip') skip: number = 0,
    @Query('take') take: number = 10,
  ): Promise<{ data: PriceHistoryResponseDto[]; total: number }> {
    const [priceHistories, total] = await this.priceHistoryService.getPriceHistoryByListing(
      listingId,
      skip,
      take,
    );
    return {
      data: priceHistories.map((ph) => this.mapPriceHistoryToDto(ph)),
      total,
    };
  }

  @Get('high-demand')
  async getHighDemandListings(
    @Query('minDemandScore') minDemandScore: number = 7,
    @Query('skip') skip: number = 0,
    @Query('take') take: number = 10,
  ): Promise<{ data: PriceHistoryResponseDto[]; total: number }> {
    const [priceHistories, total] = await this.priceHistoryService.getHighDemandListings(
      minDemandScore,
      skip,
      take,
    );
    return {
      data: priceHistories.map((ph) => this.mapPriceHistoryToDto(ph)),
      total,
    };
  }

  @Get('statistics/:category')
  async getPriceStatisticsByCategory(
    @Param('category') category: string,
  ): Promise<any> {
    return this.priceHistoryService.getPriceStatisticsByCategory(category);
  }

  @Patch(':id')
  async updatePriceHistory(
    @Param('id') id: string,
    @Body() updatePriceHistoryDto: UpdatePriceHistoryDto,
  ): Promise<PriceHistoryResponseDto> {
    const priceHistory = await this.priceHistoryService.updatePriceHistory(id, updatePriceHistoryDto);
    return this.mapPriceHistoryToDto(priceHistory);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePriceHistory(@Param('id') id: string): Promise<void> {
    await this.priceHistoryService.deletePriceHistory(id);
  }

  private mapPriceHistoryToDto(priceHistory: any): PriceHistoryResponseDto {
    return {
      id: priceHistory.id,
      averageSoldPrice: priceHistory.averageSoldPrice,
      demandScore: priceHistory.demandScore,
      semester: priceHistory.semester,
      listingId: priceHistory.listingId,
      calculatedAt: priceHistory.calculatedAt,
    };
  }
}
