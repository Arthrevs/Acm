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

async function runPipeline(rawText) {
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
  const heuristicResult = scoreHeuristics(contextResult.chunks, entities);
  timestamps.layer2 = Date.now() - l2Start;

  // ──────────────────────────────────────────────
  // LAYER 4: Verification Cross-Check (runs before agents)
  // ──────────────────────────────────────────────
  const l4Start = Date.now();
  const verificationResult = verifyEntities(entities);
  timestamps.layer4 = Date.now() - l4Start;

  // ──────────────────────────────────────────────
  // LAYER 3: Multi-Agent Consensus Pipeline
  // ──────────────────────────────────────────────
  let classification;
  let agentResults = { agent1: null, agent2: null, agent3: null };

  if (heuristicResult.exceedsThreshold || verificationResult.hasCriticalFindings) {
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
    // Agent 3 receives both outputs and renders the final consensus
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
    // Low heuristic score — skip all agents for speed
    classification = {
      verdict: 'SAFE',
      risk_score: Math.min(heuristicResult.totalScore, 25),
      threat_category: 'None',
      confidence: 0.9,
      consensus_reasoning: 'No significant threat indicators detected by heuristic or verification layers. Multi-agent analysis skipped.',
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
        threshold: heuristicResult.threshold,
        exceedsThreshold: heuristicResult.exceedsThreshold,
        breakdown: heuristicResult.breakdown,
        timeMs: timestamps.layer2,
      },
      layer3_consensus: {
        invoked: heuristicResult.exceedsThreshold || verificationResult.hasCriticalFindings,
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
