/* eslint-disable */
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Listing } from './listing.entity';
import { ListingImage } from './listing-image.entity';
import { HistoricPrice } from './historic-price.entity';
import { Seller } from '../sellers/seller.entity';
import { User } from '../users/user.entity';
import { AcademicCalendarPhase } from './academic-calendar-phase.entity';
import { ACADEMIC_CALENDAR_PHASES_SEED } from './academic-calendar.seed';
import {
  GetSeasonalDemandQueryDto,
  SeasonalDemandGrain,
  SeasonalDemandResponseDto,
} from './seasonal-demand.dto';
import {
  CreateListingDto,
  UpdateListingDto,
  AddImageDto,
  CreateListingImageDto,
  UpdateListingImageDto,
} from './listing.dto';
import { HomeResponseDto, CategoryRankDto } from './home.dto';

@Injectable()
export class ListingsService implements OnModuleInit {
  constructor(
    @InjectRepository(Listing)
    private listingsRepository: Repository<Listing>,
    @InjectRepository(ListingImage)
    private imagesRepository: Repository<ListingImage>,
    @InjectRepository(HistoricPrice)
    private pricesRepository: Repository<HistoricPrice>,
    @InjectRepository(Seller)
    private sellersRepository: Repository<Seller>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(AcademicCalendarPhase)
    private calendarPhasesRepository: Repository<AcademicCalendarPhase>,
  ) {}

  async onModuleInit() {
    await this.seedAcademicCalendarPhases();
  }

  async findAll(category?: string, condition?: string) {
    const where: any = { active: true };
    if (category) where.category = category;
    if (condition) where.condition = condition;

    const listings = await this.listingsRepository.find({
      where,
      relations: ['seller', 'seller.user', 'images', 'course'],
      order: { created_at: 'DESC' },
    });

    return listings.map((listing) => this.sortListingImages(listing));
  }

  async findOne(id: number) {
    const listing = await this.listingsRepository.findOne({
      where: { id },
      relations: ['seller', 'seller.user', 'images', 'course', 'priceHistory'],
    });
    if (!listing) throw new NotFoundException(`Listing #${id} not found`);
    return this.sortListingImages(listing);
  }

  async create(userId: number, dto: CreateListingDto) {
    const seller = await this.findSellerForUser(userId, {
      createIfMissing: true,
    });

    const { images, ...listingPayload } = dto;
    const normalizedImages = this.normalizeImages(images);

    const listingId = await this.listingsRepository.manager.transaction(
      async (manager) => {
        const listingRepo = manager.getRepository(Listing);
        const priceRepo = manager.getRepository(HistoricPrice);
        const imageRepo = manager.getRepository(ListingImage);

        const listing = listingRepo.create({
          ...listingPayload,
          seller_id: seller.id,
        });
        const savedListing = await listingRepo.save(listing);

        await priceRepo.save({
          listing_id: savedListing.id,
          start_date: new Date(),
        });

        const imageEntities = normalizedImages.map((image) =>
          imageRepo.create({
            ...image,
            listing_id: savedListing.id,
          }),
        );

        await imageRepo.save(imageEntities);
        return savedListing.id;
      },
    );

    return this.findOne(listingId);
  }

  async update(id: number, userId: number, dto: UpdateListingDto) {
    const listing = await this.listingsRepository.findOne({ where: { id } });
    if (!listing) throw new NotFoundException(`Listing #${id} not found`);

    const seller = await this.findSellerForUser(userId);

    if (listing.seller_id !== seller.id) {
      throw new ForbiddenException('Not your listing');
    }

    const {
      images,
      replace_images = false,
      removed_image_ids = [],
      ...listingPayload
    } = dto;

    await this.listingsRepository.manager.transaction(async (manager) => {
      const listingRepo = manager.getRepository(Listing);
      const priceRepo = manager.getRepository(HistoricPrice);

      if (
        dto.selling_price !== undefined &&
        dto.selling_price !== listing.selling_price
      ) {
        await priceRepo.update(
          { listing_id: id, final_date: null as any },
          { final_date: new Date() },
        );

        await priceRepo.save({
          listing_id: id,
          start_date: new Date(),
        });
      }

      if (Object.keys(listingPayload).length > 0) {
        await listingRepo.update(id, listingPayload);
      }

      if (images || removed_image_ids.length > 0) {
        await this.syncListingImages(
          manager,
          id,
          images ?? [],
          replace_images,
          removed_image_ids,
        );
      }
    });

    return this.findOne(id);
  }

