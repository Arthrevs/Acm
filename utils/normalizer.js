/**
 * A basic phonetic/transliteration dictionary.
 * Maps common vernacular misspellings in Latin script to their normalized English equivalents.
 */
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
  
  // Services
  bijli: 'electricity', light: 'electricity',
  upii: 'upi', upe: 'upi',
  lottry: 'lottery', lotary: 'lottery', lotery: 'lottery'
};

/**
 * Normalizes a raw SMS string by replacing phonetic misspellings with standard terms.
 */
function normalizeText(text) {
  let normalized = text.toLowerCase();
  
  // Replace based on dictionary boundaries (using regex for exact word matches)
  for (const [misspelled, standard] of Object.entries(dictionary)) {
    const regex = new RegExp(`\\b${misspelled}\\b`, 'gi');
    normalized = normalized.replace(regex, standard);
  }
  
  return normalized;
}

module.exports = { normalizeText, dictionary };
