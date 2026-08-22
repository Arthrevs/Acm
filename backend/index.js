const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { runPipeline } = require('./services/pipeline');
const { extractTextFromImage } = require('./services/llm');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/dist')));

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
    let { message, image, threshold } = req.body;

    if (!message && !image) {
      return res.status(400).json({ error: 'Missing message or image in request body.' });
    }
    
    // Ensure message is a string
    message = message || "";

    // If an image is provided, extract text using Gemini OCR
    if (image && image.data && image.mimeType) {
      console.log(`Processing image payload (${image.mimeType}) using OCR...`);
      const extractedText = await extractTextFromImage(image.data, image.mimeType);
      console.log(`Extracted text: "${extractedText.substring(0, 50)}..."`);
      
      // Combine extracted text with any user-provided message
      if (message.trim()) {
        message = `[User Note: ${message}]\n\n[Extracted from Image]:\n${extractedText}`;
      } else {
        message = extractedText;
      }
    }

    // Run the full 4-layer pipeline with optional custom threshold
    const result = await runPipeline(message, threshold ? parseInt(threshold, 10) : 30);
    res.json(result);

  } catch (err) {
    console.error('Scan endpoint error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// React Catch-All Route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Vernacular Phishing Classifier API running on http://localhost:${PORT}`);
  console.log(`   4-Layer Pipeline: Context → Heuristics → LLM → Verification`);
  console.log(`   Endpoint ready: POST http://localhost:${PORT}/api/scan`);
});
