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
  midLayerId?: string;
  outerId?: string;
  accessoryId?: string;
  rating: number;
  occasion: string[];
  weather: Weather;
  notes?: string;
  isSuggested?: boolean;
}

export interface DayAssignment {
  date: string; // ISO string YYYY-MM-DD
  outfitId?: string;
}

export interface Event {
  id: string;
  name: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
  packedPieceIds: string[];
  dayAssignments: DayAssignment[];
}
