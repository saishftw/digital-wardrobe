import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UserProfile, 
  Piece, 
  Outfit, 
  Event, 
  Weather, 
  AIStylistResponse, 
  AIOutfitRecommendation, 
  AIMissingItemRecommendation 
} from '../types';
import { 
  Sparkles, 
  X, 
  Check, 
  ShoppingBag, 
  Plus, 
  AlertCircle, 
  RefreshCw, 
  Info, 
  Star, 
  ChevronRight,
  Palette,
  Calendar,
  Layers,
  CheckCircle2,
  HelpCircle,
  Wind,
  Shirt
} from 'lucide-react';
import { 
  CrewNeckIcon, 
  FullSleeveIcon, 
  HalfSleeveIcon, 
  TrousersIcon, 
  ShortsIcon, 
  ShoesIcon, 
  OtherIcon 
} from '../constants';

interface AIStylistModalProps {
  userProfile: UserProfile;
  ownedPieces: Piece[];
  wishlistPieces: Piece[];
  existingOutfits: Outfit[];
  event?: Event;
  sourceTab?: string;
  onClose: () => void;
  onSaveOutfit: (outfit: Omit<Outfit, 'id'>) => void;
  onAddToWishlist: (piece: Omit<Piece, 'id' | 'createdAt'>) => void;
  onAssignOutfitToEventDay?: (eventId: string, date: string, outfitId: string) => void;
}

const CATEGORY_ICONS: Record<string, any> = {
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
  'Watch': OtherIcon,
  'Other': OtherIcon
};

function PieceIconSmall({ category, color }: { category?: string, color?: string }) {
  const Icon = CATEGORY_ICONS[category || 'Other'] || OtherIcon;
  return (
    <div 
      className="w-8 h-8 rounded-full flex items-center justify-center border border-[#E5E5E5] shadow-sm text-white"
      style={{ backgroundColor: color || '#222' }}
    >
      <Icon size={14} className="mix-blend-difference" />
    </div>
  );
}

