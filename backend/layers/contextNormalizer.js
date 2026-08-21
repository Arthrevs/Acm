/**
 * Layer 1: Context & Length Normalizer
 * 
 * Strips conversational filler from long chat transcripts,
 * isolates high-density friction points (URLs, phones, payment demands),
 * and flags the "Message of Interest" where risk is introduced.
 */

// Common conversational filler in Hinglish/English chats
const FILLER_PATTERNS = [
  /^(hi|hello|hey|hii+|helo+)[\s!.]*$/i,
  /^(ok|okay|okk+|okie|k|kk+)[\s!.]*$/i,
  /^(haanji|hanji|haan|ha+n|ji|jee|accha|acha)[\s!.]*$/i,
  /^(thanks|thanku|thank you|thnx|thx|ty|shukriya|dhanyavaad)[\s!.]*$/i,
  /^(bye|byee+|alvida|tata)[\s!.]*$/i,
  /^(hmm+|hm+|umm+)[\s!.]*$/i,
  /^(yes|no|nahi|nhi|haa|na)[\s!.]*$/i,
  /^(good morning|good night|gm|gn)[\s!.]*$/i,
  /^(is this available\??|available\??|still available\??)$/i,
  /^(interested|i am interested|mai interested hu)[\s!.]*$/i,
  /^(tell me|batao|bolo)[\s!.]*$/i,
  /^(sir|madam|bhai|bro|boss|dear)[\s!.,]*$/i,
  /^[\s]*$/,  // empty lines
];

// Patterns that indicate high-density friction points
const FRICTION_PATTERNS = {
  urls: /(https?:\/\/[^\s]+|www\.[^\s]+|bit\.ly\/[^\s]+|[a-zA-Z0-9][-a-zA-Z0-9]*\.(com|in|co|net|org|xyz|info|io|app|link|click|top|pw|tk|ml|ga|cf|gq|buzz)(?:\/[^\s]*)?)/gi,
  phones: /(?:\+?91[\s-]?)?(?:\d{5}[\s-]?\d{5}|\d{10})/g,
  paymentDemands: /\b(paytm|phonepe|phone\s*pe|gpay|google\s*pay|upi|bhim|neft|imps|rtgs|bank\s*transfer|account\s*number|ac\s*no|ifsc|scan|qr\s*code|qr|payment|pay\s*kar|paise|pyse|rupay|rupees?|rs\.?|₹|\bpay\b)\b/gi,
  offPlatform: /\b(whatsapp|watsapp|whats\s*app|telegram|signal|call\s*kar|msg\s*kar|dm\s*kar|inbox|personal\s*number|direct\s*contact)\b/gi,
};

/**
 * Determines if a line is conversational filler.
 */
function isFiller(line) {
  const trimmed = line.trim();
  if (trimmed.length === 0) return true;
  if (trimmed.length < 4 && !/\d/.test(trimmed)) return true;  // very short non-numeric lines
  return FILLER_PATTERNS.some(pattern => pattern.test(trimmed));
}

/**
 * Scores a single message/chunk for friction density.
 * Returns an object with the message, friction score, and matched entities.
 */
function scoreFriction(text) {
  const friction = {
    urls: (text.match(FRICTION_PATTERNS.urls) || []),
    phones: (text.match(FRICTION_PATTERNS.phones) || []),
    paymentDemands: (text.match(FRICTION_PATTERNS.paymentDemands) || []),
    offPlatform: (text.match(FRICTION_PATTERNS.offPlatform) || []),
  };

  const density =
    friction.urls.length * 4 +
    friction.phones.length * 2 +
    friction.paymentDemands.length * 3 +
    friction.offPlatform.length * 2;

  return { friction, density };
}

/**
 * Main Layer 1 function.
 * Takes raw text (which could be a single SMS or a long multi-message chat),
 * strips filler, chunks it, and returns the high-density friction points
 * along with the flagged "Message of Interest."
 */
function normalizeContext(rawText) {
  // Split into individual messages/lines
  const lines = rawText.split(/\n|\r\n/).map(l => l.trim()).filter(Boolean);

  // Strip filler
  const substantiveLines = lines.filter(line => !isFiller(line));

  // If very short input (single SMS), treat the whole thing as one chunk
  if (substantiveLines.length <= 3) {
    const combined = substantiveLines.join(' ');
    const { friction, density } = scoreFriction(combined);
    return {
      originalLineCount: lines.length,
      filteredLineCount: substantiveLines.length,
      fillerStripped: lines.length - substantiveLines.length,
      chunks: [{
        text: combined,
        index: 0,
        density,
        friction,
        isMessageOfInterest: true,
      }],
      messageOfInterest: combined,
    };
  }

  // Sliding window: group into chunks of 3 lines with overlap of 1
  const WINDOW_SIZE = 3;
  const STEP = 2;
  const chunks = [];

  for (let i = 0; i < substantiveLines.length; i += STEP) {
    const windowLines = substantiveLines.slice(i, i + WINDOW_SIZE);
    const chunkText = windowLines.join(' ');
    const { friction, density } = scoreFriction(chunkText);

    chunks.push({
      text: chunkText,
      index: chunks.length,
      density,
      friction,
      isMessageOfInterest: false,
    });
  }

  // Flag the chunk with the highest friction density as the Message of Interest
  let maxDensity = -1;
  let moiIndex = 0;
  chunks.forEach((chunk, i) => {
    if (chunk.density > maxDensity) {
      maxDensity = chunk.density;
      moiIndex = i;
    }
  });

  if (chunks.length > 0) {
    chunks[moiIndex].isMessageOfInterest = true;
  }

  // Collect all high-density chunks (density > 0)
  const highDensityChunks = chunks.filter(c => c.density > 0);

  return {
    originalLineCount: lines.length,
    filteredLineCount: substantiveLines.length,
    fillerStripped: lines.length - substantiveLines.length,
    chunks: highDensityChunks.length > 0 ? highDensityChunks : [chunks[moiIndex] || chunks[0]],
    messageOfInterest: chunks[moiIndex]?.text || substantiveLines[substantiveLines.length - 1],
  };
}

module.exports = { normalizeContext, isFiller, scoreFriction };
