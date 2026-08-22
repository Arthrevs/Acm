const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const API_KEYS = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3
].filter(Boolean);

let currentKeyIndex = 0;

/**
 * Shared Gemini call helper.
 * All 3 agents use this to talk to the LLM. Automatically rotates API keys.
 */
async function callGemini(systemPrompt, userPrompt) {
  if (API_KEYS.length === 0) {
    throw new Error('No Gemini API keys found in .env');
  }

  // Rotate key
  const apiKey = API_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-3.6-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.1,
    },
    systemInstruction: systemPrompt,
  });

  const result = await model.generateContent(userPrompt);
  return JSON.parse(result.response.text());
}

/**
 * Extracts text precisely from an image using Gemini Flash.
 */
async function extractTextFromImage(base64Data, mimeType) {
  if (API_KEYS.length === 0) {
    throw new Error('No Gemini API keys found in .env');
  }

  const apiKey = API_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });

  const prompt = "Extract all text from this image precisely as it appears. Do not summarize, describe the image, or add any other conversational text. Just output the text found in the image.";
  const imagePart = {
    inlineData: {
      data: base64Data,
      mimeType
    },
  };

  const result = await model.generateContent([prompt, imagePart]);
  return result.response.text().trim();
}

module.exports = { callGemini, extractTextFromImage };
