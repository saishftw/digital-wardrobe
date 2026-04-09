/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { useState, useEffect, useMemo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shirt, 
  LayoutGrid, 
  Calendar, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Star,
  ChevronRight,
  ChevronDown,
  Filter,
  X,
  Package,
  ArrowRightLeft,
  Search,
  Edit2,
  ThermometerSun,
  ThermometerSnowflake,
  CloudSun,
  MoreVertical,
  ExternalLink,
  Download,
  Upload,
  Settings,
  AlertTriangle,
  RotateCcw,
  Dices,
  Info,
  Sparkles,
  Database,
  Map,
  Footprints,
  Watch,
  ShoppingBag,
  Wind,
  Columns2,
  Circle,
  ArrowLeft,
  Check,
  Cloud,
  CloudOff,
  LogIn,
  LogOut,
  RefreshCw
} from 'lucide-react';
import { 
  Piece, 
  Outfit, 
  Event, 
  DayAssignment,
  PieceType, 
  PieceStatus, 
  PieceCategory, 
  Weather 
} from './types';
import { storageService } from './storageService';
import { auth, googleProvider, db } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { 
  WardrobeLogo,
  CrewNeckIcon, 
  HalfSleeveIcon, 
  FullSleeveIcon, 
  TrousersIcon, 
  ShortsIcon, 
  ShoesIcon, 
  OtherIcon 
} from './constants';

type View = 'Wardrobe' | 'Outfits' | 'Builder' | 'Events' | 'Settings';

const CATEGORY_ICONS: Record<PieceCategory, any> = {
  'Crew-neck': CrewNeckIcon,
  'Shirt (LS)': FullSleeveIcon,
  'Shirt (SS)': HalfSleeveIcon,
  'Pants': TrousersIcon,
  'Shorts': ShortsIcon,
  'Jacket': Wind,
  'Coat': Wind,
  'Sneakers': ShoesIcon,
  'Boots': ShoesIcon,
  'Bag': ShoppingBag,
  'Watch': Watch,
  'Other': OtherIcon
};

function getContrastColor(hexColor?: string) {
  if (!hexColor) return '#1A1A1A';
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#1A1A1A' : '#FFFFFF';
}

function PieceIcon({ category, color, size = 16, className = "" }: { category: PieceCategory, color?: string, size?: number, className?: string }) {
  const Icon = CATEGORY_ICONS[category] || OtherIcon;
  const iconColor = getContrastColor(color);
  
  return (
    <div 
      className={`relative flex items-center justify-center rounded-full border border-[#E5E5E5] shadow-inner overflow-hidden ${className}`}
      style={{ backgroundColor: color || '#EEE', width: size * 2.5, height: size * 2.5 }}
    >
      <Icon size={size} style={{ color: iconColor }} strokeWidth={2} />
    </div>
  );
}

