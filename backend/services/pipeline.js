/**
 * Pipeline Orchestrator — Multi-Agent Consensus Architecture
 * 
 * Existing 4-Layer Pipeline:
 *   Layer 1 (Context Normalizer) → Layer 2 (Heuristic Scorer) →
 *   Layer 4 (Verification Gate)
 * 
 * NEW Layer 3 — Multi-Agent Consensus Pipeline:
 *   Phase 1 (Parallel): Agent 1 (Paranoiac) + Agent 2 (Context Arbiter)
 *   Phase 2 (Serial):   Agent 3 (Chief Judge) resolves consensus
 */

const { normalizeContext } = require('../layers/contextNormalizer');
const { scoreHeuristics } = require('../layers/heuristicScorer');
const { verifyEntities } = require('../layers/verificationGate');
const { runParanoiac } = require('../agents/paranoiac');
const { runContextArbiter } = require('../agents/contextArbiter');
const { runChiefJudge } = require('../agents/chiefJudge');
const { normalizeText } = require('../utils/normalizer');
const { extractEntities } = require('../utils/extractor');

async function runPipeline(rawText, customThreshold = 30) {
  const startTime = Date.now();
  const timestamps = {};

  // ──────────────────────────────────────────────
  // LAYER 1: Context & Length Normalizer
  // ──────────────────────────────────────────────
  const l1Start = Date.now();
  const normalizedText = normalizeText(rawText);
  const contextResult = normalizeContext(rawText);
  const entities = extractEntities(rawText);
  timestamps.layer1 = Date.now() - l1Start;

  // ──────────────────────────────────────────────
  // LAYER 2: Deterministic Heuristic Scoring
  // ──────────────────────────────────────────────
  const l2Start = Date.now();
  const heuristicResult = scoreHeuristics(normalizedText, entities);
  timestamps.layer2 = Date.now() - l2Start;

  // ──────────────────────────────────────────────
  // LAYER 4: Verification Cross-Check (runs before agents)
  // ──────────────────────────────────────────────
  const l4Start = Date.now();
  const verificationResult = verifyEntities(entities);
  timestamps.layer4 = Date.now() - l4Start;

  // ──────────────────────────────────────────────
  // DECISION GATE: Escalate to LLM only when needed
  // ──────────────────────────────────────────────
  // Three paths:
  //   A) Score === 0 → pure noise, fast-path SAFE (0 LLM calls)
  //   B) Score >= 50 → strong heuristic signal, deterministic verdict (0 LLM calls)
  //   C) Score 1-49  → ambiguous, escalate to multi-agent consensus (3 LLM calls)
  
  let classification;
  let agentResults = { agent1: null, agent2: null, agent3: null };

  const STRONG_SIGNAL_THRESHOLD = 50;
  const needsLLM = (heuristicResult.totalScore > 0 && heuristicResult.totalScore < STRONG_SIGNAL_THRESHOLD)
    && !verificationResult.hasCriticalFindings;

  if (heuristicResult.totalScore >= STRONG_SIGNAL_THRESHOLD || verificationResult.hasCriticalFindings) {
    // ── PATH B: Strong heuristic signal — deterministic verdict ──
    // Enough structural friction (identity + pressure + extraction) to classify
    // without burning 3 LLM calls. The heuristic breakdown IS the evidence.
    const dims = heuristicResult.dimensions;
    const hasIdentity = dims.identity > 0;
    const hasPressure = dims.pressure > 0;
    const hasExtraction = dims.extraction > 0;

    // Map dimension combinations to threat categories
    let category = 'Social Engineering';
    if (hasExtraction && hasIdentity) category = 'Financial Fraud / Phishing';
    else if (hasPressure && hasIdentity) category = 'Impersonation Scam';
    else if (hasExtraction) category = 'Credential Theft';

    // Compute risk score from heuristic total (capped at 95 — leave room for LLM nuance)
    let riskScore = Math.min(95, Math.round(heuristicResult.totalScore * 1.2));

    // If verification also flagged (typosquatting/blacklist), this is definitive
    if (verificationResult.hasCriticalFindings) {
      riskScore = Math.max(riskScore, 90);
      if (category === 'Social Engineering') category = 'Financial Fraud / Phishing';
    }

    const verificationNote = verificationResult.hasCriticalFindings
      ? ` Domain verification: ${verificationResult.findings.map(f => f.reason).join('; ')}.`
      : '';

    classification = {
      verdict: riskScore >= 60 ? 'SCAM' : 'SUSPICIOUS',
      risk_score: riskScore,
      threat_category: category,
      confidence: verificationResult.hasCriticalFindings ? 0.95 : 0.88,
      consensus_reasoning: `Deterministic fast-path: ${heuristicResult.breakdown.map(b => b.rule + ' ("' + b.match + '")').join('; ')}.${verificationNote} Strong structural friction detected across ${[hasIdentity && 'Identity', hasPressure && 'Pressure', hasExtraction && 'Extraction'].filter(Boolean).join('+')} dimensions — no LLM escalation needed.`,
      overruled_agent: null,
      highlighted_spans: heuristicResult.breakdown
        .filter(b => b.match && b.points > 0)
        .map(b => ({ text: b.match, reason: b.rule })),
    };
  } else if (needsLLM) {
    // ── PHASE 1: Parallel Investigation ──
    // Agent 1 and Agent 2 run simultaneously, isolated from each other
    const phase1Start = Date.now();

    const [paranoiacResult, arbiterResult] = await Promise.all([
      runParanoiac(normalizedText, rawText, entities),
      runContextArbiter(normalizedText, rawText),
    ]);

    timestamps.phase1 = Date.now() - phase1Start;
    agentResults.agent1 = paranoiacResult;
    agentResults.agent2 = arbiterResult;

    // ── PHASE 2: Serial Resolution ──
    // Agent 3 receives both outputs and renders the final consensus.
    // The Judge sees the heuristic dimensions as context, not as a verdict.
    const phase2Start = Date.now();

    const judgeResult = await runChiefJudge(
      rawText,
      paranoiacResult,
      arbiterResult,
      heuristicResult,
      verificationResult
    );

    timestamps.phase2 = Date.now() - phase2Start;
    agentResults.agent3 = judgeResult;

    classification = judgeResult;

    // Hard override: if verification found typosquatting/blacklist, floor the risk
    if (verificationResult.hasCriticalFindings && classification.risk_score < 70) {
      classification.risk_score = Math.max(classification.risk_score, 70);
      classification.verdict = 'SCAM';
      classification.consensus_reasoning += ' [System override: domain verification found critical findings]';
    }

  } else {
    // Score === 0: Pure conversational noise. No URLs, no money, no identity
    // claims, no pressure, no extraction signals. Nothing for the LLM to evaluate.
    classification = {
      verdict: 'SAFE',
      risk_score: 0,
      threat_category: 'None',
      confidence: 0.95,
      consensus_reasoning: 'No structural friction detected. Message contains no institutional claims, financial references, pressure language, or action requests.',
      overruled_agent: null,
      highlighted_spans: [],
    };
  }

  const processingTime = Date.now() - startTime;

  return {
    original_message: rawText,
    normalized_message: normalizedText,
    extracted_entities: entities,
    pipeline: {
      layer1_context: {
        originalLines: contextResult.originalLineCount,
        filteredLines: contextResult.filteredLineCount,
        fillerStripped: contextResult.fillerStripped,
        highRiskChunks: contextResult.chunks.length,
        messageOfInterest: contextResult.messageOfInterest,
        timeMs: timestamps.layer1,
      },
      layer2_heuristics: {
        totalScore: heuristicResult.totalScore,
        dimensions: heuristicResult.dimensions,
        needsEscalation: heuristicResult.needsEscalation,
        breakdown: heuristicResult.breakdown,
        timeMs: timestamps.layer2,
      },
      layer3_consensus: {
        invoked: needsLLM,
        agent1_paranoiac: agentResults.agent1 ? {
          threats_found: agentResults.agent1.threats_found,
          threat_entities: agentResults.agent1.threat_entities,
        } : null,
        agent2_arbiter: agentResults.agent2 ? {
          scenario: agentResults.agent2.scenario,
          power_dynamic: agentResults.agent2.power_dynamic,
          trust_pattern: agentResults.agent2.trust_pattern,
          platform_context: agentResults.agent2.platform_context,
          legitimacy_indicators: agentResults.agent2.legitimacy_indicators,
          social_pressure_level: agentResults.agent2.social_pressure_level,
        } : null,
        agent3_judge: agentResults.agent3 ? {
          overruled_agent: agentResults.agent3.overruled_agent,
          consensus_reasoning: agentResults.agent3.consensus_reasoning,
        } : null,
        phase1TimeMs: timestamps.phase1,
        phase2TimeMs: timestamps.phase2,
      },
      layer4_verification: {
        totalFindings: verificationResult.totalFindings,
        findings: verificationResult.findings,
        timeMs: timestamps.layer4,
      },
      processingTimeMs: processingTime,
    },
    classification,
  };
}

module.exports = { runPipeline };
