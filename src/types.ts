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
  description?: string;
  location?: string;
  packedPieceIds: string[];
  dayAssignments: DayAssignment[];
  outfits?: { outfitId: string; isWorn?: boolean }[];
}

export interface UserProfile {
  skinTone: string; // e.g. "Medium Olive", "Fair Warm", "Deep Cool", "Tan Neutral"
  undertone: 'Warm' | 'Cool' | 'Neutral' | 'Olive';
  contrastLevel?: 'High Contrast' | 'Medium Contrast' | 'Low / Tonal Contrast';
  seasonalColor?: 'Spring' | 'Summer' | 'Autumn' | 'Winter' | 'Universal';
  faceShape: 'Round' | 'Oval' | 'Square' | 'Heart' | 'Diamond' | 'Oblong';
  jawlineDefinition?: 'Soft / Curved' | 'Moderate' | 'Sharp / Chiseled';
  neckLength?: 'Short' | 'Average' | 'Long';
  height: string; // e.g. "181 cm (~5'11\")"
  heightCategory: 'Petite' | 'Average' | 'Tall';
  bodyType: 'Slim' | 'Slim / Midsection Carry ("Skinny Fat")' | 'Athletic' | 'Average' | 'Broad / Muscular' | 'Plus-size / Curve';
  bodyShape?: 'Rectangle' | 'Inverted Triangle' | 'Triangle / Pear' | 'Hourglass' | 'Oval / Apple';
  torsoToLegRatio?: 'Long Torso / Short Legs' | 'Balanced Proportions' | 'Long Legs / Short Torso';
  shoulderSlope?: 'Square / Broad' | 'Average' | 'Sloped';
  hairColor?: string;
  eyeColor?: string;
  styleAesthetic?: string[]; // e.g. ['Smart Casual', 'Minimalist', 'Old Money', 'Streetwear']
  notes?: string;
}

export interface AIStylistRequest {
  userProfile?: UserProfile;
  sourceTab?: string;
  useOnlyPackedPieces?: boolean;
  event?: {
    name: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    location?: string;
    dayAssignments?: DayAssignment[];
    packedPieceIds?: string[];
  };
  weather?: Weather;
  occasion?: string;
  ownedPieces: Piece[];
  wishlistPieces?: Piece[];
  existingOutfits?: Outfit[];
}

export interface AIOutfitRecommendation {
  title: string;
  topId: string;
  bottomId: string;
  midLayerId?: string;
  outerId?: string;
  accessoryId?: string;
  occasion: string[];
  weather: Weather;
  suitabilityScore: number; // 1-10
  rationale: string; // Why it works for their skin tone, face structure, height & event
  stylingTips: string; // Specific advice like sleeve fold, collar stance, layering trick
  assignedDate?: string; // YYYY-MM-DD string matching event day assignment
}

export interface AIMissingItemRecommendation {
  title: string;
  type: PieceType;
  category: PieceCategory;
  color: string;
  hex?: string;
  reasonToBuy: string; // How it complements skin tone / completes outfits for the event
}

export interface AIStylistResponse {
  summary: string;
  traitAnalysis: string; // Detailed breakdown of how skin tone, face shape, & height influence choices
  outfitRecommendations: AIOutfitRecommendation[];
  missingItemRecommendations: AIMissingItemRecommendation[];
}