export function AIStylistModal({
  userProfile,
  ownedPieces,
  wishlistPieces,
  existingOutfits,
  event,
  sourceTab,
  onClose,
  onSaveOutfit,
  onAddToWishlist,
  onAssignOutfitToEventDay
}: AIStylistModalProps) {
  const [eventName, setEventName] = useState(event?.name || '');
  const [eventDescription, setEventDescription] = useState(event?.description || '');
  const [weather, setWeather] = useState<Weather>('Cool');
  
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<AIStylistResponse | null>(null);

  const [savedOutfitsMap, setSavedOutfitsMap] = useState<Record<number, boolean>>({});
  const [addedWishlistMap, setAddedWishlistMap] = useState<Record<number, boolean>>({});
  const [selectedEventDate, setSelectedEventDate] = useState<string>('');

  const loadingMessages = [
    'Evaluating skin undertones & color contrast...',
    'Analyzing midsection fit & flat-front trouser rules...',
    'Matching face structure to open collar stances...',
    'Calculating height proportions (181cm) & vertical drape...',
    'Scanning wardrobe for high-suitability combinations...',
    'Formulating missing piece suggestions...'
  ];

  const handleGenerate = async () => {
    if (ownedPieces.length === 0) {
      setError('Please add at least one owned piece to your closet first.');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);
    setLoadingStep(0);

    const stepInterval = setInterval(() => {
      setLoadingStep(prev => (prev + 1) % loadingMessages.length);
    }, 1200);

    try {
      const payload = {
        userProfile,
        sourceTab,
        event: eventName ? {
          name: eventName,
          description: eventDescription,
          startDate: event?.startDate,
          endDate: event?.endDate,
          location: event?.location
        } : undefined,
        weather,
        ownedPieces,
        wishlistPieces,
        existingOutfits
      };

      const res = await fetch('/api/ai-stylist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate AI styling suggestions.');
      }

      const data: AIStylistResponse = await res.json();
      setResults(data);
    } catch (err: any) {
      console.error('AI Stylist Error:', err);
      setError(err?.message || 'An unexpected error occurred while communicating with AI.');
    } finally {
      clearInterval(stepInterval);
      setLoading(false);
    }
  };

  const handleSaveRecommendedOutfit = (rec: AIOutfitRecommendation, index: number) => {
    onSaveOutfit({
      topId: rec.topId,
      bottomId: rec.bottomId,
      midLayerId: rec.midLayerId,
      outerId: rec.outerId,
      accessoryId: rec.accessoryId,
      rating: rec.suitabilityScore || 9,
      occasion: rec.occasion || ['AI Recommendation'],
      weather: rec.weather || weather,
      notes: `${rec.rationale} | Tips: ${rec.stylingTips}`
    });

    setSavedOutfitsMap(prev => ({ ...prev, [index]: true }));
  };

  const handleAddRecommendedWishlist = (rec: AIMissingItemRecommendation, index: number) => {
    onAddToWishlist({
      title: rec.title,
      type: rec.type || 'Top',
      category: (rec.category as any) || 'Other',
      color: rec.color || 'Custom',
      hex: rec.hex || '#333333',
      status: 'Wishlist'
    });

    setAddedWishlistMap(prev => ({ ...prev, [index]: true }));
  };

  const getPiece = (id?: string) => ownedPieces.find(p => p.id === id);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md overflow-y-auto">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-2xl bg-white rounded-[36px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white p-6 sm:p-8 flex justify-between items-center relative border-b border-indigo-800/40">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-indigo-300">
              <Sparkles size={18} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Personal AI Sartorial Stylist</span>
              {sourceTab && (
                <span className="text-[9px] font-semibold bg-indigo-800/60 text-indigo-200 px-2 py-0.5 rounded-full border border-indigo-700/50">
                  {sourceTab} Context
                </span>
              )}
            </div>
            <h2 className="text-2xl font-semibold serif italic">
              {event ? `Style for ${event.name}` : `AI Outfit & Wardrobe (${sourceTab || 'General'})`}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
          {/* User Profile Bar */}
          <div className="bg-gray-50 border border-[#E5E5E5] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <Palette size={16} className="text-[#1A1A1A]" />
              <span className="font-bold text-[#1A1A1A]">{userProfile.skinTone} ({userProfile.undertone})</span>
              <span className="text-gray-300">·</span>
              <span>{userProfile.faceShape} Face</span>
              <span className="text-gray-300">·</span>
              <span>{userProfile.height}</span>
              <span className="text-gray-300">·</span>
              <span className="font-semibold text-indigo-950 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">{userProfile.bodyType}</span>
            </div>
            <span className="text-[10px] uppercase font-bold text-indigo-900 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
              Matched Traits
            </span>
          </div>

          {/* Setup Form if no results yet */}
          {!results && !loading && (
            <div className="space-y-5">
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1A1]">Event Name or Dressing Occasion</label>
                <input 
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="e.g. Sunset Dinner in Kyoto, Tech Conference, Casual Weekend"
                  className="w-full bg-white border border-[#E5E5E5] rounded-2xl p-3.5 text-sm outline-none focus:border-[#1A1A1A] transition-colors"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1A1]">Event Context / Style Vibe (Optional)</label>
                <textarea 
                  rows={2}
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  placeholder="e.g. Smart-casual rooftop cocktails, warm breeze, outdoor photos..."
                  className="w-full bg-white border border-[#E5E5E5] rounded-2xl p-3.5 text-sm outline-none focus:border-[#1A1A1A] transition-colors"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1A1]">Target Weather</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['Warm', 'Cool', 'Cold'] as Weather[]).map(w => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setWeather(w)}
                      className={`py-3 rounded-2xl text-xs font-bold uppercase tracking-wider border transition-all ${
                        weather === w ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' : 'bg-white text-gray-700 border-[#E5E5E5] hover:border-gray-400'
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-2xl text-xs flex items-center gap-2 border border-red-200">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <button 
                onClick={handleGenerate}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-950/20"
              >
                <Sparkles size={18} className="text-indigo-200" />
                Generate Outfits & Buy Suggestions
              </button>
            </div>
          )}

          {/* Loading Animation State */}
          {loading && (
            <div className="py-16 text-center space-y-6">
              <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                <Sparkles size={28} className="text-indigo-600 animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold serif italic">Styling with Gemini AI</h3>
                <p className="text-xs text-[#A1A1A1] font-medium animate-bounce">
                  {loadingMessages[loadingStep]}
                </p>
              </div>
            </div>
          )}

          {/* AI Results Section */}
          {results && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Summary & Physical Trait Analysis */}
              <div className="bg-indigo-50/80 border border-indigo-200/80 rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-950 font-bold text-sm">
                    <Sparkles size={16} className="text-indigo-600" />
                    <span>Stylist Overview & Trait Match ({sourceTab || 'General'})</span>
                  </div>
                  <button 
                    onClick={handleGenerate}
                    className="text-[10px] font-bold uppercase tracking-widest text-indigo-900 underline flex items-center gap-1 hover:opacity-75"
                  >
                    <RefreshCw size={12} /> Regenerate
                  </button>
                </div>
                <p className="text-xs text-indigo-950 font-medium leading-relaxed">
                  {results.summary}
                </p>
                <div className="pt-2 border-t border-indigo-200/60">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-800 mb-1">
                    Physical Trait Rationale
                  </p>
                  <p className="text-xs text-indigo-900 leading-relaxed italic">
                    {results.traitAnalysis}
                  </p>
                </div>
              </div>

              {/* Recommended Outfits */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#1A1A1A] flex items-center gap-2">
                  <Shirt size={16} />
                  Recommended Outfits from Your Wardrobe ({results.outfitRecommendations.length})
                </h3>

                <div className="space-y-4">
                  {results.outfitRecommendations.map((rec, index) => {
                    const top = getPiece(rec.topId);
                    const bottom = getPiece(rec.bottomId);
                    const mid = getPiece(rec.midLayerId);
                    const outer = getPiece(rec.outerId);
                    const acc = getPiece(rec.accessoryId);

                    const isSaved = savedOutfitsMap[index];

                    return (
                      <div 
                        key={index}
                        className="bg-white border border-[#E5E5E5] rounded-3xl p-6 space-y-4 hover:border-[#1A1A1A] transition-all shadow-sm"
                      >
                        <div className="flex justify-between items-center">
                          <h4 className="text-sm font-bold text-[#1A1A1A]">{rec.title}</h4>
                          <div className="flex items-center gap-1 bg-indigo-50 text-indigo-800 border border-indigo-100 px-2.5 py-1 rounded-full text-xs font-bold">
                            <Star size={12} className="fill-indigo-600 text-indigo-600" />
                            <span>{rec.suitabilityScore}/10 Match</span>
                          </div>
                        </div>

                        {/* Pieces Icons */}
                        <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl">
                          <div className="flex -space-x-2">
                            {top && <PieceIconSmall category={top.category} color={top.hex} />}
                            {bottom && <PieceIconSmall category={bottom.category} color={bottom.hex} />}
                            {mid && <PieceIconSmall category={mid.category} color={mid.hex} />}
                            {outer && <PieceIconSmall category={outer.category} color={outer.hex} />}
                            {acc && <PieceIconSmall category={acc.category} color={acc.hex} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">
                              {top?.title || 'Top'} + {bottom?.title || 'Bottom'} 
                              {mid ? ` + ${mid.title}` : ''}
                              {outer ? ` + ${outer.title}` : ''}
                            </p>
                          </div>
                        </div>

                        {/* Rationale & Tips */}
                        <div className="space-y-2 text-xs text-gray-700">
                          <p className="leading-relaxed"><strong className="text-[#1A1A1A]">Why it works:</strong> {rec.rationale}</p>
                          <p className="leading-relaxed bg-gray-50 p-2.5 rounded-xl text-gray-600"><strong className="text-[#1A1A1A]">Styling tip:</strong> {rec.stylingTips}</p>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                          <button
                            onClick={() => handleSaveRecommendedOutfit(rec, index)}
                            disabled={isSaved}
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                              isSaved ? 'bg-emerald-100 text-emerald-800' : 'bg-[#1A1A1A] text-white hover:bg-black'
                            }`}
                          >
                            {isSaved ? <Check size={14} /> : <Plus size={14} />}
                            {isSaved ? 'Saved to Wardrobe Outfits' : 'Save Outfit'}
                          </button>

                          {event && onAssignOutfitToEventDay && (
                            <div className="flex items-center gap-2 text-xs">
                              <select 
                                onChange={(e) => {
                                  if (e.target.value) {
                                    // Save outfit first if not saved
                                    onSaveOutfit({
                                      topId: rec.topId,
                                      bottomId: rec.bottomId,
                                      midLayerId: rec.midLayerId,
                                      outerId: rec.outerId,
                                      accessoryId: rec.accessoryId,
                                      rating: rec.suitabilityScore || 9,
                                      occasion: rec.occasion || [event.name],
                                      weather: rec.weather || weather
                                    });
                                    // Assign to event day
                                    onAssignOutfitToEventDay(event.id, e.target.value, `o_${Date.now()}`);
                                  }
                                }}
                                className="bg-gray-100 border border-gray-200 rounded-xl py-1.5 px-3 text-xs outline-none cursor-pointer"
                              >
                                <option value="">Assign to Event Date...</option>
                                {event.dayAssignments?.map(day => (
                                  <option key={day.date} value={day.date}>
                                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Missing Items Recommendations */}
              {results.missingItemRecommendations?.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#1A1A1A] flex items-center gap-2">
                    <ShoppingBag size={16} />
                    Suggested Missing Items to Buy ({results.missingItemRecommendations.length})
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {results.missingItemRecommendations.map((rec, index) => {
                      const isAdded = addedWishlistMap[index];

                      return (
                        <div 
                          key={index}
                          className="bg-white border border-[#E5E5E5] rounded-3xl p-5 flex flex-col justify-between space-y-3 hover:border-[#1A1A1A] transition-all"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-4 h-4 rounded-full border border-gray-300" 
                                  style={{ backgroundColor: rec.hex || '#333' }} 
                                />
                                <span className="text-xs font-bold text-[#1A1A1A]">{rec.title}</span>
                              </div>
                              <span className="text-[10px] uppercase font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                                {rec.type}
                              </span>
                            </div>

                            <p className="text-xs text-gray-600 leading-relaxed">
                              {rec.reasonToBuy}
                            </p>
                          </div>

                          <button 
                            onClick={() => handleAddRecommendedWishlist(rec, index)}
                            disabled={isAdded}
                            className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                              isAdded ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200'
                            }`}
                          >
                            {isAdded ? <Check size={14} /> : <Plus size={14} />}
                            {isAdded ? 'In Wishlist' : 'Add to Wishlist'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
