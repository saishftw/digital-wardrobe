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
  Circle
} from 'lucide-react';
import { 
  Piece, 
  Outfit, 
  Event, 
  PieceType, 
  PieceStatus, 
  PieceCategory, 
  Weather 
} from './types';
import { storageService } from './storageService';
import { 
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
  
  // Modals & Selection State
  const [showAddPiece, setShowAddPiece] = useState(false);
  const [editingPiece, setEditingPiece] = useState<Piece | null>(null);
  const [viewingPiece, setViewingPiece] = useState<Piece | null>(null);
  const [viewingOutfit, setViewingOutfit] = useState<Outfit | null>(null);
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
  const [selectedPieceId2, setSelectedPieceId2] = useState<string | null>(null); // Multi-piece selection
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [packingPieceId, setPackingPieceId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'piece' | 'event', id: string } | null>(null);
  const [confirmImport, setConfirmImport] = useState<string | null>(null);
  const [showAddOutfit, setShowAddOutfit] = useState(false);

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
    const newOutfit: Outfit = {
      ...outfit,
      id: `o${Date.now()}`
    };
    setOutfits([...outfits, newOutfit]);
  };

  const addEvent = (name: string) => {
    const newEvent: Event = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      packedPieceIds: [],
      outfits: []
    };
    setEvents([...events, newEvent]);
  };

  const deleteEvent = (id: string) => {
    setEvents(events.filter(e => e.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-[#1A1A1A] font-sans selection:bg-[#1A1A1A] selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-[#E5E5E5] px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold tracking-tight italic serif">Wardrobe</h1>
        <div className="flex items-center gap-3">
          {view === 'Wardrobe' && (
            <button 
              onClick={() => setShowAddPiece(true)}
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
              onAddOutfit={() => setShowAddOutfit(true)}
            />
          )}
          {view === 'Events' && (
            <EventsView 
              events={events}
              pieces={pieces}
              outfits={outfits}
              activeEventId={activeEventId}
              onSetActiveEvent={setActiveEventId}
              onAddEvent={addEvent}
              onDeleteEvent={deleteEvent}
              onTogglePacked={togglePacked}
              onToggleWorn={toggleWorn}
              onAddOutfit={addOutfitToEvent}
              onRemoveOutfit={removeOutfitFromEvent}
            />
          )}
          {view === 'Settings' && (
            <SettingsView 
              lastExported={lastExported}
              onExport={handleExport}
              onImport={handleImport}
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

function OutfitsView({ outfits, pieces, onViewOutfit }: { outfits: Outfit[], pieces: Piece[], onViewOutfit: (o: Outfit) => void }) {
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
          <button 
            onClick={() => setOwnedOnly(!ownedOnly)}
            className={`ml-4 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${
              ownedOnly ? 'bg-green-50 text-green-700 border-green-200' : 'bg-white text-[#A1A1A1] border-[#E5E5E5]'
            }`}
          >
            {ownedOnly ? 'Owned Only' : 'Show All'}
          </button>
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

          const missingCount = [top, bottom, outer].filter(p => p && p.status === 'Wishlist').length;

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
                    <PieceIcon category={outer?.category || 'Other'} color={outer?.hex} size={14} className="border-4 border-white shadow-md group-hover:scale-105 transition-transform delay-150" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-snug mb-2">
                    {top?.title} + {bottom?.title} {outer ? `+ ${outer.title}` : ''}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {outfit.occasion.map(occ => (
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

function BuilderView({ pieces, outfits, selectedPieceId, selectedPieceId2, onSelectPiece, onSelectPiece2, onViewOutfit, onAddOutfit }: { pieces: Piece[], outfits: Outfit[], selectedPieceId: string | null, selectedPieceId2: string | null, onSelectPiece: (id: string | null) => void, onSelectPiece2: (id: string | null) => void, onViewOutfit: (o: Outfit) => void, onAddOutfit: () => void }) {
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
  pieces, 
  outfits,
  activeEventId, 
  onSetActiveEvent, 
  onAddEvent, 
  onDeleteEvent, 
  onTogglePacked,
  onToggleWorn,
  onAddOutfit,
  onRemoveOutfit
}: { 
  events: Event[], 
  pieces: Piece[], 
  outfits: Outfit[],
  activeEventId: string | null, 
  onSetActiveEvent: (id: string | null) => void, 
  onAddEvent: (name: string) => void, 
  onDeleteEvent: (id: string) => void, 
  onTogglePacked: (eid: string, pid: string) => void,
  onToggleWorn: (eid: string, oid: string) => void,
  onAddOutfit: (eid: string, oid: string) => void,
  onRemoveOutfit: (eid: string, oid: string) => void
}) {
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEventName, setNewEventName] = useState('');

  const ownedPieces = pieces.filter(p => p.status === 'Owned');

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
        {events.map((event) => {
          const progress = ownedPieces.length > 0 ? Math.round((event.packedPieceIds.length / ownedPieces.length) * 100) : 0;
          
          return (
            <div 
              key={event.id}
              className="bg-white border border-[#E5E5E5] rounded-3xl overflow-hidden transition-all"
            >
              <div 
                onClick={() => onSetActiveEvent(activeEventId === event.id ? null : event.id)}
                className="p-6 cursor-pointer flex justify-between items-center"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold">{event.name}</h3>
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                      {event.packedPieceIds.length} items
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden max-w-[120px]">
                      <div className="h-full bg-[#1A1A1A] transition-all duration-500" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1A1]">{progress}% Packed</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteEvent(event.id); }}
                    className="p-2 text-[#A1A1A1] hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                  <ChevronDown 
                    size={20} 
                    className={`text-[#A1A1A1] transition-transform duration-300 ${activeEventId === event.id ? 'rotate-180' : ''}`} 
                  />
                </div>
              </div>

              <AnimatePresence>
                {activeEventId === event.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-[#F5F5F5] bg-gray-50/30"
                  >
                    <div className="p-6 space-y-8">
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1A1]">Packed Items</h4>
                        {event.packedPieceIds.length > 0 ? (
                          <div className="grid grid-cols-2 gap-3">
                            {event.packedPieceIds.map(pid => {
                              const piece = pieces.find(p => p.id === pid);
                              if (!piece) return null;
                              return (
                                <div key={pid} className="flex items-center gap-3 p-3 bg-white border border-[#E5E5E5] rounded-2xl">
                                  <PieceIcon category={piece.category} color={piece.hex} size={8} />
                                  <span className="text-xs font-medium truncate flex-1">{piece.title}</span>
                                  <button 
                                    onClick={() => onTogglePacked(event.id, pid)}
                                    className="text-red-500 hover:bg-red-50 p-1 rounded-lg transition-colors"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-[#A1A1A1] italic">No items packed yet. Add them from the closet.</p>
                        )}
                      </div>

                      {/* Event Outfits Section */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1A1]">Event Outfits</h4>
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                            {(event.outfits || []).filter(o => o.isWorn).length} / {(event.outfits || []).length} Worn
                          </span>
                        </div>
                        
                        {(event.outfits || []).length > 0 ? (
                          <div className="space-y-3">
                            {(event.outfits || []).map(eo => {
                              const outfit = outfits.find(o => o.id === eo.outfitId);
                              if (!outfit) return null;
                              const top = pieces.find(p => p.id === outfit.topId);
                              const bottom = pieces.find(p => p.id === outfit.bottomId);
                              return (
                                <div key={eo.outfitId} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${eo.isWorn ? 'bg-gray-50 border-transparent opacity-60' : 'bg-white border-[#E5E5E5]'}`}>
                                  <div className="flex items-center gap-3">
                                    <div className="flex -space-x-2">
                                      <PieceIcon category={top?.category || 'Other'} color={top?.hex} size={6} />
                                      <PieceIcon category={bottom?.category || 'Other'} color={bottom?.hex} size={6} />
                                    </div>
                                    <div className="space-y-0.5">
                                      <p className="text-xs font-bold">{top?.title} + {bottom?.title}</p>
                                      <p className="text-[10px] text-[#A1A1A1] uppercase tracking-wider">{outfit.occasion.join(', ')}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button 
                                      onClick={() => onToggleWorn(event.id, eo.outfitId)}
                                      className={`p-2 rounded-xl transition-all ${eo.isWorn ? 'bg-green-500 text-white' : 'bg-gray-100 text-[#A1A1A1] hover:bg-gray-200'}`}
                                    >
                                      <CheckCircle2 size={16} />
                                    </button>
                                    <button 
                                      onClick={() => onRemoveOutfit(event.id, eo.outfitId)}
                                      className="p-2 text-[#A1A1A1] hover:text-red-500"
                                    >
                                      <X size={16} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-[#A1A1A1] italic">No outfits added to this event yet.</p>
                        )}
                      </div>

                      {/* Compatible Outfits Section */}
                      {(() => {
                        const compatibleOutfits = outfits.filter(outfit => {
                          const hasBottom = event.packedPieceIds.includes(outfit.bottomId);
                          const hasTop = event.packedPieceIds.includes(outfit.topId);
                          const hasOuter = !outfit.outerId || event.packedPieceIds.includes(outfit.outerId);
                          const isAlreadyAdded = (event.outfits || []).some(eo => eo.outfitId === outfit.id);
                          return hasBottom && hasTop && hasOuter && !isAlreadyAdded;
                        });

                        if (compatibleOutfits.length === 0) return null;

                        return (
                          <div className="space-y-4 pt-4 border-t border-[#F5F5F5]">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1A1]">Compatible Outfits (from packed items)</h4>
                            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                              {compatibleOutfits.map(outfit => {
                                const top = pieces.find(p => p.id === outfit.topId);
                                const bottom = pieces.find(p => p.id === outfit.bottomId);
                                return (
                                  <button 
                                    key={outfit.id}
                                    onClick={() => onAddOutfit(event.id, outfit.id)}
                                    className="flex-shrink-0 w-40 p-3 bg-white border border-[#E5E5E5] rounded-2xl text-left space-y-3 hover:border-[#1A1A1A] transition-all group"
                                  >
                                    <div className="flex -space-x-2">
                                      <PieceIcon category={top?.category || 'Other'} color={top?.hex} size={8} />
                                      <PieceIcon category={bottom?.category || 'Other'} color={bottom?.hex} size={8} />
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-[10px] font-bold line-clamp-1">{top?.title} + {bottom?.title}</p>
                                      <div className="flex items-center justify-between">
                                        <span className="text-[9px] text-[#A1A1A1] uppercase tracking-wider">{outfit.weather}</span>
                                        <Plus size={12} className="text-[#1A1A1A] opacity-0 group-hover:opacity-100 transition-opacity" />
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}

                      <div className="pt-4 border-t border-[#E5E5E5] flex justify-between items-center">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1A1]">
                          {ownedPieces.length - event.packedPieceIds.length} items remaining in closet
                        </div>
                        <button 
                          onClick={() => onSetActiveEvent(null)}
                          className="text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A] underline underline-offset-4"
                        >
                          Close Details
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {events.length === 0 && (
        <div className="py-20 text-center space-y-4">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-[#A1A1A1]">
            <Map size={24} strokeWidth={1.5} />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">No events planned</p>
            <p className="text-xs text-[#A1A1A1]">Create an event to start packing your wardrobe.</p>
          </div>
          <button 
            onClick={() => setShowAddEvent(true)}
            className="text-xs font-bold uppercase tracking-widest text-[#1A1A1A] underline underline-offset-4"
          >
            Add your first event
          </button>
        </div>
      )}

      {showAddEvent && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[32px] p-8 w-full max-w-sm shadow-2xl space-y-6"
          >
            <div className="space-y-2">
              <h3 className="text-xl font-bold">New Event</h3>
              <p className="text-sm text-[#A1A1A1]">What's the occasion?</p>
            </div>
            <input 
              autoFocus
              type="text"
              placeholder="e.g. Paris Fashion Week"
              value={newEventName}
              onChange={(e) => setNewEventName(e.target.value)}
              className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 ring-[#1A1A1A]/5 transition-all"
            />
            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => { setShowAddEvent(false); setNewEventName(''); }}
                className="flex-1 py-4 text-sm font-bold uppercase tracking-widest text-[#A1A1A1] hover:text-[#1A1A1A] transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  if (newEventName.trim()) {
                    onAddEvent(newEventName);
                    setNewEventName('');
                    setShowAddEvent(false);
                  }
                }}
                className="flex-1 py-4 bg-[#1A1A1A] text-white rounded-2xl text-sm font-bold uppercase tracking-widest hover:bg-black transition-colors"
              >
                Create
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

function SettingsView({ lastExported, onExport, onImport }: { lastExported: number | null, onExport: () => void, onImport: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
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
            <div className="w-24 h-24 rounded-full border-4 border-gray-50 shadow-inner" style={{ backgroundColor: piece.hex }} />
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
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState(outfit.notes || '');

  const outfitTitle = `${top?.title || 'Top'} + ${bottom?.title || 'Bottom'}${outer ? ` + ${outer.title}` : ''}`;

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
                  {outfit.occasion.map(occ => (
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

function AddOutfitModal({ topId, bottomId, outerId, onClose, onSave }: { topId: string, bottomId: string, outerId: string, onClose: () => void, onSave: (o: Omit<Outfit, 'id'>) => void }) {
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
          onClick={() => onSave({ topId, bottomId, outerId, weather, occasion: occasions, rating, notes })}
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
