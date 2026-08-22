/**
 * Logo Detector — Local Brand Impersonation Scanner
 * 
 * Uses perceptual hashing (dHash) to detect known Indian bank/fintech logos
 * in uploaded screenshots. Zero API keys required — runs entirely locally.
 * 
 * How it works:
 *   1. On server start, pre-computes dHash fingerprints for all logos in assets/logos/
 *   2. When a screenshot is uploaded, divides it into overlapping tiles
 *   3. Computes dHash for each tile and compares against known logo hashes
 *   4. Reports any matches as "Potential Brand Impersonation"
 */

const Jimp = require('jimp');
const path = require('path');
const fs = require('fs');

const LOGOS_DIR = path.join(__dirname, '../assets/logos');
const HASH_SIZE = 8; // 8x9 pixels → 64-bit hash
const SIMILARITY_THRESHOLD = 12; // Max Hamming distance (out of 64) for a match. Lower = stricter.
const TILE_SCALES = [0.15, 0.2, 0.3]; // Scan at 15%, 20%, 30% of image size
const TILE_STEP = 0.5; // Overlap: step 50% of tile size

// Cache of pre-computed logo hashes { brandName: hash }
let logoHashes = {};
let initialized = false;

/**
 * Compute a difference hash (dHash) for an image buffer.
 * Resizes to (HASH_SIZE+1) x HASH_SIZE grayscale, then compares adjacent pixels.
 * Returns a BigInt representing the 64-bit hash.
 */
async function computeDHash(jimpImage) {
  const img = jimpImage.clone()
    .resize(HASH_SIZE + 1, HASH_SIZE)
    .greyscale();

  let hash = BigInt(0);
  let bit = 0;

  for (let y = 0; y < HASH_SIZE; y++) {
    for (let x = 0; x < HASH_SIZE; x++) {
      const left = Jimp.intToRGBA(img.getPixelColor(x, y)).r;
      const right = Jimp.intToRGBA(img.getPixelColor(x + 1, y)).r;
      if (left > right) {
        hash |= (BigInt(1) << BigInt(bit));
      }
      bit++;
    }
  }

  return hash;
}

/**
 * Compute the Hamming distance between two hashes.
 */
function hammingDistance(hash1, hash2) {
  let xor = hash1 ^ hash2;
  let dist = 0;
  while (xor > BigInt(0)) {
    dist += Number(xor & BigInt(1));
    xor >>= BigInt(1);
  }
  return dist;
}

/**
 * Initialize: load all logo images from assets/logos/ and compute their hashes.
 * Called once on server startup.
 */
async function initLogoHashes() {
  if (initialized) return;

  try {
    if (!fs.existsSync(LOGOS_DIR)) {
      console.log('[LogoDetector] No logos directory found. Skipping initialization.');
      initialized = true;
      return;
    }

    const files = fs.readdirSync(LOGOS_DIR).filter(f => 
      /\.(png|jpg|jpeg|bmp)$/i.test(f)
    );

    if (files.length === 0) {
      console.log('[LogoDetector] No logo files found in assets/logos/.');
      initialized = true;
      return;
    }

    for (const file of files) {
      // Extract brand name before the underscore (e.g., 'sbi_1.jpg' -> 'SBI')
      const baseName = path.basename(file, path.extname(file));
      const brandName = baseName.split('_')[0].toUpperCase();
      const filePath = path.join(LOGOS_DIR, file);
      
      try {
        const img = await Jimp.read(filePath);
        const hash = await computeDHash(img);
        logoHashes[brandName] = hash;
        console.log(`[LogoDetector] Loaded fingerprint: ${brandName}`);
      } catch (err) {
        console.warn(`[LogoDetector] Failed to hash ${file}: ${err.message}`);
      }
    }

    console.log(`[LogoDetector] Initialized with ${Object.keys(logoHashes).length} brand fingerprints.`);
    initialized = true;
  } catch (err) {
    console.error('[LogoDetector] Init error:', err.message);
    initialized = true;
  }
}

/**
 * Scan a screenshot (base64) for known brand logos.
 * Divides the image into overlapping tiles at multiple scales,
 * then compares each tile's dHash against known brand hashes.
 *
 * @param {string} imageBase64 - Raw base64-encoded image (no data: prefix)
 * @param {string} mimeType - MIME type of the image
 * @returns {Promise<Array>} Array of { brand, confidence, region }
 */
async function scanForLogos(imageBase64, mimeType = 'image/png') {
  if (!initialized) await initLogoHashes();
  if (Object.keys(logoHashes).length === 0) return [];

  try {
    const buffer = Buffer.from(imageBase64, 'base64');
    const image = await Jimp.read(buffer);
    const imgW = image.bitmap.width;
    const imgH = image.bitmap.height;

    const matches = [];
    const seenBrands = new Set();

    for (const scale of TILE_SCALES) {
      const tileW = Math.floor(imgW * scale);
      const tileH = Math.floor(imgH * scale);
      if (tileW < 16 || tileH < 16) continue;

      const stepX = Math.floor(tileW * TILE_STEP);
      const stepY = Math.floor(tileH * TILE_STEP);

      for (let y = 0; y <= imgH - tileH; y += stepY) {
        for (let x = 0; x <= imgW - tileW; x += stepX) {
          const tile = image.clone().crop(x, y, tileW, tileH);
          const tileHash = await computeDHash(tile);

          for (const [brand, logoHash] of Object.entries(logoHashes)) {
            if (seenBrands.has(brand)) continue;

            const dist = hammingDistance(tileHash, logoHash);
            if (dist <= SIMILARITY_THRESHOLD) {
              const confidence = Math.round((1 - dist / 64) * 100);
              matches.push({
                brand,
                confidence,
                distance: dist,
                region: `tile at (${x},${y}) scale ${Math.round(scale * 100)}%`
              });
              seenBrands.add(brand);
              console.log(`[LogoDetector] Match: ${brand} (confidence: ${confidence}%, hamming: ${dist})`);
            }
          }
        }
      }
    }

    return matches;
  } catch (err) {
    console.error('[LogoDetector] Scan error:', err.message);
    return [];
  }
}

module.exports = { initLogoHashes, scanForLogos };
