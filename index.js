const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { normalizeText } = require('./utils/normalizer');
const { extractEntities } = require('./utils/extractor');
const { classifyMessage } = require('./services/llm');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Basic health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'Vernacular SMS Phishing Classifier API' });
});

/**
 * POST /api/scan
 * Receives raw SMS text, normalizes it, extracts entities, and calls the LLM.
 */
app.post('/api/scan', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid "message" field in request body.' });
    }

    // 1. Normalize the phonetic vernacular misspellings
    const normalizedMessage = normalizeText(message);

    // 2. Extract URLs and Phone Numbers
    const entities = extractEntities(message);

    // 3. Call the LLM with forced JSON output
    let classificationResult;
    try {
      classificationResult = await classifyMessage(message, normalizedMessage, entities);
    } catch (llmError) {
      return res.status(502).json({ error: 'Error connecting to classification engine.' });
    }

    // Return the combined response
    res.json({
      original_message: message,
      normalized_message: normalizedMessage,
      extracted_entities: entities,
      classification: classificationResult
    });

  } catch (err) {
    console.error('Scan endpoint error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Vernacular Phishing Classifier API running on http://localhost:${PORT}`);
  console.log(`Endpoint ready: POST http://localhost:${PORT}/api/scan`);
});
