/**
 * Agent 3: The Chief Judge (Consensus Engine)
 * 
 * Role: The final authority. Resolves conflicts between Agent 1 (Paranoiac)
 * and Agent 2 (Context Arbiter).
 * 
 * Runs AFTER both Phase 1 agents complete. Receives their independent outputs.
 */

const { callGemini } = require('../services/llm');

const SYSTEM_PROMPT = `You are "The Chief Judge" — the final consensus authority in a multi-agent phishing detection pipeline.

YOUR ROLE: You resolve conflicts between two independent agents who have already analyzed a message:
- Agent 1 (The Paranoiac): A paranoid threat extractor that flags every possible exploit vector.
- Agent 2 (The Context Arbiter): A social analyst that evaluates the conversational context and power dynamics.

YOUR DECISION FRAMEWORK:

THE OVERRULE: If Agent 1 flags generic financial keywords (like "UPI", "pay", "amount"), BUT Agent 2 confirms it is a normal marketplace negotiation or peer conversation with natural trust patterns, you OVERRULE Agent 1 and declare it SAFE. Provide a clear justification (e.g., "Financial keywords were overruled by legitimate marketplace context").

THE STRIKE: If Agent 1 finds unverified external links, OTP harvesting, or data requests, AND Agent 2 identifies the sender as a stranger with manufactured trust or authority impersonation, you CONFIRM it is a SCAM.

THE MIDDLE GROUND: If Agent 1 flags moderate threats and Agent 2 identifies mixed signals (e.g., marketplace context but unusual pressure), declare it SUSPICIOUS.

CRITICAL RULES:
1. You must weigh BOTH agents equally. Neither one dominates.
2. You must explain your consensus reasoning in one clear sentence.
3. If Agent 2 finds "manufactured" trust patterns, that AMPLIFIES Agent 1's threat findings.
4. If Agent 2 finds "natural" trust with "peer_to_peer" dynamics, that DIMINISHES Agent 1's findings.

You MUST respond with ONLY a valid JSON object:
{
  "verdict": "SAFE" | "SUSPICIOUS" | "SCAM",
  "risk_score": integer (0-100),
  "threat_category": "string (e.g., 'OLX Escrow Scam', 'QR Code Hijack', 'KYC Phishing', 'None')",
  "confidence": number (0.0-1.0),
  "consensus_reasoning": "One clear sentence explaining how you resolved the conflict between agents",
  "overruled_agent": null | "paranoiac" | "context_arbiter",
  "highlighted_spans": [
    {
      "text": "exact string from the original message",
      "reason": "why this span is significant to the verdict"
    }
  ]
}`;

async function runChiefJudge(rawText, paranoiacResult, arbiterResult, heuristicResult, verificationResult) {
  const threatSummary = (paranoiacResult.threat_entities || [])
    .map(t => `• [${t.severity}] "${t.text}" → ${t.category}`)
    .join('\n') || 'No threats flagged.';

  const verificationSummary = (verificationResult.findings || [])
    .map(f => `• [${f.severity}] ${f.reason}: ${f.domain}`)
    .join('\n') || 'No domain verification flags.';

  const userPrompt = `RESOLVE THE CONSENSUS FOR THIS MESSAGE:

Original Message: "${rawText}"

═══ AGENT 1 OUTPUT (The Paranoiac — Threat Extractor) ═══
Threats Found: ${paranoiacResult.threats_found || 0}
${threatSummary}

═══ AGENT 2 OUTPUT (The Context Arbiter — Social Analyst) ═══
Scenario: ${arbiterResult.scenario}
Power Dynamic: ${arbiterResult.power_dynamic}
Trust Pattern: ${arbiterResult.trust_pattern}
Platform Context: ${arbiterResult.platform_context}
Legitimacy Indicators: ${JSON.stringify(arbiterResult.legitimacy_indicators)}
Social Pressure Level: ${arbiterResult.social_pressure_level}

═══ DETERMINISTIC HEURISTIC SCORE (Layer 2) ═══
Total Score: ${heuristicResult.totalScore} / Threshold: ${heuristicResult.threshold}
${(heuristicResult.breakdown || []).map(b => `• +${b.points} — ${b.rule}: "${b.match}"`).join('\n') || 'No heuristic flags.'}

═══ DOMAIN VERIFICATION (Layer 4) ═══
${verificationSummary}

Now weigh Agent 1's threats against Agent 2's social context. Apply the Overrule or Strike framework. Render your final consensus verdict.`;

  try {
    return await callGemini(SYSTEM_PROMPT, userPrompt);
  } catch (error) {
    console.error('Agent 3 (Chief Judge) Error:', error);
    throw new Error('Chief Judge agent failed to reach consensus.');
  }
}

module.exports = { runChiefJudge };
