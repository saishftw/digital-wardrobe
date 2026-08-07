import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Initialize Gemini Client safely
  const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not configured.");
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  // API Route: AI Stylist & Outfit Generator
  app.post('/api/ai-stylist', async (req, res) => {
    try {
      const ai = getGeminiClient();
      const { userProfile, event, weather, occasion, ownedPieces, wishlistPieces, existingOutfits, sourceTab } = req.body;

      if (!ownedPieces || !Array.isArray(ownedPieces) || ownedPieces.length === 0) {
        return res.status(400).json({ error: 'At least one owned piece is required in your wardrobe.' });
      }

      const prompt = `
You are an expert personal stylist and sartorial consultant.
Your job is to generate tailored outfit recommendations and shopping suggestions based on the user's physical profile, personal wardrobe, and specific event or tab context.

=== APPLICATION TAB TRIGGER CONTEXT ===
Triggered From Tab: ${sourceTab || 'General'}
${sourceTab === 'Wardrobe' ? '--> FOCUS: Analyze overall wardrobe gaps, identify missing staple pieces, and showcase versatile daily mix-and-match formulas from owned items.' : ''}
${sourceTab === 'Outfits' ? '--> FOCUS: Focus on generating high-aesthetic outfit formulas, layering combos, and outfit versatility.' : ''}
${sourceTab === 'Events' ? `--> FOCUS: Optimize specifically for the event "${event?.name || 'Upcoming Event'}" considering weather (${weather}), location, and dress code.` : ''}
${sourceTab === 'Profile' ? '--> FOCUS: Deep physical trait analysis! Explicitly explain how clothing choices camouflage midsection fullness, flatter 181cm height, and elongate round/oval face structure.' : ''}

=== USER PHYSICAL PROFILE & SARTORIAL TRAITS ===
- Height: ${userProfile?.height || "181 cm (~5'11\")"} (${userProfile?.heightCategory || 'Tall'}) (181cm tall frame supports layered overcoats, tailored trouser breaks, longline jackets, and balanced vertical lines)
- Face Shape: ${userProfile?.faceShape || 'Round'} (Round/Oval face structure benefits from vertical visual lines, open camp collars, V-necks, unbuttoned top buttons, and lapels that draw the eye up-and-down rather than widening)
- Jawline Definition: ${userProfile?.jawlineDefinition || 'Soft / Curved'}
- Neck Length: ${userProfile?.neckLength || 'Average'}
- Skin Tone & Depth: ${userProfile?.skinTone || 'Medium Warm'}
- Skin Undertone: ${userProfile?.undertone || 'Warm'} (Warm undertones shine in earth tones, rust, olive green, warm camel, cream, and rich brown; Cool in navy, icy grey, crisp white; Olive in jewel tones and slate)
- Contrast Level: ${userProfile?.contrastLevel || 'Medium Contrast'}
- Seasonal Color Palette: ${userProfile?.seasonalColor || 'Autumn'}
- Body Build / Physique: ${userProfile?.bodyType || 'Slim / Midsection Carry ("Skinny Fat")'}
- CRITICAL MIDSECTION & WAIST FIT RULES: 
  * The user carries weight/tummy around the midsection. 
  * STRICTLY AVOID bottoms or trousers that bunch up, feature puffy pleated waistlines, or have elastic gather at the stomach.
  * ALWAYS PREFER clean flat-front trousers, mid-to-high rise tailored pants with smooth drape, or dark structured bottoms.
  * PREFER tops that drop smoothly past the waistband, relaxed unbuttoned overshirts, structured blazers, or light layering that creates vertical slimming lines down the torso without clinging to the belly.
- Body Silhouette/Shape: ${userProfile?.bodyShape || 'Rectangle'}
- Torso-to-Leg Ratio: ${userProfile?.torsoToLegRatio || 'Balanced Proportions'}
- Shoulder Slope: ${userProfile?.shoulderSlope || 'Square / Broad'}
- Hair & Eye Color: ${userProfile?.hairColor || 'Dark Brown'}, ${userProfile?.eyeColor || 'Brown'}
- Preferred Aesthetics: ${userProfile?.styleAesthetic?.join(', ') || 'Smart Casual, Minimalist'}
- Personal Notes: ${userProfile?.notes || 'None'}

=== EVENT / OCCASION CONTEXT ===
- Event Name: ${event?.name || occasion || 'General Dressing'}
- Description: ${event?.description || 'Daily outfit recommendation'}
- Location: ${event?.location || 'Not specified'}
- Weather / Temperature: ${weather || 'Cool'}

=== AVAILABLE WARDROBE INVENTORY ===
Owned Pieces:
${JSON.stringify(ownedPieces, null, 2)}

Wishlist Pieces:
${JSON.stringify(wishlistPieces || [], null, 2)}

Existing Outfit Combos:
${JSON.stringify(existingOutfits || [], null, 2)}

=== YOUR INSTRUCTIONS ===
1. Analyze how the user's skin undertone (${userProfile?.undertone || 'Warm'}), face shape (${userProfile?.faceShape || 'Round'}), height (${userProfile?.height || "181 cm"}), and midsection carry ("skinny fat" build) pair with the requested context.
2. Recommend 2 to 4 distinct outfits composed strictly using the 'id' of valid owned pieces from the inventory. Each outfit MUST have at least a topId and bottomId. You can include midLayerId, outerId, or accessoryId if appropriate.
3. Suggest 1 to 3 missing items to buy (e.g., flat-front trousers, open-collar linen overshirts, structured mid-layers) that elevate their look for this context and complement their skin tone, tummy concealment, and 181cm frame.
4. Provide detailed styling tips (e.g., French tuck, open layer stance, collar unbuttoning, trouser rise positioning) and an explicit rationale explaining why the colors and cuts flatters their midsection, round face, and height.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are an elite fashion stylist specializing in color analysis, physical trait matching (skin undertone, face structure, body proportions), and event wardrobe planning. Always return response strictly in valid JSON matching the requested schema.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING, description: 'Summary of the styling direction for this event.' },
              traitAnalysis: { type: Type.STRING, description: 'Explanation of how their skin tone, face structure, and height influenced these outfit selections.' },
              outfitRecommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    topId: { type: Type.STRING, description: 'Must match an id from ownedPieces where type is Top' },
                    bottomId: { type: Type.STRING, description: 'Must match an id from ownedPieces where type is Bottom' },
                    midLayerId: { type: Type.STRING, description: 'Optional id from ownedPieces' },
                    outerId: { type: Type.STRING, description: 'Optional id from ownedPieces' },
                    accessoryId: { type: Type.STRING, description: 'Optional id from ownedPieces' },
                    occasion: { type: Type.ARRAY, items: { type: Type.STRING } },
                    weather: { type: Type.STRING },
                    suitabilityScore: { type: Type.NUMBER },
                    rationale: { type: Type.STRING, description: 'Why this combination flatters their physical profile and suits the event.' },
                    stylingTips: { type: Type.STRING, description: 'Specific styling advice on fit, tuck, roll, or accessories.' }
                  },
                  required: ['title', 'topId', 'bottomId', 'occasion', 'weather', 'suitabilityScore', 'rationale', 'stylingTips']
                }
              },
              missingItemRecommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING, description: 'e.g. Cream Linen Blazer' },
                    type: { type: Type.STRING, description: 'Top, Bottom, Outer, Shoes, or Accessory' },
                    category: { type: Type.STRING },
                    color: { type: Type.STRING },
                    hex: { type: Type.STRING },
                    reasonToBuy: { type: Type.STRING, description: 'Why buying this piece enhances their skin undertone or completes event looks.' }
                  },
                  required: ['title', 'type', 'category', 'color', 'reasonToBuy']
                }
              }
            },
            required: ['summary', 'traitAnalysis', 'outfitRecommendations', 'missingItemRecommendations']
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Gemini returned an empty response.');
      }

      const parsedData = JSON.parse(responseText);
      return res.json(parsedData);
    } catch (err: any) {
      console.error('AI Stylist route error:', err);
      return res.status(500).json({ 
        error: err?.message || 'Failed to generate AI styling recommendations.',
        details: err.toString() 
      });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Vite development middleware vs Static Production serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
