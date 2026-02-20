export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  BANNED = 'banned',
}

export enum UserType {
  BUYER = 'buyer',
  SELLER = 'seller',
  BOTH = 'both',
}

export enum ListingCategory {
  TEXTBOOKS = 'textbooks',
  ELECTRONICS = 'electronics',
  NOTES_AND_STUDY_MATERIALS = 'notes_and_study_materials',
  FURNITURE = 'furniture',
  CLOTHING = 'clothing',
  SPORTS_EQUIPMENT = 'sports_equipment',
  OTHER = 'other',
}

export enum ListingCondition {
  NEW = 'new',
  LIKE_NEW = 'like_new',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
}

export enum ListingStatus {
  AVAILABLE = 'available',
  SOLD = 'sold',
  RESERVED = 'reserved',
  DELISTED = 'delisted',
}

export enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  DISPUTED = 'disputed',
}

export enum ReviewType {
  BUYER_TO_SELLER = 'buyer_to_seller',
  SELLER_TO_BUYER = 'seller_to_buyer',
}