export default function App() {
  const [view, setView] = useState<View>('Wardrobe');
  const [pieces, setPieces] = useState<Piece[]>(() => storageService.getPieces());
  const [outfits, setOutfits] = useState<Outfit[]>(() => storageService.getOutfits());
  const [events, setEvents] = useState<Event[]>(() => storageService.getEvents());
  const [lastExported, setLastExported] = useState<number | null>(() => storageService.getLastExported());
  
  // Auth & Sync State
  const [user, setUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  
  // Modals & Selection State
  const [showAddPiece, setShowAddPiece] = useState(false);
  const [editingPiece, setEditingPiece] = useState<Piece | null>(null);
  const [viewingPiece, setViewingPiece] = useState<Piece | null>(null);
  const [viewingOutfit, setViewingOutfit] = useState<Outfit | null>(null);
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
  const [selectedPieceId2, setSelectedPieceId2] = useState<string | null>(null); // Multi-piece selection
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [packingPieceId, setPackingPieceId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'piece' | 'event', id: string } | null>(null);
  const [confirmImport, setConfirmImport] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [showAddOutfit, setShowAddOutfit] = useState(false);

  // Auth Listener
  useEffect(() => {
    let unsubscribeCloud: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
      
      if (currentUser) {
        // Initial sync from cloud on login
        setIsSyncing(true);
        try {
          let cloudData = await storageService.syncFromCloud();
          
          // If cloud is empty, initialize with source of truth
          if (!cloudData || (cloudData.pieces.length === 0 && cloudData.outfits.length === 0)) {
            cloudData = await storageService.initializeWithSourceOfTruth();
          }

          if (cloudData) {
            setPieces(cloudData.pieces);
            setOutfits(cloudData.outfits);
            setEvents(cloudData.events);
          }
          
          // Subscribe to real-time updates
          unsubscribeCloud = storageService.subscribeToCloud(
            currentUser.uid,
            setPieces,
            setOutfits,
            setEvents
          );
        } catch (err) {
          console.error('Initial sync error:', err);
          setSyncError('Failed to sync from cloud');
        } finally {
          setIsSyncing(false);
        }
      } else {
        // Empty until signin
        setPieces([]);
        setOutfits([]);
        setEvents([]);
        if (unsubscribeCloud) {
          unsubscribeCloud();
          unsubscribeCloud = null;
        }
      }
    });
    return () => {
      unsubscribeAuth();
      if (unsubscribeCloud) unsubscribeCloud();
    };
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Login error:', err);
      setSyncError('Login failed');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Save data
  useEffect(() => {
    storageService.savePieces(pieces);
  }, [pieces]);

  useEffect(() => {
    storageService.saveOutfits(outfits);
  }, [outfits]);

  useEffect(() => {
    storageService.saveEvents(events);
  }, [events]);

  const handleExport = () => {
    storageService.exportData();
    setLastExported(Date.now());
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = ev.target?.result as string;
        setConfirmImport(content);
      };
      reader.readAsText(file);
    }
  };

  const handleReset = () => {
    storageService.clearAllData();
    window.location.reload();
  };

  const executeImport = () => {
    if (confirmImport) {
      if (storageService.importData(confirmImport)) {
        setPieces(storageService.getPieces());
        setOutfits(storageService.getOutfits());
        setEvents(storageService.getEvents());
        setConfirmImport(null);
      }
    }
  };

  const togglePieceStatus = (id: string) => {
    setPieces(pieces.map(p => p.id === id ? { ...p, status: p.status === 'Owned' ? 'Wishlist' : 'Owned' } : p));
  };

  const addPiece = (pieceData: Omit<Piece, 'id' | 'createdAt'>) => {
    if (editingPiece) {
      setPieces(pieces.map(p => p.id === editingPiece.id ? { ...pieceData, id: editingPiece.id, createdAt: p.createdAt } : p));
      setEditingPiece(null);
    } else {
      // Idempotency check: don't add if a piece with same title, type and color exists
      const exists = pieces.find(p => 
        p.title.toLowerCase() === pieceData.title.toLowerCase() && 
        p.type === pieceData.type && 
        p.color.toLowerCase() === pieceData.color.toLowerCase()
      );
      if (exists) {
        setShowAddPiece(false);
        return;
      }

      const piece: Piece = {
        ...pieceData,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: Date.now()
      };
      setPieces([...pieces, piece]);
    }
    setShowAddPiece(false);
  };

  const deletePiece = (id: string) => {
    setPieces(pieces.filter(p => p.id !== id));
    setOutfits(outfits.filter(o => o.bottomId !== id && o.topId !== id && o.outerId !== id));
    setEvents(events.map(e => ({
      ...e,
      packedPieceIds: e.packedPieceIds.filter(pid => pid !== id)
    })));
    if (viewingPiece?.id === id) setViewingPiece(null);
    setConfirmDelete(null);
  };

  const togglePacked = (eventId: string, pieceId: string) => {
    setEvents(events.map(e => {
      if (e.id === eventId) {
        const isPacked = e.packedPieceIds.includes(pieceId);
        return {
          ...e,
          packedPieceIds: isPacked 
            ? e.packedPieceIds.filter(id => id !== pieceId)
            : [...e.packedPieceIds, pieceId]
        };
      }
      return e;
    }));
  };

  const toggleWorn = (eventId: string, outfitId: string) => {
    setEvents(events.map(e => {
      if (e.id === eventId) {
        const currentOutfits = e.outfits || [];
        return {
          ...e,
          outfits: currentOutfits.map(o => 
            o.outfitId === outfitId ? { ...o, isWorn: !o.isWorn } : o
          )
        };
      }
      return e;
    }));
  };

  const addOutfitToEvent = (eventId: string, outfitId: string) => {
    setEvents(events.map(e => {
      if (e.id === eventId) {
        const currentOutfits = e.outfits || [];
        if (currentOutfits.some(o => o.outfitId === outfitId)) return e;
        return {
          ...e,
          outfits: [...currentOutfits, { outfitId, isWorn: false }]
        };
      }
      return e;
    }));
  };

  const removeOutfitFromEvent = (eventId: string, outfitId: string) => {
    setEvents(events.map(e => {
      if (e.id === eventId) {
        return {
          ...e,
          outfits: (e.outfits || []).filter(o => o.outfitId !== outfitId)
        };
      }
      return e;
    }));
  };

  const updateOutfitRating = (outfitId: string, rating: number) => {
    setOutfits(outfits.map(o => o.id === outfitId ? { ...o, rating } : o));
  };

  const updateOutfitNotes = (outfitId: string, notes: string) => {
    setOutfits(outfits.map(o => o.id === outfitId ? { ...o, notes } : o));
  };

  const addOutfit = (outfit: Omit<Outfit, 'id'>) => {
    // Idempotency check: don't add if an outfit with same pieces exists
    const exists = outfits.find(o => 
      o.topId === outfit.topId && 
      o.bottomId === outfit.bottomId && 
      o.outerId === outfit.outerId && 
      o.accessoryId === outfit.accessoryId
    );
    if (exists) return;

    const newOutfit: Outfit = {
      ...outfit,
      id: `o${Date.now()}`
    };
    setOutfits([...outfits, newOutfit]);
  };

  const addEvent = (name: string, startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dayAssignments: DayAssignment[] = [];
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dayAssignments.push({
        date: d.toISOString().split('T')[0],
      });
    }

    const newEvent: Event = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      startDate,
      endDate,
      packedPieceIds: [],
      dayAssignments
    };
    setEvents([...events, newEvent]);
  };

  const updateEventPackedPieces = (eventId: string, pieceIds: string[]) => {
    setEvents(events.map(e => e.id === eventId ? { ...e, packedPieceIds: pieceIds } : e));
  };

  const updateEventDayAssignment = (eventId: string, date: string, outfitId: string | undefined) => {
    setEvents(events.map(e => {
      if (e.id === eventId) {
        return {
          ...e,
          dayAssignments: e.dayAssignments.map(da => da.date === date ? { ...da, outfitId } : da)
        };
      }
      return e;
    }));
  };

  const deleteEvent = (id: string) => {
    setEvents(events.filter(e => e.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-[#1A1A1A] font-sans selection:bg-[#1A1A1A] selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-[#E5E5E5] px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#1A1A1A] rounded-xl flex items-center justify-center shadow-sm overflow-hidden">
            <WardrobeLogo size={18} className="text-white" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight italic serif">Digital Wardrobe</h1>
        </div>
        <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#A1A1A1]">
              {isSyncing ? (
                <RefreshCw size={12} className="animate-spin" />
              ) : (
                <Cloud size={12} className="text-emerald-500" />
              )}
              <span className="hidden sm:inline">Synced</span>
            </div>
          )}
          {(view === 'Wardrobe' || view === 'Outfits') && (
            <button 
              onClick={() => view === 'Wardrobe' ? setShowAddPiece(true) : setView('Builder')}
              className="p-2 rounded-full bg-[#1A1A1A] text-white hover:scale-105 transition-transform"
            >
              <Plus size={20} />
            </button>
          )}
          <button 
            onClick={() => setView('Settings')}
            className={`p-2 rounded-full transition-all ${view === 'Settings' ? 'bg-[#1A1A1A] text-white' : 'text-[#A1A1A1] hover:bg-gray-100'}`}
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-24 px-6 pt-6 max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          {view === 'Wardrobe' && (
            <WardrobeView 
              pieces={pieces} 
              onViewPiece={setViewingPiece}
              onPackPiece={setPackingPieceId}
              onToggleStatus={togglePieceStatus}
            />
          )}
          {view === 'Outfits' && (
            <OutfitsView 
              outfits={outfits} 
              pieces={pieces}
              onViewOutfit={setViewingOutfit}
              onAddOutfit={() => setView('Builder')}
            />
          )}
          {view === 'Builder' && (
            <BuilderView 
              pieces={pieces} 
              outfits={outfits}
              selectedPieceId={selectedPieceId}
              selectedPieceId2={selectedPieceId2}
              onSelectPiece={setSelectedPieceId}
              onSelectPiece2={setSelectedPieceId2}
              onViewOutfit={setViewingOutfit}
              onAddOutfit={addOutfit}
            />
          )}
          {view === 'Events' && (
            <EventsView 
              events={events}
              onSelectEvent={setSelectedEventId}
              onAddEvent={addEvent}
              onDeleteEvent={deleteEvent}
            />
          )}
          {view === 'Settings' && (
            <SettingsView 
              lastExported={lastExported}
              user={user}
              isSyncing={isSyncing}
              onLogin={handleLogin}
              onLogout={handleLogout}
              onExport={handleExport}
              onImport={handleImport}
              onReset={() => setConfirmReset(true)}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-[#E5E5E5] px-6 py-3 flex justify-around items-center z-50">
        <NavButton active={view === 'Wardrobe'} onClick={() => setView('Wardrobe')} icon={<Shirt size={22} />} label="Closet" />
        <NavButton active={view === 'Outfits'} onClick={() => setView('Outfits')} icon={<LayoutGrid size={22} />} label="Outfits" />
        <NavButton active={view === 'Builder'} onClick={() => setView('Builder')} icon={<ArrowRightLeft size={22} />} label="Builder" />
        <NavButton active={view === 'Events'} onClick={() => setView('Events')} icon={<Calendar size={22} />} label="Events" />
      </nav>

      {/* Event Detail View */}
      <AnimatePresence>
        {selectedEventId && (
          <EventDetailView 
            event={events.find(e => e.id === selectedEventId)!}
            pieces={pieces}
            outfits={outfits}
            onClose={() => setSelectedEventId(null)}
            onUpdatePacked={updateEventPackedPieces}
            onUpdateAssignment={updateEventDayAssignment}
            onAddOutfit={addOutfit}
          />
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {(showAddPiece || editingPiece) && (
          <AddPieceModal 
            piece={editingPiece || undefined}
            onClose={() => { setShowAddPiece(false); setEditingPiece(null); }}
            onAdd={addPiece}
          />
        )}
        {viewingPiece && (
          <PieceModal 
            piece={viewingPiece}
            outfits={outfits}
            onClose={() => setViewingPiece(null)}
            onEdit={(p) => { setViewingPiece(null); setEditingPiece(p); }}
            onDelete={(id) => { deletePiece(id); setViewingPiece(null); }}
            onBuildOutfit={(id) => { setSelectedPieceId(id); setView('Builder'); setViewingPiece(null); }}
          />
        )}
        {showAddOutfit && selectedPieceId && selectedPieceId2 && (
          <AddOutfitModal 
            topId={pieces.find(p => p.id === selectedPieceId || p.id === selectedPieceId2)?.type === 'Top' ? (pieces.find(p => p.id === selectedPieceId)?.type === 'Top' ? selectedPieceId : selectedPieceId2) : ''}
            bottomId={pieces.find(p => p.id === selectedPieceId || p.id === selectedPieceId2)?.type === 'Bottom' ? (pieces.find(p => p.id === selectedPieceId)?.type === 'Bottom' ? selectedPieceId : selectedPieceId2) : ''}
            outerId={pieces.find(p => p.id === selectedPieceId || p.id === selectedPieceId2)?.type === 'Outer' ? (pieces.find(p => p.id === selectedPieceId)?.type === 'Outer' ? selectedPieceId : selectedPieceId2) : ''}
            accessoryId={pieces.find(p => p.id === selectedPieceId || p.id === selectedPieceId2)?.type === 'Accessory' ? (pieces.find(p => p.id === selectedPieceId)?.type === 'Accessory' ? selectedPieceId : selectedPieceId2) : ''}
            onClose={() => setShowAddOutfit(false)}
            onSave={(o) => {
              addOutfit(o);
              setShowAddOutfit(false);
              setView('Outfits');
            }}
          />
        )}
        {viewingOutfit && (
          <OutfitModal 
            outfit={viewingOutfit}
            pieces={pieces}
            onClose={() => setViewingOutfit(null)}
            onUpdateRating={updateOutfitRating}
            onUpdateNotes={updateOutfitNotes}
          />
        )}
        {packingPieceId && (
          <PackingModal 
            pieceId={packingPieceId}
            events={events}
            onClose={() => setPackingPieceId(null)}
            onTogglePacked={togglePacked}
          />
        )}

        {/* Confirmation Dialogs */}
        {confirmImport && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-[40px] p-10 w-full max-w-md shadow-2xl space-y-8 text-center"
            >
              <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto text-orange-500">
                <AlertTriangle size={40} />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-bold">Overwrite Data?</h3>
                <p className="text-sm text-[#A1A1A1] leading-relaxed">
                  Importing this file will replace all your current pieces, outfits, and events. This cannot be undone.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={executeImport}
                  className="w-full py-4 bg-orange-500 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-orange-600 transition-colors"
                >
                  Yes, Overwrite
                </button>
                <button 
                  onClick={() => setConfirmImport(null)}
                  className="w-full py-4 text-[#A1A1A1] font-bold uppercase tracking-widest hover:text-[#1A1A1A] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {confirmReset && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-[40px] p-10 w-full max-w-md shadow-2xl space-y-8 text-center"
            >
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500">
                <RotateCcw size={40} />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-bold">Clear All Data?</h3>
                <p className="text-sm text-[#A1A1A1] leading-relaxed">
                  This will delete all your custom pieces, outfits, and events, and restore the app to its initial state.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleReset}
                  className="w-full py-4 bg-red-500 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-red-600 transition-colors"
                >
                  Yes, Clear Everything
                </button>
                <button 
                  onClick={() => setConfirmReset(false)}
                  className="w-full py-4 text-[#A1A1A1] font-bold uppercase tracking-widest hover:text-[#1A1A1A] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-colors ${active ? 'text-[#1A1A1A]' : 'text-[#A1A1A1]'}`}
    >
      {icon}
      <span className="text-[10px] uppercase font-bold tracking-widest">{label}</span>
    </button>
  );
}

function WardrobeView({ pieces, onViewPiece, onPackPiece, onToggleStatus }: { pieces: Piece[], onViewPiece: (p: Piece) => void, onPackPiece: (id: string) => void, onToggleStatus: (id: string) => void }) {
  const [filter, setFilter] = useState<PieceType | 'All'>('All');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'type' | 'newest' | 'title'>('newest');

  const filteredPieces = useMemo(() => {
    let result = pieces.filter(p => {
      const matchesFilter = filter === 'All' || p.type === filter;
      const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || 
                            p.color.toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    });

    if (sortBy === 'type') {
      result.sort((a, b) => a.type.localeCompare(b.type));
    } else if (sortBy === 'newest') {
      result.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    } else if (sortBy === 'title') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [pieces, filter, search, sortBy]);

  const stats = useMemo(() => {
    const owned = pieces.filter(p => p.status === 'Owned').length;
    const wishlist = pieces.filter(p => p.status === 'Wishlist').length;
    return { total: pieces.length, owned, wishlist };
  }, [pieces]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="space-y-4">
        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-[#A1A1A1]">
          <span>{stats.total} pieces · {stats.owned} owned · {stats.wishlist} wishlist</span>
          <div className="flex gap-2">
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent outline-none cursor-pointer hover:text-[#1A1A1A]"
            >
              <option value="newest">Newest</option>
              <option value="type">Type</option>
              <option value="title">Title</option>
            </select>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A1A1]" size={16} />
          <input 
            type="text"
            placeholder="Search wardrobe..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-[#E5E5E5] rounded-2xl py-3 pl-10 pr-4 text-sm outline-none focus:border-[#1A1A1A] transition-colors"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {['All', 'Top', 'Bottom', 'Outer', 'Shoes', 'Accessory'].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type as any)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap ${
                filter === type ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' : 'bg-white text-[#1A1A1A] border-[#E5E5E5]'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {(filter !== 'All' || search) && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1A1]">Active Filters:</span>
            <div className="flex flex-wrap gap-2">
              {filter !== 'All' && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full text-[10px] font-bold uppercase">
                  {filter} <X size={10} className="cursor-pointer" onClick={() => setFilter('All')} />
                </span>
              )}
              {search && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full text-[10px] font-bold uppercase">
                  "{search}" <X size={10} className="cursor-pointer" onClick={() => setSearch('')} />
                </span>
              )}
              <button 
                onClick={() => { setFilter('All'); setSearch(''); }}
                className="text-[10px] font-bold uppercase underline underline-offset-2 text-[#A1A1A1]"
              >
                Clear All
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {filteredPieces.map((piece) => (
          <div 
            key={piece.id} 
            onClick={() => onViewPiece(piece)}
            className="group relative bg-white border border-[#E5E5E5] rounded-2xl p-4 hover:border-[#1A1A1A] transition-all cursor-pointer overflow-hidden"
          >
            <div className="flex justify-between items-start mb-3">
              <PieceIcon category={piece.category} color={piece.hex} />
              <div className="flex gap-1">
                <button 
                  onClick={(e) => { e.stopPropagation(); onPackPiece(piece.id); }}
                  className="p-2 rounded-xl text-[#A1A1A1] hover:text-[#1A1A1A] hover:bg-gray-50 transition-colors"
                >
                  <Package size={16} />
                </button>
              </div>
            </div>
            <h3 className="text-sm font-medium leading-tight mb-1 line-clamp-2">{piece.title}</h3>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-[#A1A1A1] font-bold">{piece.type}</span>
              <button 
                onClick={(e) => { e.stopPropagation(); onToggleStatus(piece.id); }}
                className={`text-[10px] px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-wider transition-colors ${
                  piece.status === 'Owned' ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                }`}
              >
                {piece.status}
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {filteredPieces.length === 0 && (
        <div className="py-20 text-center space-y-4">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-[#A1A1A1]">
            <Search size={24} strokeWidth={1.5} />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">No items found</p>
            <p className="text-xs text-[#A1A1A1]">Try adjusting your search or filters.</p>
          </div>
          <button 
            onClick={() => { setFilter('All'); setSearch(''); }}
            className="text-xs font-bold uppercase tracking-widest text-[#1A1A1A] underline underline-offset-4"
          >
            Clear all filters
          </button>
        </div>
      )}
    </motion.div>
  );
}

function OutfitsView({ outfits, pieces, onViewOutfit, onAddOutfit }: { outfits: Outfit[], pieces: Piece[], onViewOutfit: (o: Outfit) => void, onAddOutfit: () => void }) {
  const [filter, setFilter] = useState<string | 'All'>('All');
  const [sortBy, setSortBy] = useState<'rating' | 'newest'>('rating');
  const [ownedOnly, setOwnedOnly] = useState(true);

  const occasions = useMemo(() => {
    const all = outfits.flatMap(o => o.occasion);
    return ['All', ...Array.from(new Set(all))];
  }, [outfits]);

  const filteredOutfits = useMemo(() => {
    let result = outfits;
    
    if (filter !== 'All') {
      result = result.filter(o => o.occasion.includes(filter));
    }

    if (ownedOnly) {
      result = result.filter(o => {
        const top = pieces.find(p => p.id === o.topId);
        const bottom = pieces.find(p => p.id === o.bottomId);
        const outer = o.outerId ? pieces.find(p => p.id === o.outerId) : null;
        return top?.status === 'Owned' && bottom?.status === 'Owned' && (!outer || outer.status === 'Owned');
      });
    }

    if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else {
      // Assuming newest by ID for now if createdAt not on outfits
      result.sort((a, b) => b.id.localeCompare(a.id));
    }

    return result;
  }, [outfits, filter, ownedOnly, sortBy, pieces]);

  const getPiece = (id: string) => pieces.find(p => p.id === id);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar flex-1">
            {occasions.map((occ) => (
              <button
                key={occ}
                onClick={() => setFilter(occ)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap ${
                  filter === occ ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' : 'bg-white text-[#1A1A1A] border-[#E5E5E5]'
                }`}
              >
                {occ}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 ml-4">
            <button 
              onClick={onAddOutfit}
              className="px-3 py-1.5 rounded-xl bg-[#1A1A1A] text-white text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-1.5"
            >
              <Plus size={12} />
              Create
            </button>
            <button 
              onClick={() => setOwnedOnly(!ownedOnly)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${
                ownedOnly ? 'bg-green-50 text-green-700 border-green-200' : 'bg-white text-[#A1A1A1] border-[#E5E5E5]'
              }`}
            >
              {ownedOnly ? 'Owned Only' : 'Show All'}
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-[#A1A1A1]">
          <span>{filteredOutfits.length} outfits found</span>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-transparent outline-none cursor-pointer hover:text-[#1A1A1A]"
          >
            <option value="rating">Top Rated</option>
            <option value="newest">Newest</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredOutfits.map((outfit) => {
          const top = getPiece(outfit.topId);
          const bottom = getPiece(outfit.bottomId);
          const outer = outfit.outerId ? getPiece(outfit.outerId) : null;
          const accessory = outfit.accessoryId ? getPiece(outfit.accessoryId) : null;

          const missingCount = [top, bottom, outer, accessory].filter(p => p && p.status === 'Wishlist').length;

          return (
            <div 
              key={outfit.id} 
              onClick={() => onViewOutfit(outfit)}
              className="bg-white border border-[#E5E5E5] rounded-3xl p-6 space-y-5 hover:border-[#1A1A1A] transition-all cursor-pointer group relative"
            >
              {missingCount > 0 && (
                <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-600 rounded-lg text-[9px] font-bold uppercase tracking-wider">
                  <AlertTriangle size={10} />
                  Missing {missingCount} {missingCount === 1 ? 'piece' : 'pieces'}
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <Star size={14} className="fill-[#1A1A1A] text-[#1A1A1A]" />
                  <span className="text-sm font-bold tracking-tight">{outfit.rating.toFixed(1)}/10</span>
                </div>
                <div className="flex items-center gap-2 text-[#A1A1A1]">
                  {outfit.weather === 'Warm' && <ThermometerSun size={14} />}
                  {outfit.weather === 'Cool' && <CloudSun size={14} />}
                  {outfit.weather === 'Cold' && <ThermometerSnowflake size={14} />}
                  <span className="text-[10px] font-bold uppercase tracking-widest">{outfit.weather}</span>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex -space-x-4">
                  <PieceIcon category={top?.category || 'Other'} color={top?.hex} size={14} className="border-4 border-white shadow-md group-hover:scale-105 transition-transform" />
                  <PieceIcon category={bottom?.category || 'Other'} color={bottom?.hex} size={14} className="border-4 border-white shadow-md group-hover:scale-105 transition-transform delay-75" />
                  {outer && (
                    <PieceIcon category={outer?.category || 'Other'} color={outer?.hex} size={14} className="border-4 border-white shadow-md group-hover:scale-105 transition-transform delay-100" />
                  )}
                  {accessory && (
                    <PieceIcon category={accessory?.category || 'Other'} color={accessory?.hex} size={14} className="border-4 border-white shadow-md group-hover:scale-105 transition-transform delay-150" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-snug mb-2">
                    {top?.title} + {bottom?.title} {outer ? `+ ${outer.title}` : ''} {accessory ? `+ ${accessory.title}` : ''}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {outfit.occasion?.map(occ => (
                      <span key={occ} className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-gray-50 text-[#A1A1A1] rounded-full">{occ}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredOutfits.length === 0 && (
        <div className="py-20 text-center space-y-4">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-[#A1A1A1]">
            <LayoutGrid size={24} strokeWidth={1.5} />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">No outfits found</p>
            <p className="text-xs text-[#A1A1A1]">Try changing your filters or "Owned Only" setting.</p>
          </div>
          <button 
            onClick={() => { setFilter('All'); setOwnedOnly(false); }}
            className="text-xs font-bold uppercase tracking-widest text-[#1A1A1A] underline underline-offset-4"
          >
            Show all outfits
          </button>
        </div>
      )}
    </motion.div>
  );
}

function BuilderView({ pieces, outfits, selectedPieceId, selectedPieceId2, onSelectPiece, onSelectPiece2, onViewOutfit, onAddOutfit }: { pieces: Piece[], outfits: Outfit[], selectedPieceId: string | null, selectedPieceId2: string | null, onSelectPiece: (id: string | null) => void, onSelectPiece2: (id: string | null) => void, onViewOutfit: (o: Outfit) => void, onAddOutfit: (o: Omit<Outfit, 'id'>) => void }) {
  const [search, setSearch] = useState('');
  const [weatherFilter, setWeatherFilter] = useState<Weather | 'All'>('All');
  const [occasionFilter, setOccasionFilter] = useState<string | 'All'>('All');

  const occasions = useMemo(() => {
    const all = outfits.flatMap(o => o.occasion);
    return ['All', ...Array.from(new Set(all))];
  }, [outfits]);

  const filteredPieces = useMemo(() => {
    return pieces.filter(p => 
      (p.title.toLowerCase().includes(search.toLowerCase()) || p.color.toLowerCase().includes(search.toLowerCase())) &&
      p.status === 'Owned'
    );
  }, [pieces, search]);

  const compatibleOutfits = useMemo(() => {
    if (!selectedPieceId && !selectedPieceId2) return [];
    return outfits.filter(o => {
      const matches1 = !selectedPieceId || o.topId === selectedPieceId || o.bottomId === selectedPieceId || o.outerId === selectedPieceId;
      const matches2 = !selectedPieceId2 || o.topId === selectedPieceId2 || o.bottomId === selectedPieceId2 || o.outerId === selectedPieceId2;
      const matchesWeather = weatherFilter === 'All' || o.weather === weatherFilter;
      const matchesOccasion = occasionFilter === 'All' || o.occasion.includes(occasionFilter);
      return matches1 && matches2 && matchesWeather && matchesOccasion;
    });
  }, [outfits, selectedPieceId, selectedPieceId2, weatherFilter, occasionFilter]);

  const handleFeelingLucky = () => {
    const ownedOutfits = outfits.filter(o => {
      const top = pieces.find(p => p.id === o.topId);
      const bottom = pieces.find(p => p.id === o.bottomId);
      const outer = o.outerId ? pieces.find(p => p.id === o.outerId) : true;
      return top?.status === 'Owned' && bottom?.status === 'Owned' && (outer === true || (outer && outer.status === 'Owned'));
    });

    if (ownedOutfits.length > 0) {
      const randomOutfit = ownedOutfits[Math.floor(Math.random() * ownedOutfits.length)];
      onViewOutfit(randomOutfit);
    } else {
      // Fallback to random piece if no outfits exist
      const ownedPieces = pieces.filter(p => p.status === 'Owned');
      if (ownedPieces.length > 0) {
        const randomPiece = ownedPieces[Math.floor(Math.random() * ownedPieces.length)];
        onSelectPiece(randomPiece.id);
        onSelectPiece2(null);
      }
    }
  };

  const getPiece = (id: string) => pieces.find(p => p.id === id);

  const isCompatible = (piece: Piece, otherId: string | null) => {
    if (!otherId) return true;
    const other = pieces.find(p => p.id === otherId);
    if (!other) return true;

    // Rule: Cannot have two bottoms
    if (piece.type === 'Bottom' && other.type === 'Bottom') return false;

    // Rule: Cannot have two "Tees" (Crew-neck)
    if (piece.category === 'Crew-neck' && other.category === 'Crew-neck') return false;

    // Rule: Cannot have two "Shoes"
    if (piece.type === 'Shoes' && other.type === 'Shoes') return false;

    return true;
  };

  const currentOutfitExists = useMemo(() => {
    if (!selectedPieceId || !selectedPieceId2) return false;
    return outfits.some(o => 
      (o.topId === selectedPieceId && o.bottomId === selectedPieceId2) ||
      (o.topId === selectedPieceId2 && o.bottomId === selectedPieceId)
    );
  }, [outfits, selectedPieceId, selectedPieceId2]);

  const handleSaveOutfit = () => {
    if (!selectedPieceId || !selectedPieceId2) return;
    const p1 = getPiece(selectedPieceId);
    const p2 = getPiece(selectedPieceId2);
    if (!p1 || !p2) return;

    const top = p1.type === 'Top' ? p1 : p2;
    const bottom = p1.type === 'Bottom' ? p1 : p2;

    onAddOutfit({
      topId: top.id,
      bottomId: bottom.id,
      rating: 0,
      occasion: ['Casual'],
      weather: 'Cool'
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">Outfit Builder</h2>
            <p className="text-xs text-[#A1A1A1] font-medium uppercase tracking-widest">Select pieces to find combinations</p>
          </div>
          <button 
            onClick={handleFeelingLucky}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E5E5] rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:border-[#1A1A1A] transition-all"
          >
            <Sparkles size={14} className="text-orange-500" />
            Feeling Lucky
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1A1]">Primary Piece</span>
            <div className="aspect-square bg-white border-2 border-dashed border-[#E5E5E5] rounded-[40px] flex flex-col items-center justify-center p-4 text-center relative overflow-hidden group">
              {selectedPieceId ? (
                <>
                  <PieceIcon category={getPiece(selectedPieceId)?.category || 'Other'} color={getPiece(selectedPieceId)?.hex} size={32} />
                  <p className="mt-4 text-xs font-bold line-clamp-1 px-2">{getPiece(selectedPieceId)?.title}</p>
                  <button 
                    onClick={() => onSelectPiece(null)}
                    className="absolute top-2 right-2 p-1 bg-white/80 backdrop-blur rounded-full shadow-sm transition-opacity"
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                <div className="text-[#A1A1A1] space-y-2">
                  <Plus size={24} className="mx-auto opacity-50" />
                  <p className="text-[10px] font-bold uppercase tracking-wider">Select Piece</p>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1A1]">Secondary (Optional)</span>
            <div className="aspect-square bg-white border-2 border-dashed border-[#E5E5E5] rounded-[40px] flex flex-col items-center justify-center p-4 text-center relative overflow-hidden group">
              {selectedPieceId2 ? (
                <>
                  <PieceIcon category={getPiece(selectedPieceId2)?.category || 'Other'} color={getPiece(selectedPieceId2)?.hex} size={32} />
                  <p className="mt-4 text-xs font-bold line-clamp-1 px-2">{getPiece(selectedPieceId2)?.title}</p>
                  <button 
                    onClick={() => onSelectPiece2(null)}
                    className="absolute top-2 right-2 p-1 bg-white/80 backdrop-blur rounded-full shadow-sm transition-opacity"
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                <div className="text-[#A1A1A1] space-y-2">
                  <Plus size={24} className="mx-auto opacity-50" />
                  <p className="text-[10px] font-bold uppercase tracking-wider">Select Piece</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {selectedPieceId && selectedPieceId2 && !currentOutfitExists && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="pt-2"
          >
            <button 
              onClick={handleSaveOutfit}
              className="w-full py-4 bg-[#1A1A1A] text-white rounded-3xl text-sm font-bold uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2"
            >
              <Sparkles size={18} />
              Save as New Outfit
            </button>
          </motion.div>
        )}

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A1A1]" size={16} />
            <input 
              type="text"
              placeholder="Search your closet..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-[#E5E5E5] rounded-2xl py-3 pl-10 pr-4 text-sm outline-none focus:border-[#1A1A1A] transition-colors"
            />
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {filteredPieces.map(piece => {
              const isSelected = selectedPieceId === piece.id || selectedPieceId2 === piece.id;
              const canSelect = isSelected || 
                                (!selectedPieceId && isCompatible(piece, selectedPieceId2)) || 
                                (!selectedPieceId2 && isCompatible(piece, selectedPieceId));
              
              return (
                <button
                  key={piece.id}
                  disabled={!canSelect && !isSelected}
                  onClick={() => {
                    if (selectedPieceId === piece.id) onSelectPiece(null);
                    else if (selectedPieceId2 === piece.id) onSelectPiece2(null);
                    else if (!selectedPieceId && isCompatible(piece, selectedPieceId2)) onSelectPiece(piece.id);
                    else if (!selectedPieceId2 && isCompatible(piece, selectedPieceId)) onSelectPiece2(piece.id);
                  }}
                  className={`flex-shrink-0 w-28 space-y-3 text-center transition-all ${
                    isSelected ? 'scale-105' : canSelect ? 'opacity-100 hover:opacity-80' : 'opacity-20 grayscale cursor-not-allowed'
                  }`}
                >
                  <div className={`w-24 h-24 rounded-[32px] mx-auto flex items-center justify-center border-2 transition-all mt-1 ${
                    isSelected ? 'border-[#1A1A1A] bg-gray-50' : 'border-transparent bg-white shadow-sm'
                  }`}>
                    <PieceIcon category={piece.category} color={piece.hex} size={16} />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-tight truncate px-1">{piece.title}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A1A1A1]">Compatible Outfits</h3>
          <div className="flex gap-2">
            <select 
              value={weatherFilter} 
              onChange={(e) => setWeatherFilter(e.target.value as any)}
              className="text-[10px] font-bold uppercase tracking-widest bg-transparent outline-none cursor-pointer"
            >
              <option value="All">All Weather</option>
              <option value="Warm">Warm</option>
              <option value="Cool">Cool</option>
              <option value="Cold">Cold</option>
            </select>
            <select 
              value={occasionFilter} 
              onChange={(e) => setOccasionFilter(e.target.value as any)}
              className="text-[10px] font-bold uppercase tracking-widest bg-transparent outline-none cursor-pointer"
            >
              {occasions.map(occ => <option key={occ} value={occ}>{occ}</option>)}
            </select>
          </div>
        </div>

        {compatibleOutfits.length > 0 ? (
          <div className="space-y-4">
            {compatibleOutfits.map(outfit => (
              <div 
                key={outfit.id}
                onClick={() => onViewOutfit(outfit)}
                className="bg-white border border-[#E5E5E5] rounded-3xl p-5 flex items-center gap-4 hover:border-[#1A1A1A] transition-all cursor-pointer group"
              >
                <div className="flex -space-x-3">
                  <PieceIcon category={getPiece(outfit.topId)?.category || 'Other'} color={getPiece(outfit.topId)?.hex} size={10} className="border-2 border-white shadow-sm" />
                  <PieceIcon category={getPiece(outfit.bottomId)?.category || 'Other'} color={getPiece(outfit.bottomId)?.hex} size={10} className="border-2 border-white shadow-sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1A1]">{outfit.weather}</span>
                    <span className="w-1 h-1 bg-gray-200 rounded-full" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1A1]">{outfit.occasion[0]}</span>
                  </div>
                  <p className="text-xs font-medium truncate">
                    {getPiece(outfit.topId)?.title} + {getPiece(outfit.bottomId)?.title}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold">
                  <Star size={12} className="fill-[#1A1A1A]" />
                  {outfit.rating.toFixed(1)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 bg-gray-50 rounded-3xl border border-dashed border-[#E5E5E5] text-center space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-[#A1A1A1]">
                {!selectedPieceId ? 'Select a piece to see combinations' : 'No matching outfits found'}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#CCCCCC]">
                Try removing filters or selecting different pieces
              </p>
            </div>
            {selectedPieceId && selectedPieceId2 && (
              <button 
                onClick={onAddOutfit}
                className="px-6 py-3 bg-[#1A1A1A] text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-colors"
              >
                Save as New Outfit
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function EventsView({ 
  events, 
  onSelectEvent, 
  onAddEvent, 
  onDeleteEvent, 
}: { 
  events: Event[], 
  onSelectEvent: (id: string) => void, 
  onAddEvent: (name: string, start: string, end: string) => void, 
  onDeleteEvent: (id: string) => void, 
}) {
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Your Events</h2>
        <button 
          onClick={() => setShowAddEvent(true)}
          className="p-2 bg-[#1A1A1A] text-white rounded-xl hover:bg-black transition-colors"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="space-y-4">
        {events.map((event) => (
          <div 
            key={event.id}
            onClick={() => onSelectEvent(event.id)}
            className="bg-white border border-[#E5E5E5] rounded-3xl p-6 cursor-pointer hover:border-[#1A1A1A] transition-all group"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h3 className="text-lg font-bold group-hover:text-[#1A1A1A] transition-colors">{event.name}</h3>
                <div className="flex items-center gap-2 text-[#A1A1A1] text-xs">
                  <Calendar size={12} />
                  <span>{new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}</span>
                </div>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); onDeleteEvent(event.id); }}
                className="p-2 text-[#A1A1A1] hover:text-red-500 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
            
            <div className="mt-4 flex items-center gap-3">
              <div className="flex -space-x-2">
                {event.packedPieceIds?.slice(0, 5).map((pid, i) => (
                  <div key={pid} className="w-6 h-6 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center overflow-hidden" style={{ zIndex: 5 - i }}>
                    <div className="w-full h-full" style={{ backgroundColor: '#1A1A1A' }} />
                  </div>
                ))}
                {(event.packedPieceIds?.length || 0) > 5 && (
                  <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[8px] font-bold z-0">
                    +{(event.packedPieceIds?.length || 0) - 5}
                  </div>
                )}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1A1]">
                {event.packedPieceIds?.length || 0} items packed
              </span>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showAddEvent && (
          <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddEvent(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-[40px] p-8 shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-medium serif italic">New Event</h2>
                <button onClick={() => setShowAddEvent(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A1A1A1]">Event Name</label>
                  <input 
                    className="w-full text-lg border-b border-[#E5E5E5] pb-2 outline-none focus:border-[#1A1A1A] transition-colors"
                    placeholder="e.g. Japan Trip"
                    value={newEventName}
                    onChange={e => setNewEventName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A1A1A1]">Start Date</label>
                    <input 
                      type="date"
                      className="w-full text-sm border-b border-[#E5E5E5] pb-2 outline-none focus:border-[#1A1A1A] transition-colors"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A1A1A1]">End Date</label>
                    <input 
                      type="date"
                      className="w-full text-sm border-b border-[#E5E5E5] pb-2 outline-none focus:border-[#1A1A1A] transition-colors"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <button 
                onClick={() => {
                  onAddEvent(newEventName, startDate, endDate);
                  setNewEventName('');
                  setStartDate('');
                  setEndDate('');
                  setShowAddEvent(false);
                }}
                disabled={!newEventName || !startDate || !endDate}
                className="w-full bg-[#1A1A1A] text-white py-4 rounded-2xl font-bold uppercase tracking-widest disabled:opacity-50 transition-opacity"
              >
                Create Event
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function EventDetailView({ 
  event, 
  pieces, 
  outfits, 
  onClose, 
  onUpdatePacked, 
  onUpdateAssignment,
  onAddOutfit
}: { 
  event: Event, 
  pieces: Piece[], 
  outfits: Outfit[], 
  onClose: () => void,
  onUpdatePacked: (eid: string, pids: string[]) => void,
  onUpdateAssignment: (eid: string, date: string, oid: string | undefined) => void,
  onAddOutfit: (o: Omit<Outfit, 'id'>) => void
}) {
  const [tab, setTab] = useState<'Itinerary' | 'Packing'>('Itinerary');
  const [selectingOutfitForDate, setSelectingOutfitForDate] = useState<string | null>(null);
  const [showQuickBuilder, setShowQuickBuilder] = useState(false);

  const possibleOutfits = useMemo(() => {
    return outfits.filter(outfit => {
      const piecesNeeded = [outfit.topId, outfit.bottomId, outfit.outerId, outfit.accessoryId].filter(Boolean) as string[];
      return piecesNeeded.every(id => event.packedPieceIds.includes(id));
    });
  }, [outfits, event.packedPieceIds]);

  const togglePacked = (pid: string) => {
    const newPacked = event.packedPieceIds.includes(pid)
      ? event.packedPieceIds.filter(id => id !== pid)
      : [...event.packedPieceIds, pid];
    onUpdatePacked(event.id, newPacked);
  };

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[80] bg-[#FDFDFD] flex flex-col"
    >
      <header className="px-6 py-4 border-b border-[#E5E5E5] flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-xl font-bold serif italic">{event.name}</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1A1]">
              {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button 
            onClick={() => setTab('Itinerary')}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${tab === 'Itinerary' ? 'bg-white shadow-sm text-[#1A1A1A]' : 'text-[#A1A1A1]'}`}
          >
            Itinerary
          </button>
          <button 
            onClick={() => setTab('Packing')}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${tab === 'Packing' ? 'bg-white shadow-sm text-[#1A1A1A]' : 'text-[#A1A1A1]'}`}
          >
            Packing
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {tab === 'Itinerary' ? (
            <motion.div 
              key="itinerary"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {event.dayAssignments?.map((day) => {
                const outfit = outfits.find(o => o.id === day.outfitId);
                const dateObj = new Date(day.date);
                
                return (
                  <div key={day.date} className="flex gap-6 group">
                    <div className="w-12 text-center space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1A1]">
                        {dateObj.toLocaleDateString('en-US', { weekday: 'short' })}
                      </span>
                      <div className="text-xl font-bold serif">{dateObj.getDate()}</div>
                    </div>
                    
                    <div className="flex-1">
                      {outfit ? (
                        <div className="bg-white border border-[#E5E5E5] rounded-3xl p-4 flex items-center justify-between group/outfit hover:border-[#1A1A1A] transition-all">
                          <div className="flex items-center gap-4">
                            <div className="flex -space-x-2">
                              <PieceIcon category={pieces.find(p => p.id === outfit.topId)?.category || 'Other'} color={pieces.find(p => p.id === outfit.topId)?.hex} size={6} />
                              <PieceIcon category={pieces.find(p => p.id === outfit.bottomId)?.category || 'Other'} color={pieces.find(p => p.id === outfit.bottomId)?.hex} size={6} />
                            </div>
                            <div>
                              <p className="text-sm font-bold">{pieces.find(p => p.id === outfit.topId)?.title} + {pieces.find(p => p.id === outfit.bottomId)?.title}</p>
                              <p className="text-[10px] text-[#A1A1A1] uppercase tracking-wider">{outfit.occasion?.join(', ')}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => onUpdateAssignment(event.id, day.date, undefined)}
                            className="p-2 text-[#A1A1A1] hover:text-red-500 opacity-0 group-hover/outfit:opacity-100 transition-all"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setSelectingOutfitForDate(day.date)}
                          className="w-full py-6 border-2 border-dashed border-[#E5E5E5] rounded-3xl text-[#A1A1A1] hover:border-[#1A1A1A] hover:text-[#1A1A1A] transition-all flex items-center justify-center gap-2"
                        >
                          <Plus size={16} />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Assign Outfit</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div 
              key="packing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="bg-[#1A1A1A] text-white p-6 rounded-[32px] flex justify-between items-center">
                <div className="space-y-1">
                  <h3 className="text-lg font-medium serif italic">Packing List</h3>
                  <div className="flex items-center gap-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                      {event.packedPieceIds.length} items selected
                    </p>
                    <div className="w-1 h-1 rounded-full bg-white/20" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                      {possibleOutfits.length} possible outfits
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowQuickBuilder(true)}
                  className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-colors group"
                  title="Create New Outfit from Packed Items"
                >
                  <Sparkles size={20} className="group-hover:scale-110 transition-transform" />
                </button>
              </div>

              <div className="space-y-6">
                {(['Top', 'Bottom', 'Outer', 'Shoes', 'Accessory'] as const).map(type => {
                  const typePieces = pieces.filter(p => p.type === type && p.status === 'Owned');
                  if (typePieces.length === 0) return null;
                  
                  const allTypePacked = typePieces.every(p => event.packedPieceIds.includes(p.id));
                  
                  const toggleAllType = () => {
                    let newPacked: string[];
                    if (allTypePacked) {
                      // Deselect all of this type
                      newPacked = event.packedPieceIds.filter(id => !typePieces.some(p => p.id === id));
                    } else {
                      // Select all of this type
                      const otherTypePacked = event.packedPieceIds.filter(id => !typePieces.some(p => p.id === id));
                      newPacked = [...otherTypePacked, ...typePieces.map(p => p.id)];
                    }
                    onUpdatePacked(event.id, newPacked);
                  };

                  return (
                    <div key={type} className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A1A1A1]">{type}s</h4>
                        <button 
                          onClick={toggleAllType}
                          className="text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A] hover:opacity-60 transition-opacity"
                        >
                          {allTypePacked ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {typePieces.map(piece => {
                          const isPacked = event.packedPieceIds.includes(piece.id);
                          return (
                            <button 
                              key={piece.id}
                              onClick={() => togglePacked(piece.id)}
                              className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${isPacked ? 'bg-[#1A1A1A] border-[#1A1A1A] text-white' : 'bg-white border-[#E5E5E5] text-[#1A1A1A] hover:border-[#1A1A1A]'}`}
                            >
                              <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isPacked ? 'bg-white border-white text-[#1A1A1A]' : 'border-[#E5E5E5]'}`}>
                                {isPacked && <Check size={12} strokeWidth={3} />}
                              </div>
                              <span className="text-xs font-medium truncate">{piece.title}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Outfit Selector Modal */}
      <AnimatePresence>
        {selectingOutfitForDate && (
          <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectingOutfitForDate(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-[40px] p-8 shadow-2xl flex flex-col max-h-[80vh]"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-medium serif italic">Select Outfit</h2>
                <button onClick={() => setSelectingOutfitForDate(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-2 no-scrollbar">
                {outfits.map(outfit => {
                  const top = pieces.find(p => p.id === outfit.topId);
                  const bottom = pieces.find(p => p.id === outfit.bottomId);
                  
                  return (
                    <button 
                      key={outfit.id}
                      onClick={() => {
                        onUpdateAssignment(event.id, selectingOutfitForDate, outfit.id);
                        setSelectingOutfitForDate(null);
                      }}
                      className="w-full p-4 bg-white border border-[#E5E5E5] rounded-3xl flex items-center gap-4 hover:border-[#1A1A1A] transition-all"
                    >
                      <div className="flex -space-x-2">
                        <PieceIcon category={top?.category || 'Other'} color={top?.hex} size={8} />
                        <PieceIcon category={bottom?.category || 'Other'} color={bottom?.hex} size={8} />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold">{top?.title} + {bottom?.title}</p>
                        <p className="text-[10px] text-[#A1A1A1] uppercase tracking-wider">{outfit.occasion.join(', ')}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quick Outfit Builder Modal */}
      <AnimatePresence>
        {showQuickBuilder && (
          <QuickOutfitBuilder 
            pieces={pieces.filter(p => event.packedPieceIds.includes(p.id))}
            onClose={() => setShowQuickBuilder(false)}
            onSave={(o) => {
              onAddOutfit(o);
              setShowQuickBuilder(false);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function QuickOutfitBuilder({ pieces, onClose, onSave }: { pieces: Piece[], onClose: () => void, onSave: (o: Omit<Outfit, 'id'>) => void }) {
  const [topId, setTopId] = useState('');
  const [bottomId, setBottomId] = useState('');
  const [outerId, setOuterId] = useState('');
  const [accessoryId, setAccessoryId] = useState('');
  const [occasion, setOccasion] = useState<string[]>(['Casual']);
  const [weather, setWeather] = useState<Weather>('Cool');

  const tops = pieces.filter(p => p.type === 'Top');
  const bottoms = pieces.filter(p => p.type === 'Bottom');
  const outers = pieces.filter(p => p.type === 'Outer');
  const accessories = pieces.filter(p => p.type === 'Accessory');

  const handleSave = () => {
    if (!topId || !bottomId) return;
    onSave({
      topId,
      bottomId,
      outerId: outerId || undefined,
      accessoryId: accessoryId || undefined,
      rating: 0,
      occasion,
      weather
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="relative w-full max-w-lg bg-white rounded-[40px] p-8 shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-medium serif italic">Quick Outfit Builder</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1A1]">Using packed items only</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-8 pr-2 no-scrollbar">
          {/* Top Selection */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1A1]">Select Top *</h3>
            <div className="grid grid-cols-3 gap-2">
              {tops.map(p => (
                <button 
                  key={p.id}
                  onClick={() => setTopId(p.id)}
                  className={`p-3 rounded-2xl border text-center transition-all ${topId === p.id ? 'bg-[#1A1A1A] border-[#1A1A1A] text-white' : 'bg-white border-[#E5E5E5] hover:border-[#1A1A1A]'}`}
                >
                  <div className="flex justify-center mb-2">
                    <PieceIcon category={p.category} color={p.hex} size={6} />
                  </div>
                  <span className="text-[10px] font-medium block truncate">{p.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Selection */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1A1]">Select Bottom *</h3>
            <div className="grid grid-cols-3 gap-2">
              {bottoms.map(p => (
                <button 
                  key={p.id}
                  onClick={() => setBottomId(p.id)}
                  className={`p-3 rounded-2xl border text-center transition-all ${bottomId === p.id ? 'bg-[#1A1A1A] border-[#1A1A1A] text-white' : 'bg-white border-[#E5E5E5] hover:border-[#1A1A1A]'}`}
                >
                  <div className="flex justify-center mb-2">
                    <PieceIcon category={p.category} color={p.hex} size={6} />
                  </div>
                  <span className="text-[10px] font-medium block truncate">{p.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Optional Layers */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1A1]">Outer (Optional)</h3>
              <select 
                value={outerId} 
                onChange={(e) => setOuterId(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-[#E5E5E5] rounded-2xl text-xs"
              >
                <option value="">None</option>
                {outers.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1A1]">Accessory (Optional)</h3>
              <select 
                value={accessoryId} 
                onChange={(e) => setAccessoryId(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-[#E5E5E5] rounded-2xl text-xs"
              >
                <option value="">None</option>
                {accessories.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
          </div>

          {/* Occasion & Weather */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1A1]">Occasion</h3>
              <div className="flex flex-wrap gap-2">
                {['Casual', 'Smart Casual', 'Formal', 'Traditional'].map(occ => (
                  <button
                    key={occ}
                    onClick={() => {
                      if (occasion.includes(occ)) setOccasion(occasion.filter(o => o !== occ));
                      else setOccasion([...occasion, occ]);
                    }}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${occasion.includes(occ) ? 'bg-[#1A1A1A] border-[#1A1A1A] text-white' : 'bg-white border-[#E5E5E5]'}`}
                  >
                    {occ}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1A1]">Weather</h3>
              <div className="flex gap-2">
                {(['Warm', 'Cool', 'Cold'] as Weather[]).map(w => (
                  <button
                    key={w}
                    onClick={() => setWeather(w)}
                    className={`flex-1 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${weather === w ? 'bg-[#1A1A1A] border-[#1A1A1A] text-white' : 'bg-white border-[#E5E5E5]'}`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 mt-auto">
          <button 
            onClick={handleSave}
            disabled={!topId || !bottomId}
            className="w-full py-4 bg-[#1A1A1A] text-white rounded-3xl text-sm font-bold uppercase tracking-widest hover:bg-black transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Check size={18} />
            Save Outfit to Wardrobe
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function SettingsView({ 
  lastExported, 
  user, 
  isSyncing, 
  onLogin, 
  onLogout, 
  onExport, 
  onImport, 
  onReset 
}: { 
  lastExported: number | null, 
  user: User | null,
  isSyncing: boolean,
  onLogin: () => void,
  onLogout: () => void,
  onExport: () => void, 
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void, 
  onReset: () => void 
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8"
    >
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-sm text-[#A1A1A1]">Manage your data and preferences</p>
      </div>

      <div className="space-y-4">
        {/* Cloud Sync Section */}
        <div className="bg-white border border-[#E5E5E5] rounded-3xl p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${user ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-[#1A1A1A]'}`}>
              {user ? <Cloud size={24} /> : <CloudOff size={24} />}
            </div>
            <div className="flex-1">
              <h3 className="font-bold">Cloud Sync</h3>
              <p className="text-xs text-[#A1A1A1]">
                {user 
                  ? `Syncing as ${user.email}` 
                  : 'Sign in to sync your wardrobe across all your devices.'}
              </p>
            </div>
          </div>

          {user ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-8 h-8 bg-[#1A1A1A] rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                      {user.email?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">{user.displayName || user.email}</p>
                    <p className="text-[10px] text-[#A1A1A1] uppercase tracking-widest">Connected</p>
                  </div>
                </div>
                <button 
                  onClick={onLogout}
                  className="p-2 text-[#A1A1A1] hover:text-red-500 transition-colors"
                  title="Sign Out"
                >
                  <LogOut size={18} />
                </button>
              </div>
              
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-bold uppercase tracking-widest">
                <CheckCircle2 size={14} />
                Automatic Sync Enabled
                {isSyncing && <RefreshCw size={12} className="animate-spin ml-auto" />}
              </div>
            </div>
          ) : (
            <button 
              onClick={onLogin}
              className="w-full flex items-center justify-center gap-3 py-4 bg-[#1A1A1A] text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors"
            >
              <LogIn size={18} />
              Sign in with Google
            </button>
          )}
        </div>

        <div className="bg-white border border-[#E5E5E5] rounded-3xl p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-[#1A1A1A]">
              <Database size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold">Data Portability</h3>
              <p className="text-xs text-[#A1A1A1]">Export your wardrobe to another device or import existing data.</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-[#A1A1A1]">
              <span>Last Exported</span>
              <span>{lastExported ? new Date(lastExported).toLocaleString() : 'Never'}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={onExport}
                className="flex items-center justify-center gap-2 py-4 bg-[#1A1A1A] text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors"
              >
                <Download size={16} />
                Export JSON
              </button>
              <label className="flex items-center justify-center gap-2 py-4 bg-white border border-[#E5E5E5] text-[#1A1A1A] rounded-2xl text-xs font-bold uppercase tracking-widest hover:border-[#1A1A1A] cursor-pointer transition-all">
                <Upload size={16} />
                Import JSON
                <input type="file" accept=".json" onChange={onImport} className="hidden" />
              </label>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-100 rounded-3xl p-6 flex gap-4">
          <AlertTriangle className="text-orange-500 shrink-0" size={20} />
          <div className="space-y-1">
            <p className="text-sm font-bold text-orange-900">Warning</p>
            <p className="text-xs text-orange-700 leading-relaxed">Importing data will completely overwrite your current wardrobe, outfits, and events. This action cannot be undone.</p>
          </div>
        </div>

        <div className="bg-white border border-[#E5E5E5] rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500">
              <RotateCcw size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-red-600">Reset Application</h3>
              <p className="text-xs text-[#A1A1A1]">Clear all local data and restore to initial settings.</p>
            </div>
          </div>
          <button 
            onClick={onReset}
            className="w-full py-4 border-2 border-red-100 text-red-500 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-red-50 transition-colors"
          >
            Clear Cache & Reset
          </button>
        </div>
      </div>

      <div className="pt-8 border-t border-[#E5E5E5] text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1A1]">Wardrobe App v1.2.0</p>
      </div>
    </motion.div>
  );
}

function AddPieceModal({ piece, onClose, onAdd }: { piece?: Piece, onClose: () => void, onAdd: (p: Omit<Piece, 'id' | 'createdAt'>) => void }) {
  const [title, setTitle] = useState(piece?.title || '');
  const [type, setType] = useState<PieceType>(piece?.type || 'Top');
  const [category, setCategory] = useState<PieceCategory>(piece?.category || 'Other');
  const [color, setColor] = useState(piece?.color || '');
  const [hex, setHex] = useState(piece?.hex || '#000000');
  const [status, setStatus] = useState<PieceStatus>(piece?.status || 'Owned');

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="relative w-full max-w-md bg-white rounded-[40px] p-8 shadow-2xl space-y-8"
      >
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-medium serif italic">{piece ? 'Edit Piece' : 'New Piece'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A1A1A1]">Title</label>
            <input 
              className="w-full text-lg border-b border-[#E5E5E5] pb-2 outline-none focus:border-[#1A1A1A] transition-colors"
              placeholder="e.g. Navy Linen Shirt"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A1A1A1]">Type</label>
              <select 
                className="w-full bg-transparent border-b border-[#E5E5E5] pb-2 outline-none focus:border-[#1A1A1A] transition-colors appearance-none"
                value={type}
                onChange={e => setType(e.target.value as any)}
              >
                <option value="Top">Top</option>
                <option value="Bottom">Bottom</option>
                <option value="Outer">Outer</option>
                <option value="Shoes">Shoes</option>
                <option value="Accessory">Accessory</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A1A1A1]">Category</label>
              <select 
                className="w-full bg-transparent border-b border-[#E5E5E5] pb-2 outline-none focus:border-[#1A1A1A] transition-colors appearance-none"
                value={category}
                onChange={e => setCategory(e.target.value as any)}
              >
                <option value="Crew-neck">Crew-neck</option>
                <option value="Shirt (LS)">Shirt (LS)</option>
                <option value="Shirt (SS)">Shirt (SS)</option>
                <option value="Pants">Pants</option>
                <option value="Shorts">Shorts</option>
                <option value="Jacket">Jacket</option>
                <option value="Coat">Coat</option>
                <option value="Sneakers">Sneakers</option>
                <option value="Boots">Boots</option>
                <option value="Bag">Bag</option>
                <option value="Watch">Watch</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A1A1A1]">Status</label>
              <select 
                className="w-full bg-transparent border-b border-[#E5E5E5] pb-2 outline-none focus:border-[#1A1A1A] transition-colors appearance-none"
                value={status}
                onChange={e => setStatus(e.target.value as any)}
              >
                <option value="Owned">Owned</option>
                <option value="Wishlist">Wishlist</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A1A1A1]">Color</label>
            <div className="flex gap-4 items-center">
              <input 
                type="color" 
                className="w-12 h-12 rounded-full border-none cursor-pointer overflow-hidden"
                value={hex}
                onChange={e => setHex(e.target.value)}
              />
              <input 
                className="flex-1 border-b border-[#E5E5E5] pb-2 outline-none focus:border-[#1A1A1A] transition-colors"
                placeholder="e.g. Navy Blue"
                value={color}
                onChange={e => setColor(e.target.value)}
              />
            </div>
          </div>
        </div>

        <button 
          onClick={() => onAdd({ title, type, category, color, hex, status })}
          disabled={!title || !color}
          className="w-full bg-[#1A1A1A] text-white py-4 rounded-2xl font-bold uppercase tracking-widest disabled:opacity-50 transition-opacity"
        >
          {piece ? 'Save Changes' : 'Add to Closet'}
        </button>
      </motion.div>
    </div>
  );
}

function PieceModal({ piece, outfits, onClose, onEdit, onDelete, onBuildOutfit }: { piece: Piece, outfits: Outfit[], onClose: () => void, onEdit: (p: Piece) => void, onDelete: (id: string) => void, onBuildOutfit: (id: string) => void }) {
  const compatibleOutfits = outfits.filter(o => o.bottomId === piece.id || o.topId === piece.id || o.outerId === piece.id);

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="relative w-full max-w-md bg-white rounded-[40px] overflow-hidden shadow-2xl"
      >
        <div className="p-8 space-y-8">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A1A1A1]">{piece.type}</span>
              <h2 className="text-2xl font-medium serif italic leading-tight">{piece.title}</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full border-4 border-gray-50 shadow-inner flex items-center justify-center overflow-hidden" style={{ backgroundColor: piece.hex }}>
              <PieceIcon category={piece.category} color={piece.hex} size={32} className="opacity-50" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: piece.hex }} />
                <span className="text-sm font-medium">{piece.color}</span>
              </div>
              <span className={`inline-block text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider ${piece.status === 'Owned' ? 'bg-gray-100 text-gray-600' : 'bg-orange-100 text-orange-600'}`}>
                {piece.status}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A1A1A1]">Compatible Outfits ({compatibleOutfits.length})</h3>
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              {compatibleOutfits.map(o => (
                <div key={o.id} className="flex-shrink-0 w-12 h-12 rounded-full border-2 border-white bg-gray-50 shadow-sm flex items-center justify-center text-[10px] font-bold">
                  {o.rating}
                </div>
              ))}
              {compatibleOutfits.length === 0 && <p className="text-xs text-[#A1A1A1] italic">No outfits found.</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => onBuildOutfit(piece.id)}
              className="flex items-center justify-center gap-2 bg-[#1A1A1A] text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px]"
            >
              <ArrowRightLeft size={14} /> Build Outfit
            </button>
            <button 
              onClick={() => onEdit(piece)}
              className="flex items-center justify-center gap-2 bg-gray-100 text-[#1A1A1A] py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px]"
            >
              <Edit2 size={14} /> Edit Piece
            </button>
            <button 
              onClick={() => onDelete(piece.id)}
              className="col-span-2 flex items-center justify-center gap-2 text-red-500 py-2 font-bold uppercase tracking-widest text-[10px]"
            >
              <Trash2 size={14} /> Delete Piece
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function OutfitModal({ outfit, pieces, onClose, onUpdateRating, onUpdateNotes }: { outfit: Outfit, pieces: Piece[], onClose: () => void, onUpdateRating: (id: string, rating: number) => void, onUpdateNotes: (id: string, notes: string) => void }) {
  const getPiece = (id: string) => pieces.find(p => p.id === id);
  const top = getPiece(outfit.topId);
  const bottom = getPiece(outfit.bottomId);
  const outer = outfit.outerId ? getPiece(outfit.outerId) : null;
  const accessory = outfit.accessoryId ? getPiece(outfit.accessoryId) : null;
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState(outfit.notes || '');

  const outfitTitle = `${top?.title || 'Top'} + ${bottom?.title || 'Bottom'}${outer ? ` + ${outer.title}` : ''}${accessory ? ` + ${accessory.title}` : ''}`;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="relative w-full max-w-md bg-white rounded-[40px] overflow-hidden shadow-2xl"
      >
        <div className="p-8 space-y-8">
          <div className="flex justify-between items-start">
            <div className="space-y-1 flex-1 pr-4">
              <div className="flex items-center gap-2">
                <Star size={14} className="fill-[#1A1A1A] text-[#1A1A1A]" />
                <span className="text-sm font-bold">{outfit.rating}/10</span>
              </div>
              <h2 className="text-xl font-medium serif italic leading-tight">{outfitTitle}</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="flex justify-center py-4">
            <div className="flex -space-x-6">
              <div className="w-24 h-24 rounded-full border-4 border-white bg-gray-50 shadow-lg flex items-center justify-center overflow-hidden">
                <PieceIcon category={top?.category || 'Other'} color={top?.hex} size={12} />
              </div>
              <div className="w-24 h-24 rounded-full border-4 border-white bg-gray-50 shadow-lg flex items-center justify-center overflow-hidden">
                <PieceIcon category={bottom?.category || 'Other'} color={bottom?.hex} size={12} />
              </div>
              {outer && (
                <div className="w-24 h-24 rounded-full border-4 border-white bg-gray-50 shadow-lg flex items-center justify-center overflow-hidden">
                  <PieceIcon category={outer?.category || 'Other'} color={outer?.hex} size={12} />
                </div>
              )}
              {accessory && (
                <div className="w-24 h-24 rounded-full border-4 border-white bg-gray-50 shadow-lg flex items-center justify-center overflow-hidden">
                  <PieceIcon category={accessory?.category || 'Other'} color={accessory?.hex} size={12} />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1A1]">Weather</span>
                <div className="flex items-center gap-2">
                  {outfit.weather === 'Warm' && <ThermometerSun size={16} />}
                  {outfit.weather === 'Cool' && <CloudSun size={16} />}
                  {outfit.weather === 'Cold' && <ThermometerSnowflake size={16} />}
                  <span className="text-sm font-medium">{outfit.weather}</span>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1A1]">Occasion</span>
                <div className="flex flex-wrap gap-1">
                  {outfit.occasion?.map(occ => (
                    <span key={occ} className="text-[9px] font-bold uppercase bg-gray-100 px-2 py-0.5 rounded-full">{occ}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1A1]">Notes</span>
                <button 
                  onClick={() => {
                    if (isEditingNotes) {
                      onUpdateNotes(outfit.id, notes);
                    }
                    setIsEditingNotes(!isEditingNotes);
                  }}
                  className="text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A] underline underline-offset-4"
                >
                  {isEditingNotes ? 'Save' : 'Edit'}
                </button>
              </div>
              {isEditingNotes ? (
                <textarea 
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-gray-50 rounded-xl p-3 text-sm outline-none focus:ring-2 ring-[#1A1A1A]/5 transition-all min-h-[80px]"
                  placeholder="Add styling notes..."
                />
              ) : (
                <p className="text-sm text-[#555] italic leading-relaxed">
                  {outfit.notes ? `"${outfit.notes}"` : 'No notes added.'}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1A1]">Update Rating</span>
              <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl">
                {[...Array(10)].map((_, i) => (
                  <button 
                    key={i} 
                    onClick={() => onUpdateRating(outfit.id, i + 1)}
                    className="p-1 transition-transform hover:scale-125"
                  >
                    <Star 
                      size={18} 
                      className={i < outfit.rating ? 'fill-[#1A1A1A] text-[#1A1A1A]' : 'text-[#D1D1D1]'} 
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function AddOutfitModal({ topId, bottomId, outerId, accessoryId, onClose, onSave }: { topId: string, bottomId: string, outerId: string, accessoryId: string, onClose: () => void, onSave: (o: Omit<Outfit, 'id'>) => void }) {
  const [weather, setWeather] = useState<Weather>('Cool');
  const [rating, setRating] = useState(7);
  const [occasions, setOccasions] = useState<string[]>(['Casual']);
  const [notes, setNotes] = useState('');

  const availableOccasions = ['Casual', 'Smart Casual', 'Formal', 'Work', 'Night Out', 'Sport'];

  const toggleOccasion = (occ: string) => {
    if (occasions.includes(occ)) {
      setOccasions(occasions.filter(o => o !== occ));
    } else {
      setOccasions([...occasions, occ]);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="relative w-full max-w-md bg-white rounded-[40px] p-8 shadow-2xl space-y-8"
      >
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-medium serif italic">Save Outfit</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1A1]">Weather</label>
            <div className="flex gap-2">
              {(['Warm', 'Cool', 'Cold'] as Weather[]).map(w => (
                <button
                  key={w}
                  onClick={() => setWeather(w)}
                  className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                    weather === w ? 'bg-[#1A1A1A] text-white shadow-lg' : 'bg-gray-50 text-[#A1A1A1]'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1A1]">Occasion</label>
            <div className="flex flex-wrap gap-2">
              {availableOccasions.map(occ => (
                <button
                  key={occ}
                  onClick={() => toggleOccasion(occ)}
                  className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                    occasions.includes(occ) ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-gray-50 text-[#A1A1A1] border-transparent'
                  } border`}
                >
                  {occ}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1A1]">Notes</label>
            <textarea 
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-gray-50 rounded-2xl p-4 text-sm outline-none focus:ring-2 ring-[#1A1A1A]/5 transition-all min-h-[100px]"
              placeholder="Any styling tips or reminders?"
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1A1]">Initial Rating</label>
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl">
              {[...Array(10)].map((_, i) => (
                <button 
                  key={i} 
                  onClick={() => setRating(i + 1)}
                  className="p-1 transition-transform hover:scale-125"
                >
                  <Star 
                    size={18} 
                    className={i < rating ? 'fill-[#1A1A1A] text-[#1A1A1A]' : 'text-[#D1D1D1]'} 
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        <button 
          onClick={() => onSave({ topId, bottomId, outerId, accessoryId, weather, occasion: occasions, rating, notes })}
          className="w-full bg-[#1A1A1A] text-white py-4 rounded-2xl font-bold uppercase tracking-widest hover:bg-black transition-colors"
        >
          Save Outfit
        </button>
      </motion.div>
    </div>
  );
}
function PackingModal({ pieceId, events, onClose, onTogglePacked }: { pieceId: string, events: Event[], onClose: () => void, onTogglePacked: (eid: string, pid: string) => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="relative w-full max-w-md bg-white rounded-[40px] p-8 shadow-2xl space-y-6"
      >
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-medium serif italic">Pack for Event</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-3">
          {events.length > 0 ? events.map((event) => {
            const isPacked = event.packedPieceIds.includes(pieceId);
            return (
              <button
                key={event.id}
                onClick={() => onTogglePacked(event.id, pieceId)}
                className={`w-full flex items-center justify-between p-5 rounded-3xl border-2 transition-all ${
                  isPacked ? 'border-[#1A1A1A] bg-gray-50' : 'border-[#F5F5F5] bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Calendar size={18} className={isPacked ? 'text-[#1A1A1A]' : 'text-[#A1A1A1]'} />
                  <span className={`font-medium ${isPacked ? 'text-[#1A1A1A]' : 'text-[#A1A1A1]'}`}>{event.name}</span>
                </div>
                {isPacked ? <CheckCircle2 size={20} className="text-green-600" /> : <div className="w-5 h-5 rounded-full border-2 border-[#E5E5E5]" />}
              </button>
            );
          }) : (
            <div className="py-8 text-center">
              <p className="text-sm text-[#A1A1A1]">No events created yet.</p>
            </div>
          )}
        </div>

        <button 
          onClick={onClose}
          className="w-full bg-[#1A1A1A] text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-xs"
        >
          Done
        </button>
      </motion.div>
    </div>
  );
}
