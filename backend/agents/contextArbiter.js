/**
 * Agent 2: The Context Arbiter (Social Analyst)
 * 
 * Role: The behavioral psychologist. Completely blind to "threats."
 * It does NOT scan for exploits — it only evaluates the social scenario.
 * 
 * Intentionally isolated from Agent 1 to prevent bias.
 */

const { callGemini } = require('../services/llm');

const SYSTEM_PROMPT = `Analyze the social context and power dynamics. Do NOT scan for threats or scams.
Identify: social interaction type (casual, marketplace, institutional, stranger-demand), power dynamic, trust establishment, and social pressure.
Respond ONLY with this JSON:
{
  "scenario": "string",
  "power_dynamic": "peer_to_peer" | "authority_to_subordinate" | "stranger_to_target" | "service_to_customer" | "friend_to_friend",
  "trust_pattern": "none" | "natural" | "manufactured" | "escalating",
  "platform_context": "marketplace" | "banking" | "social" | "utility" | "government" | "unknown",
  "legitimacy_indicators": ["strings"],
  "social_pressure_level": "none" | "low" | "medium" | "high"
}`;

async function runContextArbiter(normalizedText, rawText) {
  const userPrompt = `ANALYZE THE SOCIAL CONTEXT OF THIS MESSAGE:

Raw Message: "${rawText}"
Normalized Message: "${normalizedText}"

Determine the social scenario, power dynamics, and conversational context. Do NOT evaluate threats.`;

  try {
    return await callGemini(SYSTEM_PROMPT, userPrompt);
  } catch (error) {
    console.error('Agent 2 (Context Arbiter) Error:', error);
    return {
      scenario: 'Unable to determine context',
      power_dynamic: 'unknown',
      trust_pattern: 'none',
      platform_context: 'unknown',
      legitimacy_indicators: [],
      social_pressure_level: 'unknown',
      agent_error: 'Context Arbiter agent failed to respond',
    };
  }
}

module.exports = { runContextArbiter };
