const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Calls Gemini to classify the SMS message and return strict JSON.
 */
async function classifyMessage(rawText, normalizedText, entities) {
  const prompt = `You are a cybersecurity expert specializing in detecting SMS phishing and smishing scams, specifically those targeting regional users with vernacular misspellings (e.g., Hinglish transliterations).

Analyze the following SMS message. We have provided the raw text, a normalized version where known phonetic misspellings were mapped to standard English, and extracted URLs/phone numbers.

Raw SMS: "${rawText}"
Normalized SMS: "${normalizedText}"
Extracted URLs: ${JSON.stringify(entities.urls)}
Extracted Phone Numbers: ${JSON.stringify(entities.phones)}

Determine if this message is a scam.
You MUST respond with ONLY a valid JSON object matching this schema exactly, no markdown fences, no extra text:
{
  "verdict": "SAFE" | "SUSPICIOUS" | "SCAM",
  "risk_score": integer (0-100),
  "threat_category": string (e.g., "Financial Fraud", "Utility Scam", "KYC Phishing", "None"),
  "highlighted_spans": [
    {
      "text": "the exact string from the Raw SMS that is manipulative or suspicious",
      "reason": "brief explanation of why this span is a threat"
    }
  ]
}`;

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.6-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return JSON.parse(text);
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error('Failed to process message with LLM.');
  }
}

module.exports = { classifyMessage };
