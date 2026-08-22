const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Dedicated API keys for Vision OCR (Primary and Emergency Fallback)
const VISION_KEYS = [
  process.env.GEMINI_VISION_KEY,
  process.env.GEMINI_VISION_KEY_2,
  process.env.GEMINI_API_KEY_1 // Ultimate fallback just in case
].filter(Boolean);

const FALLBACK_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.7-flash',
  'gemini-3.5-flash',
  'gemini-flash-latest',
  'gemini-2.5-flash'
];

const VISION_PROMPT = `
Extract all readable text from this screenshot verbatim.
Preserve all transliterated Hinglish, misspellings, phone numbers, and links exactly as written.
If there are timestamps, sender names, or platform UI elements (like "WhatsApp", "OLX"), include them.
Output ONLY the extracted conversation text without markdown formatting or commentary.
Do NOT add any analysis, summary, or interpretation.
`;

/**
 * Extract text from a screenshot using Gemini's native multimodal vision.
 * Uses a dedicated Vision API key to avoid conflicting with pipeline agent quotas.
 *
 * @param {string} imageBase64 - The raw base64-encoded image string (no data: prefix).
 * @param {string} mimeType - The MIME type of the image (e.g., "image/png").
 * @returns {Promise<string>} - The extracted text from the screenshot.
 */
async function extractTextFromImage(imageBase64, mimeType = 'image/png') {
  if (VISION_KEYS.length === 0) {
    throw new Error('No Gemini Vision API keys found in .env');
  }

  const imagePart = {
    inlineData: {
      data: imageBase64,
      mimeType: mimeType,
    },
  };

  let lastError;

  // Try each key
  for (let i = 0; i < VISION_KEYS.length; i++) {
    const key = VISION_KEYS[i];
    const genAI = new GoogleGenerativeAI(key);

    // Try each model with the current key
    for (const modelName of FALLBACK_MODELS) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });

        console.log(`[Vision] Attempting OCR with key ${i + 1} and model: ${modelName}`);
        const result = await model.generateContent([VISION_PROMPT, imagePart]);
        const extractedText = result.response.text();

        console.log(`[Vision] Successfully extracted ${extractedText.length} chars from screenshot`);
        return extractedText;
      } catch (err) {
        lastError = err;
        if (err.status === 429 || err.status === 503) {
          console.warn(`[Vision] Key ${i + 1}, Model ${modelName} hit limit. Degrading...`);
          continue; // Try next model for this key
        }
        // If it's a 400 or 404 (model not found for this key), we also continue to next model
        if (err.status === 400 || err.status === 404) {
          console.warn(`[Vision] Key ${i + 1}, Model ${modelName} returned ${err.status}. Degrading...`);
          continue;
        }
        
        throw err; // For other unexpected errors, throw immediately
      }
    }
    
    console.warn(`[Vision] Key ${i + 1} exhausted all models. Falling back to next emergency key...`);
  }

  throw new Error(`All vision keys and fallback models exhausted for OCR. Last error: ${lastError.message}`);
}

module.exports = { extractTextFromImage };
