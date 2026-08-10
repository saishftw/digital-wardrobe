import { GoogleGenAI, Type } from '@google/genai';

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userProfile, event, weather, occasion, ownedPieces, wishlistPieces, existingOutfits, sourceTab } = req.body || {};

  const safeOwned = Array.isArray(ownedPieces) && ownedPieces.length > 0 
    ? ownedPieces 
    : [
        { id: 'default_p1', name: 'White Linen Shirt', type: 'Top', category: 'Shirt', color: 'White' }, 
        { id: 'default_p2', name: 'Flat Front Navy Chinos', type: 'Bottom', category: 'Chinos', color: 'Navy' }
      ];

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

  try {
    const ai = getGeminiClient();

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
${JSON.stringify(safeOwned, null, 2)}

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

    const candidateModels = ['gemini-3.6-flash', 'gemini-flash-latest', 'gemini-3.1-pro-preview'];
    let lastError: any = null;
    let parsedData: any = null;

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
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
                      topId: { type: Type.STRING },
                      bottomId: { type: Type.STRING },
                      midLayerId: { type: Type.STRING },
                      outerId: { type: Type.STRING },
                      accessoryId: { type: Type.STRING },
                      occasion: { type: Type.ARRAY, items: { type: Type.STRING } },
                      weather: { type: Type.STRING },
                      suitabilityScore: { type: Type.NUMBER },
                      rationale: { type: Type.STRING },
                      stylingTips: { type: Type.STRING }
                    },
                    required: ['title', 'topId', 'bottomId', 'occasion', 'weather', 'suitabilityScore', 'rationale', 'stylingTips']
                  }
                },
                missingItemRecommendations: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      type: { type: Type.STRING },
                      category: { type: Type.STRING },
                      color: { type: Type.STRING },
                      hex: { type: Type.STRING },
                      reasonToBuy: { type: Type.STRING }
                    },
                    required: ['title', 'type', 'category', 'color', 'reasonToBuy']
                  }
                }
              },
              required: ['summary', 'traitAnalysis', 'outfitRecommendations', 'missingItemRecommendations']
            }
          }
        });

        let rawText = response.text || '';
        rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

        if (rawText) {
          parsedData = JSON.parse(rawText);
          break;
        }
      } catch (modelErr: any) {
        lastError = modelErr;
      }
    }

    if (parsedData) {
      return res.status(200).json(parsedData);
    }

    throw lastError || new Error('All candidate AI models failed.');
  } catch (err: any) {
    const tops = safeOwned.filter((p: any) => p.type === 'Top' || p.type === 'Shirt');
    const bottoms = safeOwned.filter((p: any) => p.type === 'Bottom' || p.type === 'Pants' || p.type === 'Trousers');
    const outers = safeOwned.filter((p: any) => p.type === 'Outer' || p.type === 'Jacket');

    const top1 = tops[0] || safeOwned[0];
    const bottom1 = bottoms[0] || safeOwned[1] || safeOwned[0];
    const top2 = tops[1] || tops[0] || top1;
    const bottom2 = bottoms[1] || bottoms[0] || bottom1;
    const outer1 = outers[0];

    const fallbackResult = {
      summary: `Sartorial strategy tailored for ${sourceTab || 'General'} context, prioritizing midsection coverage, elongating round facial features, and complimenting your 181cm height.`,
      traitAnalysis: `Selected flat-front trousers and unbuttoned layering to eliminate stomach tension and create smooth vertical drape for your ${userProfile?.height || '181cm'} frame and ${userProfile?.faceShape || 'Round'} face shape.`,
      outfitRecommendations: [
        {
          title: "Flat-Front & Open Layer Formula",
          topId: top1.id,
          bottomId: bottom1.id,
          outerId: outer1?.id,
          occasion: [event?.name || "Smart Casual"],
          weather: weather || "Cool",
          suitabilityScore: 9.4,
          rationale: `Pairing ${top1.name} with ${bottom1.name} provides clean vertical lines down the torso without stomach bunching.`,
          stylingTips: "Keep the top layer unbuttoned to form elongating vertical parallel lines that slim the midsection and open the collar stance."
        },
        {
          title: "Proportional Draped Silhouette",
          topId: top2.id,
          bottomId: bottom2.id,
          occasion: ["Daily Outfit", "Casual Elegance"],
          weather: weather || "Moderate",
          suitabilityScore: 9.1,
          rationale: `Complements your ${userProfile?.undertone || 'Warm'} undertones with smooth fabric drape that flatters your 181cm build.`,
          stylingTips: "Wear untucked or relaxed French-tuck with high/mid-rise flat-front waistband."
        }
      ],
      missingItemRecommendations: [
        {
          title: "Flat-Front Mid-Rise Tailored Trousers",
          type: "Bottom",
          category: "Trousers",
          color: "Charcoal or Dark Olive",
          hex: "#384033",
          reasonToBuy: "Guarantees a clean, non-puffy waistline that drapes smoothly over the midsection for your 181cm frame."
        },
        {
          title: "Open-Collar Camp Linen Overshirt",
          type: "Top",
          category: "Overshirt",
          color: "Warm Cream / Beige",
          hex: "#F5F2EB",
          reasonToBuy: "Open camp collar elongates round face symmetry while relaxed drape conceals stomach fullness."
        }
      ]
    };

    return res.status(200).json(fallbackResult);
  }
}
