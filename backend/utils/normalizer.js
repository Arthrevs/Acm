const { levenshtein } = require('../layers/verificationGate');

const dictionary = {
  // Financial terms
  pyse: 'money', paise: 'money', paisa: 'money', rupya: 'rupee', rs: 'rupees',
  baink: 'bank', bnk: 'bank', bænk: 'bank', bankk: 'bank',
  pancard: 'pan card', pncard: 'pan card', pan: 'pan card',
  kycc: 'kyc', keyyc: 'kyc', 
  acount: 'account', acnt: 'account', ac: 'account',
  
  // Urgency/Threats
  blck: 'block', blok: 'block', blockk: 'block',
  suspnd: 'suspend', sspnd: 'suspend',
  imdtly: 'immediately', jaldi: 'immediately', turant: 'immediately',
  
  // Services & Identity
  bijli: 'electricity', light: 'electricity',
  upii: 'upi', upe: 'upi',
  lottry: 'lottery', lotary: 'lottery', lotery: 'lottery',
  sport: 'support', spport: 'support', suporrt: 'support',
  exectv: 'executive', exec: 'executive',
  offcr: 'officer', offcer: 'officer',
  dpt: 'department', dept: 'department',
  cstmr: 'customer', cstmer: 'customer',
  
  // Extraction
  shr: 'share', shre: 'share',
  tel: 'tell',
  snd: 'send',
  
  // Negations
  nhi: 'nahi', naah: 'nahi', dnt: 'dont', nat: 'not'
};

function normalizeText(text) {
  let normalized = text.toLowerCase();
  for (const [misspelled, standard] of Object.entries(dictionary)) {
    const regex = new RegExp(`\\b${misspelled}\\b`, 'gi');
    normalized = normalized.replace(regex, standard);
  }
  return normalized;
}

// Token-based fuzzy matcher to catch deliberate evasion (supports gaps)
function fuzzyMatchPhrase(normalizedText, phrase, maxDistance = 1) {
  const textTokens = normalizedText.split(/\s+/);
  const phraseTokens = phrase.split(/\s+/);
  
  if (phraseTokens.length === 0) return { matched: false, index: -1 };
  
  for (let i = 0; i < textTokens.length; i++) {
    const textTok = textTokens[i].replace(/[^\w]/g, '');
    const phraseTok0 = phraseTokens[0].replace(/[^\w]/g, '');
    if (!textTok || !phraseTok0) continue;
    
    if (textTok === phraseTok0 || levenshtein(textTok, phraseTok0) <= maxDistance) {
      let currentTextIdx = i + 1;
      let matchedAll = true;

      for (let j = 1; j < phraseTokens.length; j++) {
        let foundNext = false;
        const phraseTok = phraseTokens[j].replace(/[^\w]/g, '');
        if (!phraseTok) continue;
        
        // Allow a gap of up to 3 words (e.g. 'share your new otp')
        for (let gap = 0; gap <= 3 && currentTextIdx + gap < textTokens.length; gap++) {
          const nextTextTok = textTokens[currentTextIdx + gap].replace(/[^\w]/g, '');
          if (!nextTextTok) continue;
          
          if (nextTextTok === phraseTok || levenshtein(nextTextTok, phraseTok) <= maxDistance) {
            foundNext = true;
            currentTextIdx = currentTextIdx + gap + 1;
            break;
          }
        }
        if (!foundNext) {
          matchedAll = false;
          break;
        }
      }
      
      if (matchedAll) return { matched: true, index: i };
    }
  }
  return { matched: false, index: -1 };
}

module.exports = { normalizeText, dictionary, fuzzyMatchPhrase };
