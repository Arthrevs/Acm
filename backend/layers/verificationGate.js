/**
 * Layer 4: Verification Cross-Check (The Final Gate)
 * 
 * Cross-references extracted entities against:
 * - A local domain blacklist
 * - Typosquatting detection via Levenshtein distance against known brand domains
 */

// Known legitimate brand domains
const BRAND_DOMAINS = [
  'paytm.com', 'phonepe.com', 'gpay.com', 'google.com', 'razorpay.com',
  'sbi.co.in', 'hdfcbank.com', 'icicibank.com', 'axisbank.com',
  'kotak.com', 'yesbank.in', 'airtel.in', 'jio.com',
  'flipkart.com', 'amazon.in', 'olx.in', 'quikr.com',
  'swiggy.com', 'zomato.com', 'ola.com', 'uber.com',
  'irctc.co.in', 'indianrailways.gov.in',
];

// Hardcoded blacklist of known scam domain fragments
const DOMAIN_BLACKLIST = [
  'secure-kyc', 'verify-account', 'update-pan', 'link-aadhar',
  'free-recharge', 'prize-claim', 'lottery-win', 'lucky-draw',
  'cash-back-offer', 'refund-process', 'pending-payment',
  'paytm-secure', 'phonepe-verify', 'gpay-refund',
  'sbi-update', 'hdfc-secure', 'icici-verify',
  'pay-bijli', 'electricity-bill', 'gas-bill-pay',
];

/**
 * Levenshtein distance between two strings.
 */
function levenshtein(a, b) {
  const matrix = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return matrix[a.length][b.length];
}

/**
 * Extracts the domain from a URL string.
 */
function extractDomain(url) {
  try {
    let cleaned = url.toLowerCase().trim();
    if (!cleaned.startsWith('http')) cleaned = 'https://' + cleaned;
    const parsed = new URL(cleaned);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    // Fallback: try to extract domain-like pattern
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    return match ? match[1].toLowerCase() : url.toLowerCase();
  }
}

/**
 * Checks a domain for typosquatting against known brands.
 * Returns the brand it's impersonating if suspicious, null otherwise.
 */
function detectTyposquatting(domain) {
  for (const brand of BRAND_DOMAINS) {
    const brandBase = brand.split('.')[0]; // e.g., "paytm" from "paytm.com"
    const domainBase = domain.split('.')[0];

    // Skip if it IS the real domain
    if (domain === brand) return null;

    // Check if the domain contains the brand name (e.g., "paytm-secure-kyc.in")
    if (domain.includes(brandBase) && domain !== brand) {
      return { impersonating: brand, domain, method: 'brand-name-in-domain' };
    }

    // Levenshtein distance check (catches "paytm.com", "paytnn.com")
    const distance = levenshtein(domainBase, brandBase);
    if (distance > 0 && distance <= 2 && domainBase.length >= 3) {
      return { impersonating: brand, domain, method: 'typosquatting', distance };
    }
  }
  return null;
}

/**
 * Main Layer 4 function.
 * Runs verification cross-checks on all extracted URLs.
 */
function verifyEntities(extractedEntities) {
  const urls = extractedEntities.urls || [];
  const findings = [];

  for (const url of urls) {
    const domain = extractDomain(url);

    // Check against blacklist
    const blacklisted = DOMAIN_BLACKLIST.some(fragment => domain.includes(fragment));
    if (blacklisted) {
      findings.push({
        type: 'blacklisted_domain',
        url,
        domain,
        severity: 'HIGH',
        reason: `Domain matches known scam pattern`,
      });
      continue;
    }

    // Check for typosquatting
    const typosquat = detectTyposquatting(domain);
    if (typosquat) {
      findings.push({
        type: 'typosquatting',
        url,
        domain,
        severity: 'HIGH',
        reason: `Possible impersonation of ${typosquat.impersonating} (${typosquat.method})`,
        details: typosquat,
      });
      continue;
    }
  }

  return {
    totalFindings: findings.length,
    findings,
    hasCriticalFindings: findings.some(f => f.severity === 'HIGH'),
  };
}

module.exports = { verifyEntities, detectTyposquatting, levenshtein };
