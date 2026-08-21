/**
 * Pipeline Orchestrator
 * 
 * Wires all 4 layers together in sequence:
 *   Layer 1 (Context Normalizer) → Layer 2 (Heuristic Scorer) →
 *   Layer 3 (LLM Gateway) → Layer 4 (Verification Gate)
 * 
 * Returns a unified response object.
 */

const { normalizeContext } = require('../layers/contextNormalizer');
const { scoreHeuristics } = require('../layers/heuristicScorer');
const { verifyEntities } = require('../layers/verificationGate');
const { classifyMessage } = require('./llm');
const { normalizeText } = require('../utils/normalizer');
const { extractEntities } = require('../utils/extractor');

async function runPipeline(rawText) {
  const startTime = Date.now();

  // ──────────────────────────────────────────────
  // LAYER 1: Context & Length Normalizer
  // ──────────────────────────────────────────────
  const normalizedText = normalizeText(rawText);
  const contextResult = normalizeContext(rawText);
  const entities = extractEntities(rawText);

  // ──────────────────────────────────────────────
  // LAYER 2: Deterministic Heuristic Scoring
  // ──────────────────────────────────────────────
  const heuristicResult = scoreHeuristics(contextResult.chunks, entities);

  // ──────────────────────────────────────────────
  // LAYER 4: Verification Cross-Check (runs in parallel with Layer 3)
  // ──────────────────────────────────────────────
  const verificationResult = verifyEntities(entities);

  // ──────────────────────────────────────────────
  // LAYER 3: LLM Gateway (only if heuristics flag it OR verification finds something)
  // ──────────────────────────────────────────────
  let classification;

  if (heuristicResult.exceedsThreshold || verificationResult.hasCriticalFindings) {
    // High risk — send to LLM for deep semantic analysis
    classification = await classifyMessage(
      rawText,
      contextResult,
      heuristicResult,
      entities,
      verificationResult
    );

    // Override: if LLM says SAFE but heuristic score is very high, bump to SUSPICIOUS
    if (classification.verdict === 'SAFE' && heuristicResult.totalScore >= 60) {
      classification.verdict = 'SUSPICIOUS';
      classification.risk_score = Math.max(classification.risk_score, 45);
      classification.reasoning += ' [Overridden: heuristic score exceeded safety threshold]';
    }

    // Override: if verification found typosquatting/blacklist, floor the risk score
    if (verificationResult.hasCriticalFindings && classification.risk_score < 70) {
      classification.risk_score = Math.max(classification.risk_score, 70);
      classification.verdict = 'SCAM';
    }
  } else {
    // Low heuristic score — skip LLM entirely for speed
    classification = {
      verdict: 'SAFE',
      risk_score: Math.min(heuristicResult.totalScore, 25),
      threat_category: 'None',
      confidence: 0.9,
      reasoning: 'No significant threat indicators detected by heuristic or verification layers. LLM analysis skipped.',
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
      },
      layer2_heuristics: {
        totalScore: heuristicResult.totalScore,
        threshold: heuristicResult.threshold,
        exceedsThreshold: heuristicResult.exceedsThreshold,
        breakdown: heuristicResult.breakdown,
      },
      layer3_llm: {
        invoked: heuristicResult.exceedsThreshold || verificationResult.hasCriticalFindings,
      },
      layer4_verification: {
        totalFindings: verificationResult.totalFindings,
        findings: verificationResult.findings,
      },
      processingTimeMs: processingTime,
    },
    classification,
  };
}

module.exports = { runPipeline };
