const { fuzzyMatchPhrase } = require('../utils/normalizer');

/**
 * Layer 2: Structural Tripwire (NOT a classifier)
 * 
 * This layer does NOT make verdicts. It computes a suspicion score
 * that determines whether the message should be escalated to the
 * Multi-Agent LLM pipeline for contextual analysis.
 * 
 * If suspicion_score === 0, the message is pure conversational noise
 * and can be fast-pathed as SAFE without burning an API call.
 * If suspicion_score > 0, the message MUST go to the LLM agents.
 */

// Structural friction signals (not verdicts — just tripwires)
const FRICTION_SIGNALS = {
  // Identity claims — someone claiming to be from an institution
  identity: [
    'bank', 'customer support', 'delivery partner', 'department', 'executive',
    'sbi', 'hdfc', 'icici', 'axis', 'paytm', 'phonepe', 'police', 'cbi', 'customs', 'fedex', 'narcotics',
    'electricity', 'discom', 'officer'
  ],
  // Pressure language — urgency or threat
  pressure: [
    'immediately', 'urgent', 'hurry', 'last chance', 'today only', 'now only',
    'block', 'blocked', 'suspend', 'suspended', 'deactivate', 'cancel', 'cancelled', 'terminate', 'freeze',
    'arrest', 'arrested', 'illegal', 'disconnect', 'disconnected', 'detain', 'detained', 'penalty',
    'expire', 'expires', 'expired'
  ],
  // Extraction language — requests to hand over something or perform an action
  extraction: [
    'share otp', 'tell otp', 'send otp',
    'share pin', 'tell pin', 'send pin',
    'share cvv', 'tell cvv', 'send cvv',
    'share password', 'tell password',
    'share card number', 'tell card number',
    'advance payment', 'token amount', 'deposit fee', 'registration fee',
    'download apk', 'install apk', 'quicksupport',
    'update pan', 'update kyc', 'open upi', 'approve request', 'enter pin'
  ]
};

const NEGATION_TOKENS = ['not', 'nahi', 'mat', 'dont', 'never', 'kabhi', 'if'];

function checkNegation(textTokens, matchIndex, windowSize = 8) {
  const start = Math.max(0, matchIndex - windowSize);
  const precedingTokens = textTokens.slice(start, matchIndex);
  for (const rawToken of precedingTokens) {
    const token = rawToken.replace(/[^\w]/g, '').toLowerCase();
    if (NEGATION_TOKENS.includes(token)) {
      return true;
    }
  }
  return false;
}

/**
 * Computes a suspicion score across D/P/A dimensions.
 * Returns the score and breakdown. Does NOT return a verdict.
 */
function scoreHeuristics(normalizedText, extractedEntities) {
  let identityScore = 0;
  let pressureScore = 0;
  let extractionScore = 0;
  const breakdown = [];

  const textTokens = normalizedText.split(/\s+/);

  const applyPatterns = (patterns, points, dimensionName) => {
    let dimScore = 0;
    for (const pattern of patterns) {
      const matchObj = fuzzyMatchPhrase(normalizedText, pattern, 1);
      if (matchObj.matched) {
        const isNegated = checkNegation(textTokens, matchObj.index);
        if (isNegated) {
          breakdown.push({ rule: `${dimensionName} neutralized by negation`, points: 0, match: pattern });
        } else {
          dimScore += points;
          breakdown.push({ rule: `${dimensionName} signal detected`, points, match: pattern });
          break;
        }
      }
    }
    return dimScore;
  };

  identityScore += applyPatterns(FRICTION_SIGNALS.identity, 10, 'Identity');
  pressureScore += applyPatterns(FRICTION_SIGNALS.pressure, 15, 'Pressure');
  extractionScore += applyPatterns(FRICTION_SIGNALS.extraction, 25, 'Extraction');

  // Structural friction: URLs and domains
  const urls = extractedEntities.urls || [];
  for (const url of urls) {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.match(/\.(xyz|tk|ml|ga|cf|gq|pw)$/i) || lowerUrl.match(/(bit\.ly|tinyurl\.com|is\.gd|cutt\.ly|rb\.gy)/i)) {
      extractionScore += 40;
      breakdown.push({ rule: 'Suspicious URL structure', points: 40, match: url });
      break;
    }
    if (lowerUrl.match(/\.(apk|exe)$/i)) {
      extractionScore += 40;
      breakdown.push({ rule: 'Executable download link', points: 40, match: url });
      break;
    }
  }

  // Structural friction: money symbols (₹, Rs, rupees, etc.)
  if (/₹|rs\.?\s*\d|rupees?\s*\d|\d+\s*rupees?/i.test(normalizedText)) {
    breakdown.push({ rule: 'Money amount detected', points: 5, match: 'currency reference' });
    extractionScore += 5;
  }

  // Structural friction: financial context (NOT a scam pattern — a domain marker)
  // Any message that touches financial instruments must be evaluated by the LLM.
  // The LLM decides if it's a scam. We just flag "this is about money."
  const FINANCIAL_CONTEXT = /\b(upi|payment|pay\b|transaction|refund|account|transfer|credited|debited|neft|imps|rtgs|gpay|phonepe|paytm|bhim|wallet|collect\s*request|amount|approve.*(?:request|payment|transaction))\b/i;
  const financialMatch = normalizedText.match(FINANCIAL_CONTEXT);
  if (financialMatch) {
    breakdown.push({ rule: 'Financial context detected', points: 5, match: financialMatch[0] });
    extractionScore += 5;
  }

  // Structural friction: phone numbers
  const phones = extractedEntities.phones || [];
  if (phones.length > 0) {
    breakdown.push({ rule: 'Phone number detected', points: 5, match: phones[0] });
    identityScore += 5;
  }

  const totalScore = identityScore + pressureScore + extractionScore;

  return {
    totalScore,
    dimensions: {
      identity: identityScore,
      pressure: pressureScore,
      extraction: extractionScore
    },
    breakdown,
    // This is the ONLY decision this layer makes:
    // Does this message have ANY structural friction, or is it pure noise?
    needsEscalation: totalScore > 0
  };
}

module.exports = { scoreHeuristics };
