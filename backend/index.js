const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { runPipeline } = require('./services/pipeline');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
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
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid "message" field in request body.' });
    }

    // Run the full 4-layer pipeline
    const result = await runPipeline(message);
    res.json(result);

  } catch (err) {
    console.error('Scan endpoint error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Vernacular Phishing Classifier API running on http://localhost:${PORT}`);
    console.log(`   4-Layer Pipeline: Context → Heuristics → LLM → Verification`);
    console.log(`   Endpoint ready: POST http://localhost:${PORT}/api/scan`);
  });
}

// Export the Express API for Vercel Serverless Functions
module.exports = app;
