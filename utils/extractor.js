/**
 * Extracts URLs and Phone Numbers from a given text string.
 */
function extractEntities(text) {
  // Regex for extracting URLs (http/https or www)
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/gi;
  
  // Regex for extracting Indian phone numbers and generic long numbers
  // Matches +91, 0, or raw 10 digit numbers
  const phoneRegex = /(?:\+?91[\s-]?)?(?:\d{5}[\s-]?\d{5}|\d{10})/g;

  const urls = text.match(urlRegex) || [];
  const phones = text.match(phoneRegex) || [];

  // Deduplicate results
  return {
    urls: [...new Set(urls)],
    phones: [...new Set(phones)]
  };
}

module.exports = { extractEntities };
