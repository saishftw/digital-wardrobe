export type PieceType = 'Top' | 'Bottom' | 'Outer' | 'Shoes' | 'Accessory';
export type PieceStatus = 'Owned' | 'Wishlist';
export type PieceCategory = 'Crew-neck' | 'Shirt (LS)' | 'Shirt (SS)' | 'Pants' | 'Shorts' | 'Jacket' | 'Coat' | 'Sneakers' | 'Boots' | 'Bag' | 'Watch' | 'Other';

export interface Piece {
  id: string;
  title: string;
  type: PieceType;
  category: PieceCategory;
  color: string;
  hex?: string;
  brand?: string;
  status: PieceStatus;
  createdAt?: number;
}

export type Weather = 'Warm' | 'Cool' | 'Cold';

export interface Outfit {
  id: string;
  bottomId: string;
  topId: string;
  outerId?: string;
  rating: number;
  occasion: string[];
  weather: Weather;
  notes?: string;
  isSuggested?: boolean;
}

export interface EventOutfit {
  outfitId: string;
  isWorn: boolean;
}

export interface Event {
  id: string;
  name: string;
  packedPieceIds: string[];
  outfits?: EventOutfit[];
}
