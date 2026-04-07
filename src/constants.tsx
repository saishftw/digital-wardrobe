import * as React from 'react';
import { Piece, Outfit } from './types';

export const INITIAL_PIECES: Piece[] = [
  // Bottoms
  { id: 'b1', title: 'Black Pleated Pants', type: 'Bottom', category: 'Pants', color: 'Black', hex: '#000000', status: 'Owned', createdAt: 1711710000000 },
  { id: 'b2', title: 'Beige Linen Pants', type: 'Bottom', category: 'Pants', color: 'Beige', hex: '#F5F5DC', status: 'Owned', createdAt: 1711710000001 },
  { id: 'b3', title: 'Light-blue Denim', type: 'Bottom', category: 'Pants', color: 'Light Blue', hex: '#ADD8E6', status: 'Owned', createdAt: 1711710000002 },
  { id: 'b4', title: 'Navy Chinos', type: 'Bottom', category: 'Pants', color: 'Navy', hex: '#000044', status: 'Owned', createdAt: 1711710000003 },
  { id: 'b5', title: 'Beige Chinos', type: 'Bottom', category: 'Pants', color: 'Beige', hex: '#F5F5DC', status: 'Owned', createdAt: 1711710000004 },

  // Tops
  { id: 't1', title: 'Slate-blue Corduroy Shirt', type: 'Top', category: 'Shirt (LS)', color: 'Slate Blue', hex: '#708090', status: 'Owned', createdAt: 1711710000005 },
  { id: 't2', title: 'White Crew-neck', type: 'Top', category: 'Crew-neck', color: 'White', hex: '#FFFFFF', status: 'Owned', createdAt: 1711710000006 },
  { id: 't3', title: 'Forest-green Ribbed Crew-neck', type: 'Top', category: 'Crew-neck', color: 'Forest Green', hex: '#013220', status: 'Owned', createdAt: 1711710000007 },
  { id: 't4', title: 'Navy Corduroy Shirt', type: 'Top', category: 'Shirt (LS)', color: 'Navy', hex: '#000044', status: 'Owned', createdAt: 1711710000008 },
  { id: 't5', title: 'Rustic Shirt Button-down', type: 'Top', category: 'Shirt (LS)', color: 'Rustic', hex: '#8B4513', status: 'Owned', createdAt: 1711710000009 },
  { id: 't6', title: 'Grey Crew-neck', type: 'Top', category: 'Crew-neck', color: 'Grey', hex: '#808080', status: 'Owned', createdAt: 1711710000010 },
  { id: 't7', title: 'Zara Geometric Shirt', type: 'Top', category: 'Shirt (SS)', color: 'Patterned', hex: '#444444', status: 'Owned', createdAt: 1711710000011 },
  { id: 't8', title: 'Slate-blue Crew-neck', type: 'Top', category: 'Crew-neck', color: 'Slate Blue', hex: '#708090', status: 'Owned', createdAt: 1711710000012 },
  { id: 't9', title: 'Maroon Ribbed Sweatshirt', type: 'Top', category: 'Crew-neck', color: 'Maroon', hex: '#800000', status: 'Owned', createdAt: 1711710000013 },
  { id: 't10', title: 'Black Crew-neck', type: 'Top', category: 'Crew-neck', color: 'Black', hex: '#000000', status: 'Owned', createdAt: 1711710000014 },
  { id: 't11', title: 'White Camp Collar Shirt', type: 'Top', category: 'Shirt (SS)', color: 'White', hex: '#FFFFFF', status: 'Owned', createdAt: 1711710000015 },
  { id: 't12', title: 'Forest-green Corduroy Shirt', type: 'Top', category: 'Shirt (LS)', color: 'Forest Green', hex: '#013220', status: 'Owned', createdAt: 1711710000016 },
  { id: 't13', title: 'Navy Graphic Shirt (Hamptons)', type: 'Top', category: 'Shirt (SS)', color: 'Navy', hex: '#000044', status: 'Owned', createdAt: 1711710000017 },
  { id: 't14', title: 'Black Ribbed Shirt', type: 'Top', category: 'Shirt (SS)', color: 'Black', hex: '#000000', status: 'Owned', createdAt: 1711710000018 },
  { id: 't15', title: 'Maroon Ribbed Crew-neck', type: 'Top', category: 'Crew-neck', color: 'Maroon', hex: '#800000', status: 'Owned', createdAt: 1711710000019 },
  { id: 't16', title: 'Brown Corduroy Shirt', type: 'Top', category: 'Shirt (LS)', color: 'Brown', hex: '#A52A2A', status: 'Owned', createdAt: 1711710000020 },
  { id: 't17', title: 'Dark-brown Crew-neck', type: 'Top', category: 'Crew-neck', color: 'Dark Brown', hex: '#5D4037', status: 'Owned', createdAt: 1711710000021 },
  { id: 't18', title: 'Beige Linen Shirt (Blue Birds)', type: 'Top', category: 'Shirt (SS)', color: 'Beige', hex: '#F5F5DC', status: 'Owned', createdAt: 1711710000022 },
  { id: 't19', title: 'Navy Striped Shirt (Half-sleeve)', type: 'Top', category: 'Shirt (SS)', color: 'Navy Striped', hex: '#000044', status: 'Owned', createdAt: 1711710000023 },
  { id: 't20', title: 'Navy Oversized Shirt', type: 'Top', category: 'Shirt (SS)', color: 'Navy', hex: '#000044', status: 'Owned', createdAt: 1711710000024 },

  // Outer
  { id: 'o1', title: 'Black Bomber Jacket', type: 'Outer', category: 'Jacket', color: 'Black', hex: '#000000', status: 'Owned', createdAt: 1711710000025 },
];

