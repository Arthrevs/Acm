const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { runPipeline } = require('./services/pipeline');
const { extractTextFromImage } = require('./services/vision');
const { initLogoHashes, scanForLogos } = require('./services/logoDetector');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../frontend')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Vernacular SMS Phishing Classifier API', layers: 4 });
});

/**
 * POST /api/scan
 * Receives raw SMS/chat text and runs it through the full 4-layer pipeline.
 */
app.post('/api/scan', async (req, res) => {
  try {
    const { message, threshold } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Missing message in request body.' });
    }
    
    // Run the full 4-layer pipeline with optional custom threshold
    const result = await runPipeline(message, threshold ? parseInt(threshold, 10) : 30);
    res.json(result);
  } catch (err) {
    console.error('Scan endpoint error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message, stack: err.stack });
  }
});

/**
 * POST /api/scan-image
 * Receives a base64 screenshot, extracts text with Gemini Vision, and runs it through the pipeline.
 */
app.post('/api/scan-image', async (req, res) => {
  try {
    const { image_base64, mime_type, threshold } = req.body;
    if (!image_base64) {
      return res.status(400).json({ error: 'Missing image_base64 in request body.' });
    }

    console.log(`Processing image payload (${mime_type}) using OCR...`);

    // Run OCR and logo detection in parallel — no wasted time
    const [extractedText, logoMatches] = await Promise.all([
      extractTextFromImage(image_base64, mime_type),
      scanForLogos(image_base64, mime_type)
    ]);

    console.log(`Extracted text: "${extractedText.substring(0, 50)}..."`);
    if (logoMatches.length > 0) {
      console.log(`[LogoDetector] Found ${logoMatches.length} brand match(es): ${logoMatches.map(m => m.brand).join(', ')}`);
    }
    
    // Run the extracted text through the full 4-layer pipeline
    const result = await runPipeline(extractedText, threshold ? parseInt(threshold, 10) : 30);
    
    // Attach the raw extracted text so the frontend can display it
    result.extracted_text = extractedText;

    // Attach logo detection results
    if (logoMatches.length > 0) {
      result.logo_detections = logoMatches;
    }
    
    res.json(result);
  } catch (err) {
    console.error('Scan image endpoint error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message, stack: err.stack });
  }
});

// Start the server (Render/Localhost)
// Vercel handles the server start automatically via module.exports
if (!process.env.VERCEL) {
  // Pre-load logo fingerprints before accepting requests
  initLogoHashes().then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 VaaniGuard API running on port ${PORT}`);
      console.log(`   4-Layer Pipeline: Context → Heuristics → LLM → Verification`);
      console.log(`   Endpoints: POST /api/scan, POST /api/scan-image`);
    });
  });
}

module.exports = app;
