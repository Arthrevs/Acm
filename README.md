<div align="center">
  <img src="https://api.iconify.design/lucide/shield-check.svg?color=%2360a5fa" width="80" alt="Shield Logo" />
  <h1>VG — VanniGuard</h1>
  <p><strong>Multi-Agent AI Security Pipeline · Hackathon Build</strong></p>
  <br/>
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Gemini_AI-3.6_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/Frontend-Vanilla_JS-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" />
  <img src="https://img.shields.io/badge/Agents-3_Consensus-8B5CF6?style=for-the-badge&logo=openai&logoColor=white" />
</div>

---

## <img src="https://api.iconify.design/lucide/crosshair.svg?color=%2360a5fa" width="20" /> &nbsp;What It Is

A next-generation security tool designed to detect **vernacular phishing and smishing attempts** — Hinglish, regional dialects, OLX marketplace scams, KYC fraud. Traditional regex-based scanners fail against transliterated conversational text (e.g., *"paise bhej do"* or *"QR scan karo"*). This project solves that using a **Multi-Agent Consensus Pipeline** powered by Google Gemini AI.

---

## <img src="https://api.iconify.design/lucide/brain-circuit.svg?color=%2360a5fa" width="20" /> &nbsp;How It Works (The 4-Layer Architecture)

Instead of sending raw text directly to an LLM (which is slow and expensive), the system uses a highly deterministic 4-layer funnel:

### <img src="https://api.iconify.design/lucide/eraser.svg?color=white" width="16" /> Layer 1: Context Normalizer
Strips out conversational filler ("Ok", "Haanji") and isolates high-risk chunks using a sliding window.

### <img src="https://api.iconify.design/lucide/calculator.svg?color=white" width="16" /> Layer 2: Heuristic Scorer
Runs rapid, deterministic rule checks (URLs, QR mentions, urgency). If the score is low, it marks the message as **SAFE** instantly. If high, it triggers the AI.

### <img src="https://api.iconify.design/lucide/bot.svg?color=white" width="16" /> Layer 3: Multi-Agent Consensus (The Core)

| Agent | Role | Behavior |
|-------|------|----------|
| <img src="https://api.iconify.design/lucide/scan-eye.svg?color=white" width="14" /> **Agent 1: The Paranoiac** | Threat Extractor | Blind to nuance. Only extracts raw exploit vectors. |
| <img src="https://api.iconify.design/lucide/users.svg?color=white" width="14" /> **Agent 2: The Context Arbiter** | Social Analyst | Blind to threats. Only evaluates power dynamics & trust patterns. |
| <img src="https://api.iconify.design/lucide/scale.svg?color=white" width="14" /> **Agent 3: The Chief Judge** | Consensus Engine | Weighs Agent 1 vs Agent 2. Applies **Overrule** or **Strike** framework. |

### <img src="https://api.iconify.design/lucide/shield-alert.svg?color=white" width="16" /> Layer 4: Verification Gate
Cross-references extracted URLs against a domain blacklist and uses Levenshtein distance to detect typosquatting against known Indian brands (Paytm, SBI, HDFC, etc.).

---

## <img src="https://api.iconify.design/lucide/folder-tree.svg?color=%2360a5fa" width="20" /> &nbsp;Project Structure

```text
📦 project-root
 ┣ 📂 backend
 ┃ ┣ 📂 agents          → paranoiac.js, contextArbiter.js, chiefJudge.js
 ┃ ┣ 📂 layers          → contextNormalizer.js, heuristicScorer.js, verificationGate.js
 ┃ ┣ 📂 services        → pipeline.js (orchestrator), llm.js (key rotation)
 ┃ ┣ 📂 utils           → normalizer.js (dictionary), extractor.js (regex)
 ┃ ┣ 📜 index.js        → Express server entry point
 ┃ ┗ 📜 .env            → Gemini API keys (not committed)
 ┣ 📂 frontend
 ┃ ┣ 📜 index.html      → Glassmorphism UI with pipeline step tracker
 ┃ ┣ 📜 style.css       → Theming, animations, consensus badges
 ┃ ┗ 📜 script.js       → API calls, DOM rendering, agent visualization
 ┗ 📜 README.md
```

---

## <img src="https://api.iconify.design/lucide/cloud-upload.svg?color=%2360a5fa" width="20" /> &nbsp;Vercel Deployment

This project is pre-configured for instant serverless deployment on Vercel. The included `vercel.json` automatically routes `/api` traffic to the Node.js Express backend and serves the `frontend` statically.

1. **Push to GitHub**: Ensure your latest code is pushed to your GitHub repository.
2. **Import on Vercel**: Log into [Vercel](https://vercel.com/) and create a new project by importing your GitHub repo.
3. **Environment Variables**: During the Vercel setup, open the **Environment Variables** tab and add your 3 API keys:
   - `GEMINI_API_KEY_1`
   - `GEMINI_API_KEY_2`
   - `GEMINI_API_KEY_3`
4. **Deploy**: Click Deploy. Vercel will automatically build the backend as a Serverless Function and host the frontend. No build command is required.

---

## <img src="https://api.iconify.design/lucide/rocket.svg?color=%2360a5fa" width="20" /> &nbsp;Localhost Setup

### <img src="https://api.iconify.design/lucide/download.svg?color=white" width="16" /> Prerequisites
- [Node.js](https://nodejs.org/) v16+ installed
- Gemini API Keys (from [Google AI Studio](https://aistudio.google.com/))

### <img src="https://api.iconify.design/lucide/terminal.svg?color=white" width="16" /> 1. Install Dependencies
```bash
cd backend
npm install
```

### <img src="https://api.iconify.design/lucide/key-round.svg?color=white" width="16" /> 2. Configure API Keys
Create a `.env` file inside `backend/`. The system uses round-robin key rotation across 3 keys to prevent rate-limiting during parallel agent execution:
```env
PORT=3000
GEMINI_API_KEY_1=your_first_key
GEMINI_API_KEY_2=your_second_key
GEMINI_API_KEY_3=your_third_key
```

### <img src="https://api.iconify.design/lucide/play.svg?color=white" width="16" /> 3. Start the Server
```bash
npm run dev
```

### <img src="https://api.iconify.design/lucide/globe.svg?color=white" width="16" /> 4. Open the App
The Express server serves the frontend automatically. Navigate to:

> **http://localhost:3000**

---

## <img src="https://api.iconify.design/lucide/monitor-check.svg?color=%2360a5fa" width="20" /> &nbsp;Frontend Features

- <img src="https://api.iconify.design/lucide/loader.svg?color=white" width="14" /> **5-Step Pipeline Tracker** — Live loading animation showing each agent's progress
- <img src="https://api.iconify.design/lucide/shield-check.svg?color=white" width="14" /> **Consensus Badge** — "Cleared by Consensus" / "Confirmed by Consensus" / "Split Consensus"
- <img src="https://api.iconify.design/lucide/test-tubes.svg?color=white" width="14" /> **Sample Chips** — One-click test messages (KYC Scam, Lottery Scam, Safe OLX Chat)
- <img src="https://api.iconify.design/lucide/layers.svg?color=white" width="14" /> **Pipeline Breakdown** — Full transparency into every layer's decision

---

<div align="center">
  <sub>Built for ACM Hackathon · Problem 14 · AI-Powered Vernacular SMS Phishing Classifier</sub>
</div>
