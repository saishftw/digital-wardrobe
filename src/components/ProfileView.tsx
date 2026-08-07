import React, { useState } from 'react';
import { motion } from 'motion/react';
import { UserProfile, Piece, Outfit, Event } from '../types';
import { 
  Sparkles, 
  User, 
  Palette, 
  Smile, 
  Ruler, 
  UserCheck, 
  Check, 
  Edit3, 
  Save, 
  Info,
  ChevronRight
} from 'lucide-react';

interface ProfileViewProps {
  profile: UserProfile;
  onSaveProfile: (profile: UserProfile) => void;
  onOpenAIStylist: (event?: Event) => void;
  piecesCount: number;
  outfitsCount: number;
}

const UNDERTONE_GUIDES: Record<string, { description: string; bestColors: string[]; avoidColors: string[] }> = {
  Warm: {
    description: 'Golden, peach, or yellow hue under skin. Looks stunning in earth tones, warm rust, forest green, cream, mustard, and gold.',
    bestColors: ['#013220', '#8B4513', '#A0522D', '#F5F5DC', '#800000', '#D4AF37'],
    avoidColors: ['#E0F7FA', '#B0BEC5']
  },
  Cool: {
    description: 'Pink, red, or bluish undertone. Flattered by slate blue, rich navy, emerald green, burgundy, lavender, and icy silver.',
    bestColors: ['#000044', '#708090', '#4A0E17', '#2E8B57', '#FFFFFF', '#1A1A1A'],
    avoidColors: ['#FFA500', '#FFD700']
  },
  Neutral: {
    description: 'Balanced blend of warm and cool tones. Extremely versatile; looks effortless in monochrome, olive, taupe, and navy.',
    bestColors: ['#000000', '#FFFFFF', '#708090', '#556B2F', '#483C32', '#968966'],
    avoidColors: ['#FF00FF']
  },
  Olive: {
    description: 'Greenish or greyish undertone common in Mediterranean, Latin, and South/East Asian complexions. Shines in jewel tones, muted rust, slate, and rich dark neutrals.',
    bestColors: ['#013220', '#800000', '#708090', '#968966', '#000000', '#F5F5DC'],
    avoidColors: ['#FFFF00', '#FF69B4']
  }
};

const FACE_SHAPE_TIPS: Record<string, string> = {
  Oval: 'Versatile face structure; pairs well with crew necks, camp collars, spread collars, and structured lapels.',
  Round: 'V-necks, open camp collars, button-down collars, and vertical plackets elongate facial symmetry and balance soft curves.',
  Square: 'Strong jawline benefited by softer necklines, unbuttoned camp collars, rounded crew-necks, and layered hoodies.',
  Heart: 'Crew-necks, structured jackets, and spread collars add balance near the lower face and jawline.',
  Diamond: 'Open collars, V-necks, and layered lapels soften sharp cheekbones and create visual balance.',
  Oblong: 'Wide crew necks, horizontal stripes, and lapel collars shorten vertical distance and add horizontal balance.'
};

const HEIGHT_TIPS: Record<string, string> = {
  Petite: 'Monochromatic outfits, fitted trousers, and cropped or mid-waist jackets elevate the visual line and elongate legs.',
  Average: 'Balanced proportions allow versatile layering, standard jacket lengths, and varied trouser breaks.',
  Tall: '181cm+ tall frame accommodates long coats, layered blazers, cuffed trousers, and bold color blocking without shortening line continuity.'
};

const AESTHETICS_LIST = [
  'Smart Casual', 'Minimalist', 'Old Money', 'Streetwear', 
  'Vintage / Retro', 'Athleisure', 'Preppy', 'Formal', 'Boho / Resort'
];

