import { GoogleGenerativeAI } from '@google/generative-ai';

// Models to race in parallel — fastest winner is returned
const ROAST_MODELS = [
    'gemini-3.5-flash',        // Primary: stable and confirmed working
    'gemini-3.8-flash',        // Secondary: newest (can 503 under high demand)
    'gemini-3.5-flash-lite',   // Lightweight backup
];

/**
 * POST /api/ai/roast
 * Body: { items: [{ name, price }], currency: string }
 * Returns: { roast: string }
 *
 * Performance strategy: fire all models in parallel via Promise.any() —
 * the fastest successful response wins, cutting latency dramatically vs sequential.
 */
export const generateRoast = async (req, res) => {
    const { items, currency } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'No items provided.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(503).json({ error: 'AI service is not configured on the server.' });
    }

    // ── Build a lean prompt — fewer tokens = faster TTFT ────────────────────
    // Send at most 15 items (a roast never needs 30 to be funny)
    const productList = items
        .slice(0, 15)
        .map((item) => `${item.name}${item.price ? ` ₹${item.price}` : ''}`)
        .join(', ');

    const isHinglish = currency === 'INR';

    const basePrompt = `You are a brutally honest, witty, sarcastic friend roasting someone's shopping wishlist.\nWishlist: ${productList}\nWrite a SHORT roast in 2-3 sentences max. Be specific about what you see. Be playful and clever, not mean. No hashtags, no emojis, no markdown. Plain text only.`;

    const prompt = isHinglish
        ? `${basePrompt}\nCRITICAL INSTRUCTION: You MUST write the ENTIRE roast in Hinglish (Hindi + English mixed in Latin script) using Gen-Z Indian slang. Do NOT write in plain English. Every sentence must contain Hindi words.`
        : basePrompt;

    // ── Race all models in parallel — first non-empty response wins ──────────
    const genAI = new GoogleGenerativeAI(apiKey);

    const modelRaces = ROAST_MODELS.map(async (modelName) => {
        const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
                maxOutputTokens: 150,  // Roast is short; cap tokens so response is fast
                temperature: 0.9,      // Keep it creative
            },
        });
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        if (!text) throw new Error('empty response');
        return text;
    });

    try {
        const roast = await Promise.any(modelRaces);
        return res.json({ roast });
    } catch (err) {
        console.error('[AI] All Gemini models failed:', err?.errors?.map(e => e.message).join(' | '));
        return res.status(502).json({ error: 'Failed to generate roast. Please try again.' });
    }
};
