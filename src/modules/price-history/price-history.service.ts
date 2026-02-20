import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PriceHistory } from './entities/price-history.entity';
import { CreatePriceHistoryDto, UpdatePriceHistoryDto } from './dtos/price-history.dto';
import { Listing } from '../listings/entities/listing.entity';

@Injectable()
export class PriceHistoryService {
  constructor(
    @InjectRepository(PriceHistory)
    private readonly priceHistoryRepository: Repository<PriceHistory>,
    @InjectRepository(Listing)
    private readonly listingRepository: Repository<Listing>,
  ) {}

  async createPriceHistory(createPriceHistoryDto: CreatePriceHistoryDto): Promise<PriceHistory> {
    const { listingId } = createPriceHistoryDto;

    const listing = await this.listingRepository.findOne({ where: { id: listingId } });
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    const priceHistory = this.priceHistoryRepository.create(createPriceHistoryDto);
    return this.priceHistoryRepository.save(priceHistory);
  }

  async getPriceHistoryById(id: string): Promise<PriceHistory> {
    const priceHistory = await this.priceHistoryRepository.findOne({
      where: { id },
      relations: ['listing'],
    });
    if (!priceHistory) {
      throw new NotFoundException(`Price history with ID ${id} not found`);
    }
    return priceHistory;
  }

  async getPriceHistoryByListing(
    listingId: string,
    skip: number = 0,
    take: number = 10,
  ): Promise<[PriceHistory[], number]> {
    return this.priceHistoryRepository.findAndCount({
      where: { listingId },
      skip,
      take,
      order: { calculatedAt: 'DESC' },
    });
  }

  async getPriceHistoryBySemester(
    listingId: string,
    semester: string,
  ): Promise<PriceHistory | null> {
    return this.priceHistoryRepository.findOne({
      where: { listingId, semester },
    });
  }

  async getAllPriceHistories(skip: number = 0, take: number = 10): Promise<[PriceHistory[], number]> {
    return this.priceHistoryRepository.findAndCount({
      relations: ['listing'],
      skip,
      take,
      order: { calculatedAt: 'DESC' },
    });
  }

  async updatePriceHistory(
    id: string,
    updatePriceHistoryDto: UpdatePriceHistoryDto,
  ): Promise<PriceHistory> {
    const priceHistory = await this.getPriceHistoryById(id);
    Object.assign(priceHistory, updatePriceHistoryDto);
    return this.priceHistoryRepository.save(priceHistory);
  }

  async deletePriceHistory(id: string): Promise<void> {
    const result = await this.priceHistoryRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Price history with ID ${id} not found`);
    }
  }

  async getHighDemandListings(
    minDemandScore: number = 7,
    skip: number = 0,
    take: number = 10,
  ): Promise<[PriceHistory[], number]> {
    return this.priceHistoryRepository
      .createQueryBuilder('priceHistory')
      .where('priceHistory.demandScore >= :minDemandScore', { minDemandScore })
      .leftJoinAndSelect('priceHistory.listing', 'listing')
      .skip(skip)
      .take(take)
      .orderBy('priceHistory.demandScore', 'DESC')
      .getManyAndCount();
  }

  async getPriceStatisticsByCategory(category: string): Promise<any> {
    return this.priceHistoryRepository
      .createQueryBuilder('priceHistory')
      .leftJoinAndSelect('priceHistory.listing', 'listing')
      .where('listing.category = :category', { category })
      .select('AVG(priceHistory.averageSoldPrice)', 'avgPrice')
      .addSelect('MIN(priceHistory.averageSoldPrice)', 'minPrice')
      .addSelect('MAX(priceHistory.averageSoldPrice)', 'maxPrice')
      .addSelect('COUNT(priceHistory.id)', 'count')
      .getRawOne();
  }
}