export function ProfileView({ profile, onSaveProfile, onOpenAIStylist, piecesCount, outfitsCount }: ProfileViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    onSaveProfile(formData);
    setIsEditing(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const toggleAesthetic = (tag: string) => {
    const current = formData.styleAesthetic || [];
    const updated = current.includes(tag) 
      ? current.filter(t => t !== tag) 
      : [...current, tag];
    setFormData({ ...formData, styleAesthetic: updated });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      {/* AI Stylist Hero Card */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-[32px] p-6 space-y-4 shadow-xl relative overflow-hidden border border-indigo-800/40">
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-300 border border-indigo-500/30">
              <Sparkles size={20} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">AI Sartorial Stylist Engine</span>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 bg-white/10 rounded-full text-indigo-200 border border-white/10">
            {piecesCount} Pieces · {outfitsCount} Combos
          </span>
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-bold serif italic">Styling Matched to Your Persona</h2>
          <p className="text-xs text-indigo-100/90 leading-relaxed">
            Your skin tone (<span className="text-white font-medium">{profile.skinTone}</span>, <span className="text-white font-medium">{profile.undertone} undertone</span>), face shape (<span className="text-white font-medium">{profile.faceShape}</span>), height (<span className="text-white font-medium">{profile.height}</span>), and build (<span className="text-white font-medium">{profile.bodyType}</span>) directly inform AI outfit generation and tummy-concealing, non-puffy waist fit rules.
          </p>
        </div>

        <button 
          onClick={() => onOpenAIStylist()}
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/50"
        >
          <Sparkles size={16} className="text-indigo-200" />
          Generate AI Outfits & Shopping List
        </button>
      </div>

      {/* Header with edit toggle */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold tracking-tight">Physical & Style Profile</h3>
          <p className="text-xs text-[#A1A1A1]">Configure traits used by AI to analyze color contrast & proportions</p>
        </div>
        <button 
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className={`px-4 py-2 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${
            isEditing 
              ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md' 
              : 'bg-white border border-[#E5E5E5] text-[#1A1A1A] hover:border-[#1A1A1A]'
          }`}
        >
          {isEditing ? <Save size={14} /> : <Edit3 size={14} />}
          {isEditing ? 'Save Profile' : 'Edit Profile'}
        </button>
      </div>

      {savedSuccess && (
        <motion.div 
          initial={{ opacity: 0, y: -5 }} 
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-emerald-50 text-emerald-800 rounded-2xl text-xs font-medium flex items-center gap-2 border border-emerald-200"
        >
          <Check size={16} className="text-emerald-600" />
          Style profile saved successfully! AI recommendations are now synced.
        </motion.div>
      )}

      {/* Profile Form / Cards */}
      <div className="space-y-4">
        {/* Skin Tone & Undertone */}
        <div className="bg-white border border-[#E5E5E5] rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-3 text-sm font-bold border-b border-[#F0F0F0] pb-3">
            <Palette size={18} className="text-[#1A1A1A]" />
            <span>Skin Tone & Color Undertone</span>
          </div>

          {isEditing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1A1]">Skin Complexion</label>
                <input 
                  type="text"
                  value={formData.skinTone}
                  onChange={(e) => setFormData({ ...formData, skinTone: e.target.value })}
                  placeholder="e.g. Fair Warm, Medium Olive, Deep Ebony"
                  className="w-full bg-gray-50 border border-[#E5E5E5] rounded-xl py-2.5 px-3 text-xs outline-none focus:border-[#1A1A1A]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1A1]">Undertone</label>
                <select 
                  value={formData.undertone}
                  onChange={(e) => setFormData({ ...formData, undertone: e.target.value as any })}
                  className="w-full bg-gray-50 border border-[#E5E5E5] rounded-xl py-2.5 px-3 text-xs outline-none focus:border-[#1A1A1A]"
                >
                  <option value="Warm">Warm (Yellow / Golden)</option>
                  <option value="Cool">Cool (Pink / Blue)</option>
                  <option value="Neutral">Neutral (Balanced)</option>
                  <option value="Olive">Olive (Green / Grey)</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{profile.skinTone} Complexion</p>
                  <span className="text-xs text-[#A1A1A1] font-medium">{profile.undertone} Undertone</span>
                </div>
                <div className="flex gap-1.5">
                  {UNDERTONE_GUIDES[profile.undertone]?.bestColors.map((hex, i) => (
                    <div 
                      key={i} 
                      className="w-5 h-5 rounded-full border border-black/10 shadow-sm"
                      style={{ backgroundColor: hex }}
                      title={`Recommended color for ${profile.undertone}`}
                    />
                  ))}
                </div>
              </div>

              <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-2xl leading-relaxed">
                <Info size={14} className="inline mr-1 text-[#1A1A1A]" />
                {UNDERTONE_GUIDES[profile.undertone]?.description}
              </p>
            </div>
          )}
        </div>

        {/* Face Structure & Necklines */}
        <div className="bg-white border border-[#E5E5E5] rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-3 text-sm font-bold border-b border-[#F0F0F0] pb-3">
            <Smile size={18} className="text-[#1A1A1A]" />
            <span>Face Structure & Necklines</span>
          </div>

          {isEditing ? (
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1A1]">Face Shape</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(['Oval', 'Round', 'Square', 'Heart', 'Diamond', 'Oblong'] as const).map(shape => (
                  <button
                    key={shape}
                    type="button"
                    onClick={() => setFormData({ ...formData, faceShape: shape })}
                    className={`p-2.5 rounded-xl border text-xs font-medium text-center transition-all ${
                      formData.faceShape === shape 
                        ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' 
                        : 'bg-gray-50 border-[#E5E5E5] text-[#1A1A1A] hover:bg-gray-100'
                    }`}
                  >
                    {shape}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold">{profile.faceShape} Face Shape</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-gray-100 rounded-md">
                  Optimal Necklines
                </span>
              </div>
              <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-2xl leading-relaxed">
                {FACE_SHAPE_TIPS[profile.faceShape] || FACE_SHAPE_TIPS['Oval']}
              </p>
            </div>
          )}
        </div>

        {/* Height, Proportions & Build */}
        <div className="bg-white border border-[#E5E5E5] rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-3 text-sm font-bold border-b border-[#F0F0F0] pb-3">
            <Ruler size={18} className="text-[#1A1A1A]" />
            <span>Height, Frame & Build</span>
          </div>

          {isEditing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1A1]">Height</label>
                <input 
                  type="text"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                  placeholder="e.g. 5'10&quot; (178 cm)"
                  className="w-full bg-gray-50 border border-[#E5E5E5] rounded-xl py-2.5 px-3 text-xs outline-none focus:border-[#1A1A1A]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1A1]">Height Category</label>
                <select 
                  value={formData.heightCategory}
                  onChange={(e) => setFormData({ ...formData, heightCategory: e.target.value as any })}
                  className="w-full bg-gray-50 border border-[#E5E5E5] rounded-xl py-2.5 px-3 text-xs outline-none focus:border-[#1A1A1A]"
                >
                  <option value="Petite">Petite (&lt; 5'7")</option>
                  <option value="Average">Average (5'7" - 6'0")</option>
                  <option value="Tall">Tall (&gt; 6'0")</option>
                </select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1A1]">Body Build / Proportions</label>
                <select 
                  value={formData.bodyType}
                  onChange={(e) => setFormData({ ...formData, bodyType: e.target.value as any })}
                  className="w-full bg-gray-50 border border-[#E5E5E5] rounded-xl py-2.5 px-3 text-xs outline-none focus:border-[#1A1A1A]"
                >
                  <option value="Slim">Slim / Lean</option>
                  <option value='Slim / Midsection Carry ("Skinny Fat")'>Slim / Midsection Carry ("Skinny Fat")</option>
                  <option value="Athletic">Athletic / Toned</option>
                  <option value="Average">Average Build</option>
                  <option value="Broad / Muscular">Broad / Muscular Frame</option>
                  <option value="Plus-size / Curve">Plus-size / Full Frame</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-gray-50 rounded-2xl">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[#A1A1A1]">Height</p>
                  <p className="text-xs font-bold mt-0.5">{profile.height}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-2xl">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[#A1A1A1]">Category</p>
                  <p className="text-xs font-bold mt-0.5">{profile.heightCategory}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-2xl">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[#A1A1A1]">Build</p>
                  <p className="text-xs font-bold mt-0.5">{profile.bodyType}</p>
                </div>
              </div>

              <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-2xl leading-relaxed">
                {HEIGHT_TIPS[profile.heightCategory] || HEIGHT_TIPS['Average']}
              </p>
            </div>
          )}
        </div>

        {/* Aesthetics & Fit Preferences */}
        <div className="bg-white border border-[#E5E5E5] rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-3 text-sm font-bold border-b border-[#F0F0F0] pb-3">
            <UserCheck size={18} className="text-[#1A1A1A]" />
            <span>Preferred Aesthetics & Style Notes</span>
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1A1]">Select Your Favorite Aesthetics</label>
                <div className="flex flex-wrap gap-2">
                  {AESTHETICS_LIST.map(aesthetic => {
                    const isSelected = (formData.styleAesthetic || []).includes(aesthetic);
                    return (
                      <button
                        key={aesthetic}
                        type="button"
                        onClick={() => toggleAesthetic(aesthetic)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          isSelected ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' : 'bg-gray-50 text-gray-700 border-[#E5E5E5]'
                        }`}
                      >
                        {aesthetic} {isSelected ? '✓' : ''}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1A1]">Personal Styling Notes / Constraints</label>
                <textarea 
                  rows={3}
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Prefer relaxed fits over skinny, open collar linen for summer, avoid synthetic fabrics..."
                  className="w-full bg-gray-50 border border-[#E5E5E5] rounded-xl p-3 text-xs outline-none focus:border-[#1A1A1A]"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {profile.styleAesthetic?.map(aesthetic => (
                  <span key={aesthetic} className="px-3 py-1 bg-gray-100 text-[#1A1A1A] rounded-full text-xs font-medium">
                    {aesthetic}
                  </span>
                ))}
              </div>
              {profile.notes && (
                <p className="text-xs text-gray-600 italic bg-gray-50 p-3 rounded-2xl">
                  "{profile.notes}"
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
