const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Shared Gemini call helper.
 * All 3 agents use this to talk to the LLM with different system prompts.
 */
async function callGemini(systemPrompt, userPrompt) {
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

module.exports = { callGemini };