  async remove(id: number, userId: number) {
    const listing = await this.listingsRepository.findOne({
      where: { id },
      select: ['id', 'seller_id'],
    });

    if (!listing) {
      throw new NotFoundException(`Listing #${id} not found`);
    }

    const seller = await this.findSellerForUser(userId);

    if (listing.seller_id !== seller.id) {
      throw new ForbiddenException('Not your listing');
    }


    await this.imagesRepository.delete({ listing_id: id });
    await this.pricesRepository.delete({ listing_id: id });
    await this.listingsRepository.delete(id);

    return { message: 'Listing deleted permanently' };
  }

  async addImage(listingId: number, userId: number, dto: AddImageDto) {
    const listing = await this.findOne(listingId);
    const seller = await this.findSellerForUser(userId);

    if (listing.seller_id !== seller.id) {
      throw new ForbiddenException('Not your listing');
    }

    return this.imagesRepository.manager.transaction(async (manager) => {
      const imageRepo = manager.getRepository(ListingImage);
      const currentImages = await imageRepo.find({
        where: { listing_id: listingId },
      });

      if (dto.is_primary) {
        await imageRepo.update({ listing_id: listingId }, { is_primary: false });
      }

      const sortOrder =
        dto.sort_order !== undefined
          ? dto.sort_order
          : this.getNextSortOrder(currentImages);

      const image = imageRepo.create({
        ...dto,
        sort_order: sortOrder,
        listing_id: listingId,
      });

      const savedImage = await imageRepo.save(image);
      await this.reconcilePrimaryAndOrder(manager, listingId);
      return savedImage;
    });
  }

  async removeImage(imageId: number, userId: number) {
    const image = await this.imagesRepository.findOne({
      where: { id: imageId },
      relations: ['listing'],
    });
    if (!image) throw new NotFoundException(`Image #${imageId} not found`);

    const seller = await this.findSellerForUser(userId);
    if (image.listing.seller_id !== seller.id) {
      throw new ForbiddenException('Not your listing');
    }

    await this.imagesRepository.manager.transaction(async (manager) => {
      const imageRepo = manager.getRepository(ListingImage);
      await imageRepo.remove(image);
      await this.reconcilePrimaryAndOrder(manager, image.listing_id);
    });

    return { message: 'Image removed' };
  }

  private normalizeImages(images: CreateListingImageDto[]) {
    if (!images || images.length === 0) {
      throw new BadRequestException('At least one image is required');
    }

    const urls = new Set<string>();
    const normalized = images.map((image, index) => {
      if (urls.has(image.url)) {
        throw new BadRequestException('Duplicate image URLs are not allowed');
      }

      urls.add(image.url);
      return {
        url: image.url,
        is_primary: image.is_primary ?? false,
        sort_order: image.sort_order ?? index,
      };
    });

    return this.normalizePrimaryAndOrder(normalized);
  }

  private async findSellerForUser(
    userId: number,
    options: { createIfMissing?: boolean } = {},
  ) {
    let seller = await this.sellersRepository.findOne({
      where: { user_id: userId },
      relations: ['user'],
    });

    if (!seller && options.createIfMissing) {
      seller = await this.sellersRepository.save(
        this.sellersRepository.create({ user_id: userId }),
      );
      await this.usersRepository.update(userId, { is_seller: true });
      seller = await this.sellersRepository.findOne({
        where: { id: seller.id },
        relations: ['user'],
      });
    }

    if (!seller) {
      throw new ForbiddenException('User is not a seller');
    }

    if (seller.user && seller.user.id !== userId) {
      throw new ConflictException(
        'Seller profile does not match authenticated user',
      );
    }

    return seller;
  }

