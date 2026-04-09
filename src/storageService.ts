import { Piece, Outfit, Event } from './types';
import { INITIAL_PIECES, INITIAL_OUTFITS } from './constants';
import { db, auth } from './firebase';
import { 
  doc, 
  setDoc, 
  collection, 
  getDocs, 
  writeBatch,
  onSnapshot,
  query,
  getDoc
} from 'firebase/firestore';

const STORAGE_KEYS = {
  PIECES: 'wardrobe_pieces',
  OUTFITS: 'wardrobe_outfits',
  EVENTS: 'wardrobe_events',
  LAST_EXPORTED: 'wardrobe_last_exported',
  SYNC_STATUS: 'wardrobe_sync_status',
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
        
        // If logged in, sync to cloud
        if (auth.currentUser) {
          storageService.syncToCloud();
        }
        
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
    
    // Sync to cloud if logged in
    if (auth.currentUser) {
      const userId = auth.currentUser.uid;
      pieces.forEach(piece => {
        setDoc(doc(db, `users/${userId}/pieces`, piece.id), piece).catch(err => {
          console.error('Cloud sync error (piece):', err);
        });
      });
    }
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
        rating: o.rating ?? 0,
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

    // Sync to cloud if logged in
    if (auth.currentUser) {
      const userId = auth.currentUser.uid;
      outfits.forEach(outfit => {
        setDoc(doc(db, `users/${userId}/outfits`, outfit.id), outfit).catch(err => {
          console.error('Cloud sync error (outfit):', err);
        });
      });
    }
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

    // Sync to cloud if logged in
    if (auth.currentUser) {
      const userId = auth.currentUser.uid;
      events.forEach(event => {
        setDoc(doc(db, `users/${userId}/events`, event.id), event).catch(err => {
          console.error('Cloud sync error (event):', err);
        });
      });
    }
  },

  clearAllData: () => {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  },

  // Cloud Sync Utilities
  syncToCloud: async () => {
    if (!auth.currentUser) return;
    const userId = auth.currentUser.uid;
    const batch = writeBatch(db);

    const pieces = storageService.getPieces();
    const outfits = storageService.getOutfits();
    const events = storageService.getEvents();

    pieces.forEach(p => batch.set(doc(db, `users/${userId}/pieces`, p.id), p));
    outfits.forEach(o => batch.set(doc(db, `users/${userId}/outfits`, o.id), o));
    events.forEach(e => batch.set(doc(db, `users/${userId}/events`, e.id), e));

    await batch.commit();
    console.log('Local data synced to cloud');
  },

  syncFromCloud: async () => {
    if (!auth.currentUser) return;
    const userId = auth.currentUser.uid;

    const piecesSnap = await getDocs(collection(db, `users/${userId}/pieces`));
    const outfitsSnap = await getDocs(collection(db, `users/${userId}/outfits`));
    const eventsSnap = await getDocs(collection(db, `users/${userId}/events`));

    const pieces = piecesSnap.docs.map(d => d.data() as Piece);
    const outfits = outfitsSnap.docs.map(d => d.data() as Outfit);
    const events = eventsSnap.docs.map(d => d.data() as Event);

    if (pieces.length > 0) localStorage.setItem(STORAGE_KEYS.PIECES, JSON.stringify(pieces));
    if (outfits.length > 0) localStorage.setItem(STORAGE_KEYS.OUTFITS, JSON.stringify(outfits));
    if (events.length > 0) localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));

    return { pieces, outfits, events };
  },

  subscribeToCloud: (
    userId: string, 
    onPieces: (p: Piece[]) => void, 
    onOutfits: (o: Outfit[]) => void, 
    onEvents: (e: Event[]) => void
  ) => {
    const unsubPieces = onSnapshot(collection(db, `users/${userId}/pieces`), (snap) => {
      if (snap.metadata.hasPendingWrites) return; // Ignore local changes to avoid loops
      const pieces = snap.docs.map(d => d.data() as Piece);
      if (pieces.length > 0) {
        localStorage.setItem(STORAGE_KEYS.PIECES, JSON.stringify(pieces));
        onPieces(pieces);
      }
    });

    const unsubOutfits = onSnapshot(collection(db, `users/${userId}/outfits`), (snap) => {
      if (snap.metadata.hasPendingWrites) return;
      const outfits = snap.docs.map(d => d.data() as Outfit);
      if (outfits.length > 0) {
        localStorage.setItem(STORAGE_KEYS.OUTFITS, JSON.stringify(outfits));
        onOutfits(outfits);
      }
    });

    const unsubEvents = onSnapshot(collection(db, `users/${userId}/events`), (snap) => {
      if (snap.metadata.hasPendingWrites) return;
      const events = snap.docs.map(d => d.data() as Event);
      if (events.length > 0) {
        localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
        onEvents(events);
      }
    });

    return () => {
      unsubPieces();
      unsubOutfits();
      unsubEvents();
    };
  }
};
