import { Piece, Outfit, Event } from './types';
import { INITIAL_PIECES, INITIAL_OUTFITS } from './constants';

const STORAGE_KEYS = {
  PIECES: 'wardrobe_pieces',
  OUTFITS: 'wardrobe_outfits',
  EVENTS: 'wardrobe_events',
  LAST_EXPORTED: 'wardrobe_last_exported',
};

export const storageService = {
  getLastExported: (): number | null => {
    const stored = localStorage.getItem(STORAGE_KEYS.LAST_EXPORTED);
    return stored ? parseInt(stored, 10) : null;
  },

  setLastExported: (timestamp: number) => {
    localStorage.setItem(STORAGE_KEYS.LAST_EXPORTED, timestamp.toString());
  },

  exportData: () => {
    const data = {
      pieces: storageService.getPieces(),
      outfits: storageService.getOutfits(),
      events: storageService.getEvents(),
      exportedAt: Date.now()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wardrobe-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    storageService.setLastExported(Date.now());
  },

  importData: (jsonData: string) => {
    try {
      const data = JSON.parse(jsonData);
      if (data.pieces && data.outfits && data.events) {
        storageService.savePieces(data.pieces);
        storageService.saveOutfits(data.outfits);
        storageService.saveEvents(data.events);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to import data', e);
      return false;
    }
  },
  getPieces: (): Piece[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PIECES);
      let pieces: Piece[] = [];
      
      if (!stored || JSON.parse(stored).length === 0) {
        pieces = INITIAL_PIECES;
      } else {
        pieces = JSON.parse(stored);
      }

      // Migration: Ensure all pieces have a category
      const migratedPieces = pieces.map(p => {
        if (!p.category) {
          // Infer category from type if missing
          let inferredCategory: any = 'Other';
          if (p.type === 'Top') inferredCategory = 'Crew-neck';
          else if (p.type === 'Bottom') inferredCategory = 'Pants';
          else if (p.type === 'Outer') inferredCategory = 'Jacket';
          else if (p.type === 'Shoes') inferredCategory = 'Sneakers';
          return { ...p, category: inferredCategory };
        }
        return p;
      });

      if (JSON.stringify(migratedPieces) !== JSON.stringify(pieces)) {
        storageService.savePieces(migratedPieces);
      }

      return migratedPieces;
    } catch (e) {
      console.error('Failed to load pieces', e);
      return INITIAL_PIECES;
    }
  },

  savePieces: (pieces: Piece[]) => {
    localStorage.setItem(STORAGE_KEYS.PIECES, JSON.stringify(pieces));
  },

  getOutfits: (): Outfit[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.OUTFITS);
      if (!stored || JSON.parse(stored).length === 0) {
        localStorage.setItem(STORAGE_KEYS.OUTFITS, JSON.stringify(INITIAL_OUTFITS));
        return INITIAL_OUTFITS;
      }
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to load outfits', e);
      return INITIAL_OUTFITS;
    }
  },

  saveOutfits: (outfits: Outfit[]) => {
    localStorage.setItem(STORAGE_KEYS.OUTFITS, JSON.stringify(outfits));
  },

  getEvents: (): Event[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.EVENTS);
      if (!stored || JSON.parse(stored).length === 0) {
        const initialEvents: Event[] = [
          { id: 'e1', name: 'Japan Trip', packedPieceIds: [] }
        ];
        localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(initialEvents));
        return initialEvents;
      }
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to load events', e);
      return [];
    }
  },

  saveEvents: (events: Event[]) => {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
  },

  clearAllData: () => {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  }
};