  private async syncListingImages(
    manager: EntityManager,
    listingId: number,
    images: UpdateListingImageDto[],
    replaceImages: boolean,
    removedImageIds: number[],
  ) {
    const imageRepo = manager.getRepository(ListingImage);
    const existing = await imageRepo.find({ where: { listing_id: listingId } });
    const existingById = new Map(existing.map((image) => [image.id, image]));

    if (replaceImages) {
      if (!images.length) {
        throw new BadRequestException(
          'A listing must contain at least one image when replacing images',
        );
      }

      await imageRepo.delete({ listing_id: listingId });
      const normalized = this.normalizePrimaryAndOrder(
        images.map((image, index) => ({
          url: image.url,
          is_primary: image.is_primary ?? false,
          sort_order: image.sort_order ?? index,
        })),
      );

      await imageRepo.save(
        normalized.map((image) =>
          imageRepo.create({
            ...image,
            listing_id: listingId,
          }),
        ),
      );
      return;
    }

    for (const imageId of removedImageIds) {
      if (!existingById.has(imageId)) {
        throw new BadRequestException(
          `Image #${imageId} does not belong to listing #${listingId}`,
        );
      }
    }

    if (removedImageIds.length > 0) {
      await imageRepo.delete(removedImageIds);
      removedImageIds.forEach((imageId) => existingById.delete(imageId));
    }

    for (const image of images) {
      if (image.id) {
        const current = existingById.get(image.id);
        if (!current) {
          throw new BadRequestException(
            `Image #${image.id} does not belong to listing #${listingId}`,
          );
        }

        current.url = image.url;
        if (image.is_primary !== undefined) {
          current.is_primary = image.is_primary;
        }
        if (image.sort_order !== undefined) {
          current.sort_order = image.sort_order;
        }

        await imageRepo.save(current);
        continue;
      }

      const createdImage = await imageRepo.save(
        imageRepo.create({
          listing_id: listingId,
          url: image.url,
          is_primary: image.is_primary ?? false,
          sort_order:
            image.sort_order ??
            this.getNextSortOrder(Array.from(existingById.values())),
        }),
      );

      existingById.set(createdImage.id, createdImage);
    }

    await this.reconcilePrimaryAndOrder(manager, listingId);
  }

  private normalizePrimaryAndOrder(
    images: Array<{ url: string; is_primary: boolean; sort_order: number }>,
  ) {
    const urlSet = new Set<string>();
    for (const image of images) {
      if (urlSet.has(image.url)) {
        throw new BadRequestException('Duplicate image URLs are not allowed');
      }
      urlSet.add(image.url);
    }

    const primaryCount = images.filter((image) => image.is_primary).length;
    if (primaryCount > 1) {
      throw new BadRequestException('Only one image can be primary');
    }

    const ordered = [...images]
      .map((image, originalIndex) => ({ ...image, originalIndex }))
      .sort((a, b) => {
        if (a.sort_order === b.sort_order) {
          return a.originalIndex - b.originalIndex;
        }
        return a.sort_order - b.sort_order;
      })
      .map((image, index) => ({
        url: image.url,
        is_primary: image.is_primary,
        sort_order: index,
      }));

    if (!ordered.some((image) => image.is_primary) && ordered.length > 0) {
      ordered[0].is_primary = true;
    }

    return ordered;
  }

  private async reconcilePrimaryAndOrder(manager: EntityManager, listingId: number) {
    const imageRepo = manager.getRepository(ListingImage);
    const currentImages = await imageRepo.find({ where: { listing_id: listingId } });

    if (currentImages.length === 0) {
      throw new BadRequestException('A listing must have at least one image');
    }

    const ordered = [...currentImages].sort((a, b) => {
      if (a.sort_order === b.sort_order) {
        return a.id - b.id;
      }
      return a.sort_order - b.sort_order;
    });

    const urlSet = new Set<string>();
    for (const image of ordered) {
      if (urlSet.has(image.url)) {
        throw new BadRequestException('Duplicate image URLs are not allowed');
      }
      urlSet.add(image.url);
    }

    const primaryCount = ordered.filter((image) => image.is_primary).length;
    if (primaryCount > 1) {
      throw new BadRequestException('Only one image can be primary');
    }

    if (primaryCount === 0) {
      ordered[0].is_primary = true;
    }

    ordered.forEach((image, index) => {
      image.sort_order = index;
    });

    await imageRepo.save(ordered);
  }

  private getNextSortOrder(images: Pick<ListingImage, 'sort_order'>[]) {
    if (images.length === 0) return 0;
    return Math.max(...images.map((image) => image.sort_order ?? 0)) + 1;
  }

  private sortListingImages(listing: Listing) {
    if (!listing.images || listing.images.length === 0) {
      return listing;
    }

    listing.images = [...listing.images].sort(
      (a, b) => a.sort_order - b.sort_order,
    );

    return listing;
  }

