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
      let outfits: Outfit[] = [];
      
      if (!stored || JSON.parse(stored).length === 0) {
        outfits = INITIAL_OUTFITS;
      } else {
        outfits = JSON.parse(stored);
      }

      // Migration: Ensure all outfits have required fields
      const migratedOutfits = outfits.map(o => ({
        ...o,
        occasion: o.occasion || ['Casual'],
        rating: o.rating ?? 5,
        weather: o.weather || 'Cool'
      }));

      if (JSON.stringify(migratedOutfits) !== JSON.stringify(outfits)) {
        storageService.saveOutfits(migratedOutfits);
      }

      return migratedOutfits;
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
      let events: Event[] = [];
      
      if (!stored || JSON.parse(stored).length === 0) {
        events = [
          { 
            id: 'e1', 
            name: 'Japan Trip', 
            startDate: '2026-04-11', 
            endDate: '2026-04-25', 
            packedPieceIds: [], 
            dayAssignments: [
              { date: '2026-04-11' }, { date: '2026-04-12' }, { date: '2026-04-13' },
              { date: '2026-04-14' }, { date: '2026-04-15' }, { date: '2026-04-16' },
              { date: '2026-04-17' }, { date: '2026-04-18' }, { date: '2026-04-19' },
              { date: '2026-04-20' }, { date: '2026-04-21' }, { date: '2026-04-22' },
              { date: '2026-04-23' }, { date: '2026-04-24' }, { date: '2026-04-25' }
            ] 
          }
        ];
      } else {
        events = JSON.parse(stored);
      }

      // Migration: Ensure all events have required arrays and fix Japan Trip dates
      const migratedEvents = events.map(e => {
        let updatedEvent = {
          ...e,
          packedPieceIds: e.packedPieceIds || [],
          dayAssignments: e.dayAssignments || []
        };

        // Fix Japan Trip dates if they are invalid or old
        if (e.name === 'Japan Trip' && (e.startDate !== '2026-04-11' || e.endDate !== '2026-04-25')) {
          updatedEvent.startDate = '2026-04-11';
          updatedEvent.endDate = '2026-04-25';
          
          // Re-generate day assignments for the correct range
          const start = new Date('2026-04-11');
          const end = new Date('2026-04-25');
          const dayAssignments = [];
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            dayAssignments.push({
              date: d.toISOString().split('T')[0],
            });
          }
          updatedEvent.dayAssignments = dayAssignments;
        }

        return updatedEvent;
      });

      if (JSON.stringify(migratedEvents) !== JSON.stringify(events)) {
        storageService.saveEvents(migratedEvents);
      }

      return migratedEvents;
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