export const INITIAL_OUTFITS: Outfit[] = [
  { id: 'o1', bottomId: 'b1', topId: 't1', rating: 9, occasion: ['Casual', 'Smart Casual'], weather: 'Cool' },
  { id: 'o2', bottomId: 'b1', topId: 't2', outerId: 'o1', rating: 8, occasion: ['Casual'], weather: 'Cool' },
  { id: 'o3', bottomId: 'b1', topId: 't3', rating: 7, occasion: ['Casual'], weather: 'Cool' },
  { id: 'o4', bottomId: 'b1', topId: 't2', outerId: 't4', rating: 8, occasion: ['Smart Casual'], weather: 'Cool', notes: 'Navy corduroy as outer' },
  { id: 'o5', bottomId: 'b1', topId: 't2', outerId: 't1', rating: 8, occasion: ['Smart Casual'], weather: 'Cool' },
  { id: 'o6', bottomId: 'b1', topId: 't2', outerId: 't5', rating: 7, occasion: ['Casual'], weather: 'Cool', notes: 'Rustic shirt as outer' },
  { id: 'o7', bottomId: 'b1', topId: 't6', rating: 6, occasion: ['Casual'], weather: 'Cool' },
  { id: 'o8', bottomId: 'b1', topId: 't7', rating: 7, occasion: ['Smart Casual'], weather: 'Warm' },
  { id: 'o9', bottomId: 'b1', topId: 't8', rating: 7, occasion: ['Casual'], weather: 'Cool' },
  { id: 'o10', bottomId: 'b1', topId: 't9', rating: 7, occasion: ['Casual'], weather: 'Cool' },
  { id: 'o11', bottomId: 'b1', topId: 't10', outerId: 't11', rating: 7, occasion: ['Smart Casual'], weather: 'Warm', notes: 'Button only middle 1-2' },
  { id: 'o12', bottomId: 'b1', topId: 't11', rating: 7.5, occasion: ['Smart Casual'], weather: 'Warm' },
  
  { id: 'o13', bottomId: 'b2', topId: 't12', rating: 9, occasion: ['Smart Casual'], weather: 'Cool' },
  { id: 'o14', bottomId: 'b2', topId: 't13', rating: 8, occasion: ['Casual'], weather: 'Warm' },
  { id: 'o15', bottomId: 'b2', topId: 't14', rating: 8, occasion: ['Smart Casual'], weather: 'Warm' },
  { id: 'o16', bottomId: 'b2', topId: 't3', rating: 6, occasion: ['Casual'], weather: 'Cool' },
  { id: 'o17', bottomId: 'b2', topId: 't15', rating: 7, occasion: ['Casual'], weather: 'Cool' },
  { id: 'o18', bottomId: 'b2', topId: 't9', rating: 8, occasion: ['Casual'], weather: 'Cool' },
  { id: 'o19', bottomId: 'b2', topId: 't4', rating: 9, occasion: ['Smart Casual'], weather: 'Cool' },
  { id: 'o20', bottomId: 'b2', topId: 't16', rating: 6, occasion: ['Casual'], weather: 'Cool' },
  { id: 'o21', bottomId: 'b2', topId: 't8', rating: 5, occasion: ['Casual'], weather: 'Cool' },
  { id: 'o22', bottomId: 'b2', topId: 't2', outerId: 't1', rating: 7, occasion: ['Smart Casual'], weather: 'Cool' },
  { id: 'o23', bottomId: 'b2', topId: 't7', rating: 8, occasion: ['Smart Casual'], weather: 'Warm' },

  { id: 'o24', bottomId: 'b3', topId: 't10', rating: 8, occasion: ['Casual'], weather: 'Warm' },
  { id: 'o25', bottomId: 'b3', topId: 't10', outerId: 'o1', rating: 7, occasion: ['Casual'], weather: 'Cool' },
  { id: 'o26', bottomId: 'b3', topId: 't2', outerId: 't4', rating: 7.5, occasion: ['Casual'], weather: 'Cool' },
  { id: 'o27', bottomId: 'b3', topId: 't9', rating: 7.5, occasion: ['Casual'], weather: 'Cool' },
  { id: 'o28', bottomId: 'b3', topId: 't10', outerId: 't5', rating: 7.5, occasion: ['Casual'], weather: 'Cool', notes: 'Keep collar buttons; button only middle 1-2' },
  { id: 'o29', bottomId: 'b3', topId: 't17', rating: 6, occasion: ['Casual'], weather: 'Cool' },
  { id: 'o30', bottomId: 'b3', topId: 't18', rating: 6.5, occasion: ['Casual'], weather: 'Warm' },
  { id: 'o31', bottomId: 'b3', topId: 't19', rating: 7, occasion: ['Casual'], weather: 'Warm' },
  { id: 'o32', bottomId: 'b3', topId: 't20', rating: 9, occasion: ['Casual'], weather: 'Warm' },
  { id: 'o33', bottomId: 'b3', topId: 't13', rating: 6.5, occasion: ['Casual'], weather: 'Warm' },
];

export const CrewNeckIcon = ({ size = 24, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M6 8V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4" />
    <path d="M3 8h18l-1 4h-3v8H7v-8H4l-1-4z" />
  </svg>
);

export const HalfSleeveIcon = ({ size = 24, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 5L9 2h6l-3 3z" />
    <path d="M6 8V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4" />
    <path d="M3 8h18l-1 4h-3v8H7v-8H4l-1-4z" />
  </svg>
);

export const FullSleeveIcon = ({ size = 24, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 5L9 2h6l-3 3z" />
    <path d="M6 4h12l4 14-2 1h-2v3H6v-3H4l-2-1L6 4z" />
  </svg>
);

export const TrousersIcon = ({ size = 24, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M7 3h10l2 18h-4.5v-9h-1v9H5L7 3z" />
    <path d="M7 6h10" />
  </svg>
);

export const ShortsIcon = ({ size = 24, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 3h6v10h-2.5v-4h-1v4H9V3z" />
  </svg>
);

export const ShoesIcon = ({ size = 24, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 17h18l-1-5h-6l-2 2h-5l-4 3z" />
    <path d="M14 12v-2h3" />
  </svg>
);

export const OtherIcon = ({ size = 24, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v8M8 12h8" />
  </svg>
);