  async getPriceHistory(listingId: number) {
    return this.pricesRepository.find({ where: { listing_id: listingId } });
  }

  async findMyListings(userId: number) {
    const listings = await this.listingsRepository.find({
      where: { seller: { user_id: userId } },
      relations: ['seller', 'seller.user', 'images', 'course'],
      order: { created_at: 'DESC' },
    });

    return {
      active: listings.filter((l) => l.active),
      sold: listings.filter((l) => !l.active),
    };
  }

  async getHomeData(): Promise<HomeResponseDto> {
    const [recent, trending, categories] = await Promise.all([
      this.getRecentListings(),
      this.getTrendingListings(),
      this.getCategories(),
    ]);

    return {
      recent,
      trending,
      categories,
    };
  }

  async getSeasonalDemand(
    query: GetSeasonalDemandQueryDto,
  ): Promise<SeasonalDemandResponseDto> {
    const grain = query.grain ?? SeasonalDemandGrain.MONTH;
    const universityCode = query.university_code ?? 'UNIANDES';
    const { from, to } = this.resolveDateRange(query.from, query.to);

    if (from > to) {
      throw new BadRequestException('"from" must be before or equal to "to"');
    }

    const periodExpr =
      grain === SeasonalDemandGrain.DAY
        ? 'day'
        : grain === SeasonalDemandGrain.WEEK
          ? 'week'
          : SeasonalDemandGrain.MONTH;

    const rows = await this.listingsRepository.query(
      `
      WITH event_rows AS (
        SELECT
          l.created_at::date AS event_date,
          c.code AS course_code,
          c.faculty AS course_faculty,
          l.category::text AS category,
          1::int AS listings_created,
          0::int AS transactions_completed
        FROM listings l
        LEFT JOIN courses c ON c.id = l.course_id
        WHERE l.created_at::date BETWEEN $1::date AND $2::date

        UNION ALL

        SELECT
          t.created_at::date AS event_date,
          c.code AS course_code,
          c.faculty AS course_faculty,
          l.category::text AS category,
          0::int AS listings_created,
          1::int AS transactions_completed
        FROM transactions t
        JOIN listings l ON l.id = t.listing_id
        LEFT JOIN courses c ON c.id = l.course_id
        WHERE t.created_at::date BETWEEN $1::date AND $2::date
      ),
      event_enriched AS (
        SELECT
          date_trunc('${periodExpr}', e.event_date::timestamp)::date AS period_start,
          COALESCE(
            NULLIF(TRIM(e.course_faculty), ''),
            CASE
              WHEN UPPER(COALESCE(e.course_code, '')) LIKE 'CS%' OR UPPER(COALESCE(e.course_code, '')) LIKE 'EE%' THEN 'Engineering'
              WHEN UPPER(COALESCE(e.course_code, '')) LIKE 'BUS%' OR UPPER(COALESCE(e.course_code, '')) LIKE 'ECON%' THEN 'Business'
              WHEN UPPER(COALESCE(e.course_code, '')) LIKE 'MED%' OR UPPER(COALESCE(e.course_code, '')) LIKE 'NUR%' THEN 'Health'
              WHEN UPPER(COALESCE(e.course_code, '')) LIKE 'LAW%' THEN 'Law'
              WHEN UPPER(COALESCE(e.course_code, '')) LIKE 'PSY%' THEN 'Social Sciences'
              WHEN e.category IN ('textbook', 'notes', 'supplies') THEN 'General Academics'
              WHEN e.category = 'electronics' THEN 'Engineering'
              ELSE 'Other/Unknown'
            END
          ) AS faculty,
          COALESCE(acp.phase_name, 'out_of_calendar') AS calendar_phase,
          e.listings_created,
          e.transactions_completed
        FROM event_rows e
        LEFT JOIN academic_calendar_phases acp
          ON acp.university_code = $3
         AND e.event_date BETWEEN acp.start_date AND acp.end_date
      )
      SELECT
        period_start,
        faculty,
        calendar_phase,
        SUM(listings_created)::int AS listings_created,
        SUM(transactions_completed)::int AS transactions_completed,
        CASE
          WHEN SUM(listings_created) = 0 THEN 0
          ELSE ROUND(SUM(transactions_completed)::numeric / SUM(listings_created), 4)
        END AS conversion_rate
      FROM event_enriched
      GROUP BY period_start, faculty, calendar_phase
      ORDER BY period_start ASC, faculty ASC, calendar_phase ASC;
      `,
      [from, to, universityCode],
    );

    return {
      meta: {
        grain,
        from,
        to,
        university_code: universityCode,
      },
      data: rows.map((row) => ({
        period_start: this.toIsoDate(row.period_start),
        faculty: row.faculty,
        calendar_phase: row.calendar_phase,
        listings_created: Number(row.listings_created),
        transactions_completed: Number(row.transactions_completed),
        conversion_rate: Number(row.conversion_rate),
      })),
    };
  }

