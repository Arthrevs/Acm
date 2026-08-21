const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Layer 3: Intent & Context AI Gateway
 * 
 * ONLY receives high-risk chunks that have been filtered by Layer 1
 * and weighted by Layer 2. Acts strictly as a semantic context arbiter.
 */
async function classifyMessage(rawText, normalizedChunks, heuristicResult, entities, verificationResult) {
  // Build the focused context for the LLM
  const chunksContext = normalizedChunks.chunks
    .map((c, i) => `[Chunk ${i + 1}${c.isMessageOfInterest ? ' — MESSAGE OF INTEREST' : ''}]: "${c.text}"`)
    .join('\n');

  const heuristicContext = heuristicResult.breakdown
    .map(b => `• ${b.rule}: "${b.match}" (+${b.points} pts)`)
    .join('\n');

  const verificationContext = verificationResult.findings
    .map(f => `• [${f.severity}] ${f.reason}: ${f.url}`)
    .join('\n') || 'No domain verification flags.';

  const prompt = `You are a cybersecurity expert specializing in detecting SMS/chat phishing and smishing scams, specifically those targeting Indian regional users with vernacular misspellings (Hinglish transliterations, OLX/marketplace scams).

IMPORTANT: You are Layer 3 of a 4-layer detection pipeline. Layers 1 and 2 have ALREADY pre-processed this message. You are receiving ONLY the high-risk, filtered chunks — not raw chat filler.

Your job is to act as a SEMANTIC CONTEXT ARBITER:
- Does the seller's demand match a known scam pattern (OLX escrow scam, advance payment fraud, QR code payment hijack, KYC phishing)?
- Or is it a legitimate transaction request?

=== RAW INPUT ===
"${rawText}"

=== PRE-FILTERED HIGH-RISK CHUNKS (Layer 1) ===
${chunksContext}

=== HEURISTIC SCORE (Layer 2): ${heuristicResult.totalScore} / threshold ${heuristicResult.threshold} ===
${heuristicContext || 'No heuristic flags triggered.'}

=== DOMAIN VERIFICATION (Layer 4) ===
${verificationContext}

=== EXTRACTED ENTITIES ===
URLs: ${JSON.stringify(entities.urls)}
Phone Numbers: ${JSON.stringify(entities.phones)}

Based on all the above context, provide your semantic verdict.
You MUST respond with ONLY a valid JSON object matching this schema exactly, no markdown fences, no extra text:
{
  "verdict": "SAFE" | "SUSPICIOUS" | "SCAM",
  "risk_score": integer (0-100),
  "threat_category": string (e.g., "OLX Escrow Scam", "QR Code Hijack", "Advance Payment Fraud", "KYC Phishing", "Utility Scam", "Financial Fraud", "None"),
  "confidence": number (0.0-1.0),
  "reasoning": "One-sentence explanation of why this verdict was chosen",
  "highlighted_spans": [
    {
      "text": "the exact string from the raw input that is manipulative or suspicious",
      "reason": "brief explanation of why this span is a threat indicator"
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
