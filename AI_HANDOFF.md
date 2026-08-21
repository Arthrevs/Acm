# AI Handoff & Project Context (Vernacular SMS Phishing Classifier)

## 1. Project Identity & Goal
- **Problem Statement:** Problem 14 (ACM Hackathon) — Vernacular SMS Phishing Classifier.
- **Goal:** Detect phishing/smishing attempts in Hinglish/vernacular languages (e.g., OLX marketplace scams, advance payment fraud, KYC phishing) without relying solely on rigid regex.
- **Current Status:** Fully built, locally hosted, and pushed to GitHub. The backend is Node.js/Express, and the frontend is Vanilla HTML/CSS/JS. **NO DATABASE** is used.

## 2. System Architecture (The 4-Layer Pipeline)
The system uses a highly deterministic, multi-agent pipeline to save LLM costs and prevent hallucinations. The entry point is `POST /api/scan` in `backend/index.js`, which triggers `backend/services/pipeline.js`.

### Layer 1: Context & Length Normalizer (`backend/layers/contextNormalizer.js`)
- Strips conversational Hinglish filler (e.g., "Haanji", "Ok", "Hi").
- Uses a sliding-window to chunk the text.
- Scores each chunk for "friction density" (URLs, phone numbers, payment demands).
- Flags the highest density chunk as the "Message of Interest".

### Layer 2: Deterministic Heuristics (`backend/layers/heuristicScorer.js`)
- Runs purely rule-based checks before touching the AI.
- Adds points for: Suspicious URL shorteners (+40), QR code mentions (+30), Off-platform diversion (+20), Urgency (+15), Advance payment demands (+25).
- **Threshold:** If the score is `< 30`, the message is instantly marked `SAFE` (AI is skipped). If `>= 30`, it triggers the Layer 3 AI agents.

### Layer 3: Multi-Agent Consensus Pipeline (The AI Core)
If Layer 2 triggers, two isolated AI agents run in parallel, and a third resolves their conflict.
1. **Agent 1: The Paranoiac (`backend/agents/paranoiac.js`)**
   - Role: Strict threat extractor.
   - Behavior: Blind to nuance. Only extracts raw exploit vectors (unverified links, financial demands).
2. **Agent 2: The Context Arbiter (`backend/agents/contextArbiter.js`)**
   - Role: Social analyst.
   - Behavior: Blind to threats. Only determines the social scenario, power dynamics, and trust patterns (e.g., "Standard OLX negotiation").
3. **Agent 3: The Chief Judge (`backend/agents/chiefJudge.js`)**
   - Role: Serial consensus resolution.
   - Behavior: Weighs Agent 1 against Agent 2. 
   - *The Overrule:* If Agent 1 flags generic financial terms but Agent 2 confirms a natural marketplace negotiation, Agent 3 overrules Agent 1 and marks it SAFE.
   - *The Strike:* If Agent 1 finds links and Agent 2 sees manufactured trust, Agent 3 confirms SCAM.

### Layer 4: Verification Gate (`backend/layers/verificationGate.js`)
- Runs in parallel with the heuristics.
- Checks extracted URLs against a hardcoded domain blacklist.
- Uses Levenshtein distance to detect Typosquatting against known Indian brands (e.g., `paytm.com`, `sbi.co.in`).
- If this flags a critical threat, it hard-overrides the final verdict to `SCAM`, regardless of what the AI says.

## 3. Technology Stack & Key Files
- **Backend:** Node.js, Express (`backend/index.js`).
- **Frontend:** Vanilla JS/HTML/CSS served statically from `frontend/`.
- **LLM Provider:** Google Gemini API (`@google/generative-ai`).
- **Model Used:** `gemini-3.6-flash`.

## 4. Current Configuration & Known Issues

### API Key Rotation
To prevent rate-limiting during the parallel execution of Agent 1 and Agent 2, the `backend/services/llm.js` file is configured to rotate across 3 different Gemini API keys dynamically.
- Defined in `backend/.env` as `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GEMINI_API_KEY_3`.

### 503 Service Unavailable (Current Happening)
- **The Issue:** The application occasionally throws a `503 Service Unavailable` error from the Gemini API when attempting a scan.
- **The Cause:** This is **NOT** a code bug or rate-limit issue. It is a known server-side issue where Google's `gemini-3.6-flash` model is experiencing high global demand/traffic spikes.
- **Resolution:** Temporary. Wait a moment and try the scan again.

## 5. Frontend UI (`frontend/`)
- A Glassmorphism/Cybersecurity themed UI (`style.css`).
- Contains sample chips to instantly test "Lottery Scams", "Utility Scams", and a "Safe OLX Chat".
- **Dynamic Loader:** Features a 5-step step-tracker that updates live as the multi-agent pipeline progresses.
- **Consensus Badge:** Renders a "Cleared by Consensus", "Confirmed by Consensus", or "Split Consensus" badge detailing exactly how Agent 3 resolved the conflict between Agent 1 and Agent 2.
