/**
 * Extracts URLs, Phone Numbers, and UPI IDs from a given text string.
 */
function extractEntities(text) {
  // Regex for extracting URLs (http/https or www)
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/gi;
  
  // Regex for extracting Indian phone numbers and generic long numbers
  // Matches +91, 0, or raw 10 digit numbers
  const phoneRegex = /(?:\+?91[\s-]?)?(?:\d{5}[\s-]?\d{5}|\d{10})/g;

  // Regex for extracting UPI IDs (e.g., name@okhdfcbank, 9999999999@ybl, user@paytm)
  const upiRegex = /[a-zA-Z0-9._-]+@[a-zA-Z]{2,}/g;
  
  // Known UPI handles to filter real UPI IDs from email addresses
  const upiHandles = [
    'upi', 'ybl', 'paytm', 'okhdfcbank', 'okicici', 'okaxis', 'oksbi',
    'apl', 'axisbank', 'ibl', 'sbi', 'hdfcbank', 'icici', 'kotak',
    'indus', 'federal', 'boi', 'cbin', 'pnb', 'unionbank', 'canara',
    'idbi', 'rbl', 'dbs', 'hsbc', 'sc', 'citi', 'jupiter', 'fam',
    'ikwik', 'waaxis', 'wahdfcbank', 'wasbi', 'axl', 'idfcbank',
    'yesbankltd', 'bandhan', 'kbl', 'utbi', 'dlb', 'aubank',
    'indianbank', 'barodampay', 'mahb', 'jkb', 'kvb', 'uco',
    'postbank', 'slice', 'nsdlbank'
  ];

  const urls = text.match(urlRegex) || [];
  const phones = text.match(phoneRegex) || [];
  
  // Extract potential UPI IDs and filter out regular email addresses
  const rawUpiMatches = text.match(upiRegex) || [];
  const upis = rawUpiMatches.filter(match => {
    const handle = match.split('@')[1].toLowerCase();
    return upiHandles.includes(handle);
  });

  // Deduplicate results
  return {
    urls: [...new Set(urls)],
    phones: [...new Set(phones)],
    upis: [...new Set(upis)]
  };
}

module.exports = { extractEntities };
