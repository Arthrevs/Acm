const { OpenAI } = require('openai');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Calls OpenAI to classify the SMS message and strictly format the output as JSON.
 */
async function classifyMessage(rawText, normalizedText, entities) {
  const prompt = `
You are a cybersecurity expert specializing in detecting SMS phishing and smishing scams, specifically those targeting regional users with vernacular misspellings (e.g., Hinglish transliterations).

Analyze the following SMS message. We have provided the raw text, a normalized version where known phonetic misspellings were mapped to standard English, and extracted URLs/phone numbers.

Raw SMS: "${rawText}"
Normalized SMS: "${normalizedText}"
Extracted URLs: ${JSON.stringify(entities.urls)}
Extracted Phone Numbers: ${JSON.stringify(entities.phones)}

Determine if this message is a scam.
You MUST respond with a strictly formatted JSON object matching this schema exactly:
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
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Fast and cheap for MVP
      messages: [
        { role: "system", content: "You are a specialized smishing classification API that outputs only strict JSON." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("LLM Error:", error);
    throw new Error("Failed to process message with LLM.");
  }
}

module.exports = { classifyMessage };
