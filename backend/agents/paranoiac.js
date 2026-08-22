/**
 * Agent 1: The Paranoiac (Threat Extractor)
 * 
 * Role: The strict security guard. Completely blind to nuance.
 * It does NOT interpret meaning — it only lists raw exploit vectors.
 * 
 * Intentionally isolated from Agent 2 to prevent bias.
 */

const { callGemini } = require('../services/llm');

const SYSTEM_PROMPT = `Extract explicit exploit vectors from the text. Ignore context/nuance. Do not judge intent or safety.
Scan for: unverified links, OTP/PIN requests, financial demands (advance, deposit, QR scan), coercive deadlines, off-platform diversion, impersonation, data harvesting.
Respond ONLY with this JSON:
{
  "threats_found": integer,
  "threat_entities": [
    {
      "text": "exact string",
      "category": "unverified_link" | "otp_request" | "financial_demand" | "coercive_deadline" | "off_platform" | "impersonation" | "data_harvest",
      "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
    }
  ]
}`;

async function runParanoiac(normalizedText, rawText, entities) {
  const userPrompt = `SCAN THIS MESSAGE FOR ALL EXPLOIT VECTORS:

Raw Message: "${rawText}"
Normalized Message: "${normalizedText}"
Pre-extracted URLs: ${JSON.stringify(entities.urls)}
Pre-extracted Phone Numbers: ${JSON.stringify(entities.phones)}

List every single suspicious element. Miss nothing.`;

  try {
    return await callGemini(SYSTEM_PROMPT, userPrompt);
  } catch (error) {
    console.error('Agent 1 (Paranoiac) Error:', error);
    return {
      threats_found: 0,
      threat_entities: [],
      agent_error: 'Paranoiac agent failed to respond',
    };
  }
}

module.exports = { runParanoiac };
