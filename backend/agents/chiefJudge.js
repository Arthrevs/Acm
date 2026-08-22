/**
 * Agent 3: The Chief Judge (Consensus Engine)
 * 
 * Role: The final authority. Resolves conflicts between Agent 1 (Paranoiac)
 * and Agent 2 (Context Arbiter).
 * 
 * Runs AFTER both Phase 1 agents complete. Receives their independent outputs.
 */

const { callGemini } = require('../services/llm');

const SYSTEM_PROMPT = `Resolve conflicts between Agent 1 (Threats) and Agent 2 (Context).
Rules:
1. If Agent 1 flags generic financial keywords BUT Agent 2 confirms normal peer/marketplace context with natural trust, OVERRULE Agent 1 -> SAFE.
2. If Agent 1 finds hard exploits (unverified links, OTPs) AND Agent 2 finds stranger/manufactured trust, CONFIRM -> SCAM.
3. If mixed signals -> SUSPICIOUS.
Weigh both equally.
Respond ONLY with this JSON:
{
  "verdict": "SAFE" | "SUSPICIOUS" | "SCAM",
  "risk_score": integer (0-100),
  "threat_category": "string",
  "confidence": number (0.0-1.0),
  "consensus_reasoning": "1 sentence explanation",
  "overruled_agent": null | "paranoiac" | "context_arbiter",
  "highlighted_spans": [{"text": "exact string", "reason": "why"}]
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
