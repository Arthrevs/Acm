/**
 * Layer 2: Deterministic Risk Scoring Engine (Heuristics)
 * 
 * Runs purely rule-based checks BEFORE touching the AI.
 * Adds raw structural score points based on pattern matches.
 */

// Suspicious URL shorteners and risky TLDs
const SUSPICIOUS_DOMAINS = [
  'bit.ly', 'tinyurl.com', 'is.gd', 'rb.gy', 'cutt.ly', 'shorturl.at',
  't.co', 'ow.ly', 'goo.gl', 'buff.ly',
];

const RISKY_TLDS = [
  '.xyz', '.tk', '.ml', '.ga', '.cf', '.gq', '.buzz', '.top', '.pw',
  '.click', '.link', '.info', '.club', '.online', '.site', '.space',
];

// APK / executable patterns
const APK_PATTERN = /\.(apk|exe|msi|dmg|deb|rpm)\b/i;

// QR code mention patterns (Hindi/English)
const QR_PATTERNS = [
  /qr\s*code/i,
  /scan\s*kar(ein|o|na)?/i,
  /scan\s*kijiye/i,
  /qr\s*bhej/i,
  /qr\s*send/i,
  /\bscan\b.*\b(pay|payment|upi)\b/i,
  /\b(pay|payment|upi)\b.*\bscan\b/i,
];

// Off-platform diversion patterns
const OFF_PLATFORM_PATTERNS = [
  /whatsapp\s*(par|pe|pr|p)\s*(aa|aao|aajao|contact|msg|message|baat)/i,
  /watsapp\s*(par|pe|pr|p)/i,
  /telegram\s*(par|pe|pr|p)/i,
  /call\s*(kar|karo|karein|kijiye|me)/i,
  /direct\s*(contact|call|message|baat)/i,
  /personal\s*number/i,
  /\b(msg|dm|inbox)\s*(kar|karo|me)\b/i,
];

// Urgency / pressure tactics
const URGENCY_PATTERNS = [
  /\b(turant|jaldi|abhi|immediately|urgent|hurry|last\s*chance|expir|limit(ed)?)\b/i,
  /\b(aaj\s*hi|today\s*only|now\s*only|offer\s*end|jaldi\s*kar)\b/i,
  /\b(block|suspend|deactivat|cancel|terminat)\b/i,
  /\b(blck|blok|suspnd|sspnd|delet)\b/i,
];

// Advance payment / deposit demands
const ADVANCE_PAYMENT_PATTERNS = [
  /\b(advance|token|booking\s*amount|deposit|registration\s*fee)\b/i,
  /\b(pehle|pahle)\s*(pay|paisa|paise|pyse|bhej|send|transfer)\b/i,
  /\b(pay|send|transfer)\s*(first|pehle|pahle)\b/i,
  /\b(shipping|delivery)\s*(charge|fee|cost)\b.*\b(pay|bhej|send)\b/i,
];

/**
 * Scores a set of Layer 1 chunks using deterministic heuristics.
 * Returns the total score, a breakdown, and whether it crosses the threshold.
 */
function scoreHeuristics(chunks, extractedEntities) {
  let totalScore = 0;
  const breakdown = [];
  const allText = chunks.map(c => c.text).join(' ');

  // --- Check 1: External/Suspicious Links (+40) ---
  const urls = extractedEntities.urls || [];
  for (const url of urls) {
    const lowerUrl = url.toLowerCase();

    // Check shorteners
    if (SUSPICIOUS_DOMAINS.some(d => lowerUrl.includes(d))) {
      totalScore += 40;
      breakdown.push({ rule: 'Suspicious URL shortener detected', points: 40, match: url });
      continue;
    }

    // Check risky TLDs
    if (RISKY_TLDS.some(tld => lowerUrl.includes(tld))) {
      totalScore += 40;
      breakdown.push({ rule: 'Risky TLD in URL', points: 40, match: url });
      continue;
    }

    // Check APK / executable download
    if (APK_PATTERN.test(lowerUrl)) {
      totalScore += 40;
      breakdown.push({ rule: 'Executable/APK download link', points: 40, match: url });
      continue;
    }

    // Generic external link (not a known safe domain)
    totalScore += 15;
    breakdown.push({ rule: 'External link detected', points: 15, match: url });
  }

  // --- Check 2: QR Code Mention (+30) ---
  for (const pattern of QR_PATTERNS) {
    const match = allText.match(pattern);
    if (match) {
      totalScore += 30;
      breakdown.push({ rule: 'QR code scan request', points: 30, match: match[0] });
      break; // only count once
    }
  }

  // --- Check 3: Off-Platform Diversion (+20) ---
  for (const pattern of OFF_PLATFORM_PATTERNS) {
    const match = allText.match(pattern);
    if (match) {
      totalScore += 20;
      breakdown.push({ rule: 'Attempt to move off-platform', points: 20, match: match[0] });
      break;
    }
  }

  // --- Check 4: Urgency / Pressure Tactics (+15) ---
  for (const pattern of URGENCY_PATTERNS) {
    const match = allText.match(pattern);
    if (match) {
      totalScore += 15;
      breakdown.push({ rule: 'Urgency/pressure language', points: 15, match: match[0] });
      break;
    }
  }

  // --- Check 5: Advance Payment Demand (+25) ---
  for (const pattern of ADVANCE_PAYMENT_PATTERNS) {
    const match = allText.match(pattern);
    if (match) {
      totalScore += 25;
      breakdown.push({ rule: 'Advance payment demand', points: 25, match: match[0] });
      break;
    }
  }

  // Threshold: if score >= 30, flag for deep analysis
  const THRESHOLD = 30;

  return {
    totalScore,
    breakdown,
    exceedsThreshold: totalScore >= THRESHOLD,
    threshold: THRESHOLD,
  };
}

module.exports = { scoreHeuristics };