  private async getRecentListings(): Promise<Listing[]> {
    return this.listingsRepository
      .createQueryBuilder('listing')
      .leftJoinAndSelect('listing.images', 'images')
      .leftJoinAndSelect('listing.seller', 'seller')
      .leftJoinAndSelect('seller.user', 'user')
      .leftJoinAndSelect('listing.course', 'course')
      .where('listing.active = true')
      .orderBy('listing.created_at', 'DESC')
      .limit(15)
      .getMany();
  }

  private async getTrendingListings(): Promise<Listing[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // First query: Get listing IDs with trend scores
    const trendScores = await this.listingsRepository
      .createQueryBuilder('listing')
      .leftJoin(
        'transactions',
        'tx',
        'tx.listing_id = listing.id AND tx.created_at >= :thirtyDaysAgo',
        { thirtyDaysAgo }
      )
      .leftJoin('reviews', 'review', 'review.transaction_id = tx.id')
      .where('listing.active = true')
      .groupBy('listing.id')
      .addGroupBy('listing.seller_id')
      .select('listing.id', 'id')
      .addSelect(
        `(
          COALESCE(COUNT(DISTINCT tx.id), 0) * 0.6 +
          COALESCE((SELECT AVG(rating) FROM reviews r WHERE r.transaction_id IN (SELECT id FROM transactions WHERE listing_id = listing.id)), 0) * 0.3 +
          COALESCE(COUNT(DISTINCT review.id), 0) * 0.1
        )`,
        'trend_score'
      )
      .orderBy('trend_score', 'DESC')
      .limit(15)
      .getRawMany();

    // Second query: Fetch full entities with relations for the trending listing IDs
    if (trendScores.length === 0) {
      return [];
    }

    const listingIds = trendScores.map((score) => score.id);
    return this.listingsRepository
      .createQueryBuilder('listing')
      .leftJoinAndSelect('listing.images', 'images')
      .leftJoinAndSelect('listing.seller', 'seller')
      .leftJoinAndSelect('seller.user', 'user')
      .leftJoinAndSelect('listing.course', 'course')
      .where('listing.id IN (:...ids)', { ids: listingIds })
      .orderBy(
        `CASE ${listingIds.map((id, index) => `WHEN listing.id = ${id} THEN ${index}`).join(' ')} ELSE ${listingIds.length} END`,
        'ASC',
      )
      .getMany();
  }

  private async getCategories(): Promise<CategoryRankDto[]> {
    const result = await this.listingsRepository
      .createQueryBuilder('listing')
      .select('listing.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .where('listing.active = true')
      .andWhere('listing.category IS NOT NULL')
      .groupBy('listing.category')
      .orderBy('count', 'DESC')
      .getRawMany();

    return result.map((item) => ({
      category: item.category,
      count: parseInt(item.count, 10),
    }));
  }

  private async seedAcademicCalendarPhases() {
    await this.calendarPhasesRepository.upsert(ACADEMIC_CALENDAR_PHASES_SEED, {
      conflictPaths: [
        'university_code',
        'semester_code',
        'phase_name',
        'start_date',
        'end_date',
      ],
      skipUpdateIfNoValuesChanged: true,
    });
  }

  private resolveDateRange(from?: string, to?: string) {
    const today = new Date();
    const defaultFrom = `${today.getUTCFullYear()}-01-01`;
    const normalizedFrom = from ?? defaultFrom;
    const normalizedTo = to ?? this.toIsoDate(today);

    return {
      from: normalizedFrom,
      to: normalizedTo,
    };
  }

  private toIsoDate(value: Date | string) {
    if (typeof value === 'string') {
      return value.slice(0, 10);
    }

    return value.toISOString().slice(0, 10);
  }
}
