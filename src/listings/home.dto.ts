import { Listing } from './listing.entity';

export class CategoryRankDto {
  category: string;
  count: number;
}

export class HomeResponseDto {
  recent: Listing[];
  trending: Listing[];
  categories: CategoryRankDto[];
}

export class TrendingListingDto extends Listing {
  trend_score?: number;
}
