import * as React from 'react';
import { Piece, Outfit } from './types';

export const INITIAL_PIECES: Piece[] = [
  // Bottoms
  { id: 'b1', title: 'Black Pleated Pants', type: 'Bottom', category: 'Pants', color: 'Black', hex: '#000000', status: 'Owned', createdAt: 1711710000000 },
  { id: 'b2', title: 'Beige Linen Pants', type: 'Bottom', category: 'Pants', color: 'Beige', hex: '#F5F5DC', status: 'Owned', createdAt: 1711710000001 },
  { id: 'b3', title: 'Light-blue Denim', type: 'Bottom', category: 'Pants', color: 'Light Blue', hex: '#ADD8E6', status: 'Owned', createdAt: 1711710000002 },
  { id: 'b6', title: 'Dark Beige Chinos', type: 'Bottom', category: 'Pants', color: 'Dark Beige', hex: '#968966', status: 'Owned', createdAt: 1711710000026 },
  { id: 'b7', title: 'Black Lounge Pants', type: 'Bottom', category: 'Pants', color: 'Black', hex: '#000000', status: 'Owned', createdAt: 1711710000034 },

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
  { id: 't21', title: 'Botanical Print Beige Kurta', type: 'Top', category: 'Other', color: 'Beige', hex: '#F5F5DC', status: 'Owned', createdAt: 1711710000027 },
  { id: 't22', title: 'White Formal Shirt', type: 'Top', category: 'Shirt (LS)', color: 'White', hex: '#FFFFFF', status: 'Owned', createdAt: 1711710000028 },

  // Outer
  { id: 'o1', title: 'Black Bomber Jacket', type: 'Outer', category: 'Jacket', color: 'Black', hex: '#000000', status: 'Owned', createdAt: 1711710000025 },
  { id: 'o2', title: 'Rust Harrington Jacket', type: 'Outer', category: 'Jacket', color: 'Rust', hex: '#A0522D', status: 'Owned', createdAt: 1711710000029 },

  // Shoes
  { id: 's1', title: 'NB 2002R', type: 'Shoes', category: 'Sneakers', color: 'Black/Grey', hex: '#444444', status: 'Owned', createdAt: 1711710000030 },
  { id: 's2', title: 'Adidas Sambas', type: 'Shoes', category: 'Sneakers', color: 'Black', hex: '#FFFFFF', status: 'Owned', createdAt: 1711710000031 },

  // Accessories
  { id: 'a1', title: 'Red Slim Tie', type: 'Accessory', category: 'Other', color: 'Red', hex: '#FF0000', status: 'Owned', createdAt: 1711710000032 },
  { id: 'a2', title: 'Black Tie', type: 'Accessory', category: 'Other', color: 'Black', hex: '#000000', status: 'Owned', createdAt: 1711710000033 },
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

  // Rust Harrington Jacket Combinations
  { id: 'o34', bottomId: 'b1', topId: 't10', outerId: 'o2', rating: 8, occasion: ['Smart Casual'], weather: 'Cool', notes: 'Clean monochrome base, rust as the only color.' },
  { id: 'o35', bottomId: 'b1', topId: 't2', outerId: 'o2', rating: 9, occasion: ['Smart Casual'], weather: 'Cool', notes: 'Strongest three-tone — white, rust, black. Very Tokyo.' },
  { id: 'o36', bottomId: 'b1', topId: 't3', outerId: 'o2', rating: 10, occasion: ['Smart Casual'], weather: 'Cool', notes: 'Best dinner look. Three distinct earthy tones.' },
  { id: 'o37', bottomId: 'b2', topId: 't10', outerId: 'o2', rating: 8, occasion: ['Casual'], weather: 'Cool', notes: 'Dark tee, warm jacket, light base.' },
  { id: 'o38', bottomId: 'b2', topId: 't2', outerId: 'o2', rating: 7, occasion: ['Casual'], weather: 'Cool', notes: 'Needs dark shoes to anchor.' },
  { id: 'o39', bottomId: 'b2', topId: 't3', outerId: 'o2', rating: 9, occasion: ['Smart Casual'], weather: 'Cool', notes: 'Earthy tonal — refined.' },
  { id: 'o40', bottomId: 'b3', topId: 't10', outerId: 'o2', rating: 8, occasion: ['Casual'], weather: 'Cool', notes: 'Warm rust over dark tee, cool blue base.' },
  { id: 'o41', bottomId: 'b3', topId: 't2', outerId: 'o2', rating: 9, occasion: ['Casual'], weather: 'Cool', notes: 'Light + cool + warm — very fresh.' },
  { id: 'o42', bottomId: 'b3', topId: 't3', outerId: 'o2', rating: 8, occasion: ['Casual'], weather: 'Cool', notes: 'Earthy upper half, cool lower half.' },
  { id: 'o43', bottomId: 'b6', topId: 't10', outerId: 'o2', rating: 8, occasion: ['Casual'], weather: 'Cool', notes: 'Needs the black tee to anchor.' },
  { id: 'o44', bottomId: 'b6', topId: 't2', outerId: 'o2', rating: 7, occasion: ['Casual'], weather: 'Cool', notes: 'Similar warm tones competing. Risky.' },
  { id: 'o45', bottomId: 'b6', topId: 't3', outerId: 'o2', rating: 9, occasion: ['Smart Casual'], weather: 'Cool', notes: 'Three earthy tones at different depths.' },

  // Dark Beige Chinos Combinations
  { id: 'o46', bottomId: 'b6', topId: 't10', rating: 9, occasion: ['Casual'], weather: 'Warm', notes: 'Foolproof combo. Dark anchor, warm neutral.' },
  { id: 'o47', bottomId: 'b6', topId: 't2', rating: 8, occasion: ['Casual'], weather: 'Warm', notes: 'Strong contrast — crisp white on warm beige.' },
  { id: 'o48', bottomId: 'b6', topId: 't15', rating: 10, occasion: ['Smart Casual'], weather: 'Cool', notes: 'Strongest color pairing. Rich maroon against soft beige.' },
  { id: 'o49', bottomId: 'b6', topId: 't3', rating: 9, occasion: ['Casual'], weather: 'Cool', notes: 'Deep earthy green on warm beige.' },
  { id: 'o50', bottomId: 'b6', topId: 't9', rating: 8, occasion: ['Casual'], weather: 'Cool', notes: 'Sweatshirt version of maroon pairing.' },
  { id: 'o51', bottomId: 'b6', topId: 't10', outerId: 't1', rating: 9, occasion: ['Smart Casual'], weather: 'Cool', notes: 'Blue, black, beige — one of your best.' },
  { id: 'o52', bottomId: 'b6', topId: 't10', outerId: 't4', rating: 8, occasion: ['Smart Casual'], weather: 'Cool', notes: 'Deeper navy, more formal energy.' },
  { id: 'o53', bottomId: 'b6', topId: 't2', outerId: 't4', rating: 8, occasion: ['Smart Casual'], weather: 'Cool', notes: 'Navy over white over beige — clean and light.' },
  { id: 'o54', bottomId: 'b6', topId: 't10', outerId: 't12', rating: 9, occasion: ['Smart Casual'], weather: 'Cool', notes: 'Dark green over black tee, warm beige base.' },
  { id: 'o55', bottomId: 'b6', topId: 't2', outerId: 't12', rating: 8, occasion: ['Smart Casual'], weather: 'Cool', notes: 'Green over white over beige — fresh tonal.' },
  { id: 'o56', bottomId: 'b6', topId: 't10', outerId: 't11', rating: 8, occasion: ['Casual'], weather: 'Warm', notes: 'White texture over dark tee, warm beige base.' },
  { id: 'o57', bottomId: 'b6', topId: 't10', outerId: 't20', rating: 8, occasion: ['Casual'], weather: 'Warm', notes: 'Navy over black over beige — relaxed.' },

  // Formal & Traditional
  { id: 'o58', bottomId: 'b1', topId: 't22', accessoryId: 'a1', rating: 9, occasion: ['Formal'], weather: 'Cool', notes: 'White shirt + red tie + pleated pants' },
  { id: 'o59', bottomId: 'b1', topId: 't21', rating: 8, occasion: ['Traditional'], weather: 'Warm', notes: 'Kurta + pleated pants black' },
  { id: 'o60', bottomId: 'b1', topId: 't22', outerId: 'o1', accessoryId: 'a1', rating: 10, occasion: ['Formal'], weather: 'Cool', notes: 'Bomber jacket + shirt + tie combo — very sharp formal look.' },
  { id: 'o61', bottomId: 'b1', topId: 't22', outerId: 'o2', accessoryId: 'a2', rating: 10, occasion: ['Formal'], weather: 'Cool', notes: 'Rust Harrington + White Shirt + Black Tie + Pleated Pants' },
  // Lounge Pants Outfits
  { id: 'o62', bottomId: 'b7', topId: 't2', rating: 9, occasion: ['Casual'], weather: 'Warm', notes: 'White Crew-neck + Black Lounge Pants' },
  { id: 'o63', bottomId: 'b7', topId: 't6', rating: 8, occasion: ['Casual'], weather: 'Cool', notes: 'Grey Crew-neck + Black Lounge Pants' },
  { id: 'o64', bottomId: 'b7', topId: 't10', rating: 8, occasion: ['Casual'], weather: 'Cool', notes: 'Black Crew-neck + Black Lounge Pants' },
];

export const WardrobeLogo = ({ size = 24, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) => (
  <svg width={size} height={size} viewBox="-100 -100 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M0,-30 L0,-52 C0,-64 10,-72 20,-68 C30,-64 34,-54 28,-46" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M0,-30 L-62,30 L62,30 Z" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    <g transform="translate(52, 44)">
      <path d="M0,0 L0,28 L7,21 L13,34 L17,32 L11,19 L20,19 Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </g>
  </svg>
);

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
